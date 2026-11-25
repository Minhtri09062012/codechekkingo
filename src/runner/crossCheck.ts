import { Lesson, Problem } from '../core/types.ts';
import { runPythonTest } from './pyRunner.ts';
import { normalizeOutput, assembleTestCases } from './testSuite.ts';

export interface CrossCheckError {
  sourceId: string;
  testLabel: string;
  expected: string;
  actual: string;
  message: string;
}

/**
 * Chạy kiểm chéo (dev check) task.referenceSolution trên các bài học hoặc bài tập
 * Kiểm tra xem code chuẩn Python có ra đúng kết quả như bộ test và reference JS không
 */
export async function crossCheckItem(
  sourceId: string,
  task: import('../core/types.ts').Task,
  lessons: Lesson[]
): Promise<CrossCheckError[]> {
  const errors: CrossCheckError[] = [];
  const refCode = task.referenceSolution?.trim();

  if (!refCode) {
    errors.push({
      sourceId,
      testLabel: 'Cấu hình bài',
      expected: 'Có referenceSolution',
      actual: 'Rỗng',
      message: `[Dev Kiểm Chéo] Bài "${sourceId}" chưa có task.referenceSolution hợp lệ.`,
    });
    return errors;
  }

  const tests = assembleTestCases(task, lessons);

  // Chỉ kiểm tra trên tối đa 3 test đầu tiên (gồm ví dụ, biên, preset) để giữ dev check nhanh gọn
  const sampleTests = tests.slice(0, 4);

  for (const t of sampleTests) {
    const runRes = await runPythonTest(refCode, t.input, task.ioMode, 3);
    const normAct = normalizeOutput(runRes.output);
    const normExp = normalizeOutput(t.output);

    if (runRes.status !== 'ok' || normAct !== normExp) {
      errors.push({
        sourceId,
        testLabel: t.label || 'Test',
        expected: normExp,
        actual: runRes.status === 'ok' ? normAct : `[${runRes.status}] ${runRes.error?.message || ''}`,
        message: `[Dev Kiểm Chéo] Bài "${sourceId}" bị lệch ở test "${t.label}": Python referenceSolution ra "${normAct}" trong khi mong đợi "${normExp}"`,
      });
    }
  }

  return errors;
}
