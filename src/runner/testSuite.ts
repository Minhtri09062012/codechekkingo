import { Task, TestCase, Lesson, ErrorEntry } from '../core/types.ts';
import { runPythonTest, TestRunResult } from './pyRunner.ts';
import { FriendlyError } from './errorTranslator.ts';

export interface JudgedTestResult {
  index: number;
  test: TestCase;
  status: 'passed' | 'wrong_answer' | 'timeout' | 'runtime' | 'format_error' | 'cdn_error';
  actualOutput: string;
  expectedOutput: string;
  error?: FriendlyError;
  elapsedMs: number;
  errorType?: ErrorEntry['type'];
}

export interface SubtaskResult {
  id: number;
  points: number;
  description: string;
  testsCount: number;
  passedCount: number;
  earnedPoints: number;
}

export interface SubmissionReport {
  score: number;
  totalPoints: number;
  passedCount: number;
  totalTests: number;
  testResults: JudgedTestResult[];
  subtaskResults: SubtaskResult[];
  smallestFailedTest?: JudgedTestResult;
  errorsToRecord: ErrorEntry[];
  summaryMessage: string;
}

/**
 * Chuẩn hóa chuỗi đầu ra: bỏ khoảng trắng thừa cuối mỗi dòng, bỏ các dòng trống ở cuối.
 */
export function normalizeOutput(str: string): string {
  if (!str) return '';
  return str
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trimEnd();
}

/**
 * Kiểm tra xem 2 chuỗi có chỉ khác nhau về định dạng (khoảng trắng / xuống dòng / hoa thường) hay không
 */
export function isFormatDifference(actual: string, expected: string): boolean {
  const normAct = normalizeOutput(actual);
  const normExp = normalizeOutput(expected);

  if (normAct === normExp) return false;

  // So sánh khi loại bỏ hoàn toàn khoảng trắng và đổi về chữ thường
  const actCompact = normAct.replace(/\s+/g, ' ').toLowerCase();
  const expCompact = normExp.replace(/\s+/g, ' ').toLowerCase();
  if (actCompact === expCompact) return true;

  const actNoSpace = normAct.replace(/\s+/g, '');
  const expNoSpace = normExp.replace(/\s+/g, '');
  return actNoSpace === expNoSpace;
}

/**
 * Tạo bộ test tổng hợp theo Quy tắc 9:
 * Bộ test = task.tests + tự động thêm toàn bộ preset của lesson (toStdin + reference, dedupe)
 */
export function assembleTestCases(task: Task, lessons: Lesson[]): TestCase[] {
  const seenInputs = new Set<string>();
  const allTests: TestCase[] = [];

  // 1. Thêm các test có sẵn trong task.tests
  for (let i = 0; i < task.tests.length; i++) {
    const t = task.tests[i];
    const key = t.input.trim();
    seenInputs.add(key);
    allTests.push({
      ...t,
      label: t.label || (i === 0 ? 'Ví dụ 1' : i === 1 ? 'Ví dụ 2' : `Test #${i + 1}`),
      subtask: t.subtask || 1,
    });
  }

  // 2. Tự động thêm presets từ lessons liên quan theo Quy tắc 9
  for (const les of lessons) {
    if (!les.sample || !Array.isArray(les.sample.presets)) continue;
    for (const preset of les.sample.presets) {
      try {
        const parsed = les.sample.parse(preset.input);
        if (parsed.ok) {
          const stdin = les.sample.toStdin(parsed.value);
          const key = stdin.trim();
          if (!seenInputs.has(key)) {
            seenInputs.add(key);
            const expectedOut = les.reference(parsed.value);
            allTests.push({
              input: stdin,
              output: expectedOut,
              label: `Preset: ${preset.name}`,
              isPublic: true,
              subtask: 1,
            });
          }
        }
      } catch (err) {
        console.warn(`Lỗi khi trích xuất preset "${preset.name}" của bài "${les.id}":`, err);
      }
    }
  }

  return allTests;
}

/**
 * Phân loại loại lỗi phục vụ Sổ tay lỗi (errorBook):
 * - wrong-algorithm khi sai test ngẫu nhiên
 * - wrong-edge khi sai test biên
 * - wrong-format khi khác nhau chỉ ở định dạng
 * - timeout
 * - runtime
 */
export function categorizeError(
  test: TestCase,
  status: 'wrong_answer' | 'timeout' | 'runtime' | 'format_error'
): ErrorEntry['type'] {
  if (status === 'timeout') return 'timeout';
  if (status === 'runtime') return 'runtime';
  if (status === 'format_error') return 'wrong-format';

  const labelLower = (test.label || '').toLowerCase();
  if (
    labelLower.includes('biên') ||
    labelLower.includes('edge') ||
    labelLower.includes('cực tiểu') ||
    labelLower.includes('cực đại') ||
    test.input.trim() === '0' ||
    test.input.trim() === '1' ||
    test.input.trim().length <= 2
  ) {
    return 'wrong-edge';
  }

  return 'wrong-algorithm';
}

/**
 * Chấm toàn bộ bộ test cho code Python (Pyodide)
 */
export async function gradeSubmission(
  sourceId: string,
  task: Task,
  lessons: Lesson[],
  code: string,
  onProgress?: (current: number, total: number) => void
): Promise<SubmissionReport> {
  const tests = assembleTestCases(task, lessons);
  const timeLimit = task.timeLimitSec || 3;
  const testResults: JudgedTestResult[] = [];
  const errorsToRecord: ErrorEntry[] = [];

  for (let i = 0; i < tests.length; i++) {
    const t = tests[i];
    if (onProgress) onProgress(i + 1, tests.length);

    const runRes: TestRunResult = await runPythonTest(
      code,
      t.input,
      task.ioMode,
      timeLimit
    );

    const normActual = normalizeOutput(runRes.output);
    const normExpected = normalizeOutput(t.output);

    let status: JudgedTestResult['status'] = 'passed';
    let errType: ErrorEntry['type'] | undefined = undefined;

    if (runRes.status === 'cdn_error') {
      status = 'cdn_error';
    } else if (runRes.status === 'timeout') {
      status = 'timeout';
      errType = 'timeout';
    } else if (runRes.status === 'runtime') {
      status = 'runtime';
      errType = 'runtime';
    } else if (normActual === normExpected) {
      status = 'passed';
    } else if (isFormatDifference(runRes.output, t.output)) {
      status = 'format_error';
      errType = 'wrong-format';
    } else {
      status = 'wrong_answer';
      errType = categorizeError(t, 'wrong_answer');
    }

    const judged: JudgedTestResult = {
      index: i + 1,
      test: t,
      status,
      actualOutput: runRes.output,
      expectedOutput: t.output,
      error: runRes.error,
      elapsedMs: runRes.elapsedMs,
      errorType: errType,
    };

    testResults.push(judged);

    if (errType) {
      errorsToRecord.push({
        sourceId,
        testLabel: t.label || `Test #${i + 1}`,
        type: errType,
        at: new Date().toISOString(),
      });
    }
  }

  // Tính điểm theo Subtasks nếu có, chỉ tính các subtask thực sự có test trong lần chấm này
  const rawSubtasks = task.subtasks && task.subtasks.length > 0
    ? task.subtasks
    : [{ id: 1, points: 100, description: 'Toàn bộ bài thi' }];

  const populatedSubtasks = rawSubtasks.filter((st) =>
    testResults.some((r) => (r.test.subtask || 1) === st.id)
  );
  const subtasks = populatedSubtasks.length > 0
    ? populatedSubtasks
    : [{ id: 1, points: 100, description: 'Toàn bộ bài thi' }];

  const subtaskResults: SubtaskResult[] = subtasks.map((st) => {
    const stTests = testResults.filter((r) => (r.test.subtask || 1) === st.id);
    const passedSt = stTests.filter((r) => r.status === 'passed').length;
    const isAllPassed = stTests.length > 0 && passedSt === stTests.length;
    const earned = isAllPassed
      ? st.points
      : Math.floor((passedSt / Math.max(1, stTests.length)) * st.points);

    return {
      id: st.id,
      points: st.points,
      description: st.description,
      testsCount: stTests.length,
      passedCount: passedSt,
      earnedPoints: earned,
    };
  });

  const totalPoints = subtasks.reduce((sum, st) => sum + st.points, 0);
  const score = subtaskResults.reduce((sum, st) => sum + st.earnedPoints, 0);
  const passedCount = testResults.filter((r) => r.status === 'passed').length;

  // Tìm test SAI NHỎ NHẤT (input ngắn nhất)
  const failedTests = testResults.filter((r) => r.status !== 'passed');
  failedTests.sort((a, b) => a.test.input.length - b.test.input.length);
  const smallestFailedTest = failedTests[0];

  let summaryMessage = '';
  if (passedCount === tests.length) {
    summaryMessage = `Tuyệt vời! Chúc mừng em đã vượt qua toàn bộ ${tests.length}/${tests.length} test (100 điểm)!`;
  } else {
    summaryMessage = `Em đã đạt ${score}/${totalPoints} điểm (Đúng ${passedCount}/${tests.length} test). Hãy quan sát test sai nhỏ nhất để sửa bài nhé!`;
  }

  return {
    score,
    totalPoints,
    passedCount,
    totalTests: tests.length,
    testResults,
    subtaskResults,
    smallestFailedTest,
    errorsToRecord,
    summaryMessage,
  };
}

/**
 * Chấm cho bài kind === 'predict' (Không cần chạy Pyodide)
 */
export function gradePredictSubmission(
  sourceId: string,
  task: Task,
  studentOutput: string
): SubmissionReport {
  const tests = task.tests;
  const targetTest = tests[0] || { input: '', output: '' };

  const normActual = normalizeOutput(studentOutput);
  const normExpected = normalizeOutput(targetTest.output);

  let status: JudgedTestResult['status'] = 'passed';
  let errType: ErrorEntry['type'] | undefined = undefined;

  if (normActual === normExpected) {
    status = 'passed';
  } else if (isFormatDifference(studentOutput, targetTest.output)) {
    status = 'format_error';
    errType = 'wrong-format';
  } else {
    status = 'wrong_answer';
    errType = 'wrong-algorithm';
  }

  const judged: JudgedTestResult = {
    index: 1,
    test: targetTest,
    status,
    actualOutput: studentOutput,
    expectedOutput: targetTest.output,
    elapsedMs: 0,
    errorType: errType,
  };

  const isPassed = status === 'passed';
  const score = isPassed ? 100 : 0;
  const errorsToRecord: ErrorEntry[] = errType
    ? [
        {
          sourceId,
          testLabel: targetTest.label || 'Dự đoán đầu ra',
          type: errType,
          at: new Date().toISOString(),
        },
      ]
    : [];

  return {
    score,
    totalPoints: 100,
    passedCount: isPassed ? 1 : 0,
    totalTests: 1,
    testResults: [judged],
    subtaskResults: [
      {
        id: 1,
        points: 100,
        description: 'Dự đoán kết quả thực thi',
        testsCount: 1,
        passedCount: isPassed ? 1 : 0,
        earnedPoints: score,
      },
    ],
    smallestFailedTest: isPassed ? undefined : judged,
    errorsToRecord,
    summaryMessage: isPassed
      ? 'Chính xác! Em đã hiểu rất rõ luồng bộ nhớ và quy tắc thực thi của Python.'
      : 'Dự đoán chưa chính xác. Em hãy kiểm tra kỹ từng bước biến đổi nhé!',
  };
}
