import { PYODIDE_WORKER_SCRIPT } from './pyodideWorkerCode.ts';
import { FriendlyError, translatePythonError } from './errorTranslator.ts';
import { Step } from '../core/types.ts';

export interface TestRunResult {
  status: 'ok' | 'runtime' | 'timeout' | 'cdn_error';
  output: string;
  error?: FriendlyError;
  elapsedMs: number;
}

export interface TraceRunResult {
  status: 'ok' | 'runtime' | 'timeout' | 'cdn_error';
  steps: Step[];
  finalOutput: string;
  error?: FriendlyError;
}

let workerInstance: Worker | null = null;
let msgIdCounter = 0;
let initPromise: Promise<void> | null = null;

function getWorker(): Worker {
  if (!workerInstance) {
    const blob = new Blob([PYODIDE_WORKER_SCRIPT], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    workerInstance = new Worker(url);
  }
  return workerInstance;
}

function terminateWorker() {
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }
  initPromise = null;
}

/**
 * Khởi tạo Pyodide trước nếu cần (tách riêng thời gian tải CDN khỏi thời gian chạy code)
 */
export async function initPyodideWorker(): Promise<{ ok: boolean; error?: string }> {
  if (initPromise) {
    return initPromise
      .then(() => ({ ok: true }))
      .catch((e) => ({ ok: false, error: e?.message || 'Khởi tạo Pyodide thất bại' }));
  }

  initPromise = new Promise<void>((resolve, reject) => {
    try {
      const worker = getWorker();
      const id = ++msgIdCounter;
      let settled = false;

      const initTimer = setTimeout(() => {
        if (!settled) {
          settled = true;
          worker.removeEventListener('message', handler);
          worker.removeEventListener('error', errHandler);
          terminateWorker();
          reject(
            new Error(
              'Quá thời gian tải môi trường Python (Pyodide) từ CDN. Vui lòng kiểm tra kết nối Internet và thử lại.'
            )
          );
        }
      }, 35000);

      const handler = (e: MessageEvent) => {
        if (e.data && e.data.id === id) {
          if (settled) return;
          settled = true;
          clearTimeout(initTimer);
          worker.removeEventListener('message', handler);
          worker.removeEventListener('error', errHandler);
          if (e.data.type === 'INIT_OK') {
            resolve();
          } else {
            reject(new Error(e.data.error || 'Khởi tạo Pyodide thất bại'));
          }
        }
      };

      const errHandler = (err: ErrorEvent) => {
        if (settled) return;
        settled = true;
        clearTimeout(initTimer);
        worker.removeEventListener('message', handler);
        worker.removeEventListener('error', errHandler);
        reject(new Error(err?.message || 'Lỗi Web Worker khi khởi tạo Python'));
      };

      worker.addEventListener('message', handler);
      worker.addEventListener('error', errHandler);
      worker.postMessage({ id, type: 'INIT' });
    } catch (err: any) {
      reject(err);
    }
  });

  try {
    await initPromise;
    return { ok: true };
  } catch (err: any) {
    terminateWorker();
    return {
      ok: false,
      error:
        err?.message ||
        'Không thể nạp thư viện Python Pyodide từ CDN. Vui lòng kiểm tra kết nối Internet để chạy mã Python.',
    };
  }
}

/**
 * Chạy 1 test case với code Python
 */
export async function runPythonTest(
  code: string,
  input: string,
  ioMode: { kind: 'stdio' } | { kind: 'file'; inputFile: string; outputFile: string } = { kind: 'stdio' },
  timeLimitSec: number = 3
): Promise<TestRunResult> {
  const initRes = await initPyodideWorker();
  if (!initRes.ok) {
    return {
      status: 'cdn_error',
      output: '',
      error: translatePythonError(initRes.error || 'Lỗi nạp Pyodide'),
      elapsedMs: 0,
    };
  }

  return new Promise<TestRunResult>((resolve) => {
    let worker: Worker;
    try {
      worker = getWorker();
    } catch (err: any) {
      return resolve({
        status: 'cdn_error',
        output: '',
        error: translatePythonError(err?.message || 'Không tạo được Worker'),
        elapsedMs: 0,
      });
    }

    const id = ++msgIdCounter;
    let execStartTime = Date.now();
    let completed = false;
    let timer: any = null;

    const armTimeout = () => {
      if (timer) clearTimeout(timer);
      execStartTime = Date.now();
      timer = setTimeout(() => {
        if (!completed) {
          completed = true;
          worker.removeEventListener('message', handler);
          worker.removeEventListener('error', errHandler);
          terminateWorker(); // Dừng worker để huỷ vòng lặp vô hạn
          const elapsedMs = Date.now() - execStartTime;
          resolve({
            status: 'timeout',
            output: '',
            error: translatePythonError('Timeout: Quá thời gian thực thi.'),
            elapsedMs,
          });
        }
      }, timeLimitSec * 1000);
    };

    const handler = (e: MessageEvent) => {
      if (!e.data || e.data.id !== id || completed) return;

      if (e.data.type === 'EXEC_STARTED') {
        armTimeout();
        return;
      }

      completed = true;
      if (timer) clearTimeout(timer);
      worker.removeEventListener('message', handler);
      worker.removeEventListener('error', errHandler);

      const elapsedMs = Date.now() - execStartTime;

      if (e.data.type === 'EXEC_TEST_OK') {
        resolve({
          status: 'ok',
          output: e.data.output || '',
          elapsedMs,
        });
      } else if (e.data.type === 'INIT_ERROR') {
        resolve({
          status: 'cdn_error',
          output: '',
          error: translatePythonError(e.data.error || 'Lỗi nạp Pyodide'),
          elapsedMs,
        });
      } else {
        const rawErr = e.data.error || 'Lỗi không xác định';
        resolve({
          status: 'runtime',
          output: '',
          error: translatePythonError(rawErr),
          elapsedMs,
        });
      }
    };

    const errHandler = (err: ErrorEvent) => {
      if (completed) return;
      completed = true;
      if (timer) clearTimeout(timer);
      worker.removeEventListener('message', handler);
      worker.removeEventListener('error', errHandler);
      terminateWorker();
      resolve({
        status: 'runtime',
        output: '',
        error: translatePythonError(err?.message || 'Lỗi Web Worker khi chạy Python'),
        elapsedMs: Date.now() - execStartTime,
      });
    };

    // Dự phòng nếu worker chưa gửi EXEC_STARTED trong 10s
    timer = setTimeout(() => {
      if (!completed) {
        completed = true;
        worker.removeEventListener('message', handler);
        worker.removeEventListener('error', errHandler);
        terminateWorker();
        resolve({
          status: 'timeout',
          output: '',
          error: translatePythonError('Timeout: Quá thời gian thực thi.'),
          elapsedMs: Date.now() - execStartTime,
        });
      }
    }, Math.max(timeLimitSec * 1000, 10000));

    worker.addEventListener('message', handler);
    worker.addEventListener('error', errHandler);
    worker.postMessage({
      id,
      type: 'EXEC_TEST',
      payload: { code, input, ioMode },
    });
  });
}

/**
 * Chạy code học sinh với sys.settrace để thu thập từng bước (Line, Vars, Highlights)
 * Tối đa 500 bước, biến cắt ngắn 40 ký tự
 */
export async function runPythonTrace(
  code: string,
  input: string,
  maxSteps: number = 500,
  timeLimitSec: number = 4
): Promise<TraceRunResult> {
  const initRes = await initPyodideWorker();
  if (!initRes.ok) {
    return {
      status: 'cdn_error',
      steps: [],
      finalOutput: '',
      error: translatePythonError(initRes.error || 'Lỗi nạp Pyodide'),
    };
  }

  return new Promise<TraceRunResult>((resolve) => {
    let worker: Worker;
    try {
      worker = getWorker();
    } catch (err: any) {
      return resolve({
        status: 'cdn_error',
        steps: [],
        finalOutput: '',
        error: translatePythonError(err?.message || 'Không tạo được Worker'),
      });
    }

    const id = ++msgIdCounter;
    let completed = false;
    let timer: any = null;

    const armTimeout = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (!completed) {
          completed = true;
          worker.removeEventListener('message', handler);
          worker.removeEventListener('error', errHandler);
          terminateWorker();
          resolve({
            status: 'timeout',
            steps: [],
            finalOutput: '',
            error: translatePythonError('Timeout: Quá thời gian khi mô phỏng code học sinh.'),
          });
        }
      }, timeLimitSec * 1000);
    };

    const handler = (e: MessageEvent) => {
      if (!e.data || e.data.id !== id || completed) return;

      if (e.data.type === 'EXEC_STARTED') {
        armTimeout();
        return;
      }

      completed = true;
      if (timer) clearTimeout(timer);
      worker.removeEventListener('message', handler);
      worker.removeEventListener('error', errHandler);

      if (e.data.type === 'EXEC_TRACE_OK') {
        const raw = e.data.data;
        const rawSteps = raw.steps || [];
        const finalOutput = raw.finalOutput || '';
        const runtimeError = raw.runtimeError ? translatePythonError(raw.runtimeError) : undefined;

        const steps: Step[] = rawSteps.map((s: any, idx: number) => {
          const isLast = idx === rawSteps.length - 1;
          const varList = Object.entries(s.vars || {})
            .map(([k, v]) => `${k} = ${v}`)
            .join(', ');

          return {
            line: s.line || 1,
            vars: s.vars || {},
            highlights: [],
            explain: `Dòng ${s.line}${varList ? `: ${varList}` : ''}`,
            snapshot: s.vars || {},
            ops: s.ops || idx + 1,
            output: isLast ? finalOutput : undefined,
          };
        });

        resolve({
          status: runtimeError ? 'runtime' : 'ok',
          steps,
          finalOutput,
          error: runtimeError,
        });
      } else {
        resolve({
          status: 'runtime',
          steps: [],
          finalOutput: '',
          error: translatePythonError(e.data.error || 'Lỗi khi mô phỏng'),
        });
      }
    };

    const errHandler = (err: ErrorEvent) => {
      if (completed) return;
      completed = true;
      if (timer) clearTimeout(timer);
      worker.removeEventListener('message', handler);
      worker.removeEventListener('error', errHandler);
      terminateWorker();
      resolve({
        status: 'runtime',
        steps: [],
        finalOutput: '',
        error: translatePythonError(err?.message || 'Lỗi Web Worker khi mô phỏng Python'),
      });
    };

    timer = setTimeout(() => {
      if (!completed) {
        completed = true;
        worker.removeEventListener('message', handler);
        worker.removeEventListener('error', errHandler);
        terminateWorker();
        resolve({
          status: 'timeout',
          steps: [],
          finalOutput: '',
          error: translatePythonError('Timeout: Quá thời gian khi mô phỏng code học sinh.'),
        });
      }
    }, Math.max(timeLimitSec * 1000, 10000));

    worker.addEventListener('message', handler);
    worker.addEventListener('error', errHandler);
    worker.postMessage({
      id,
      type: 'EXEC_TRACE',
      payload: { code, input, maxSteps },
    });
  });
}
