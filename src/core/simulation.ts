import { Lesson, Step } from './types.ts';
import { APP_NAME } from './brand.ts';

export interface SimulationResult {
  steps: Step[];
  isExceededLimit: boolean;
  mismatchWarning: string | null;
  totalSteps: number;
}

const MAX_STEPS = 500;

export function runSimulation(lesson: Lesson, parsedInput: unknown): SimulationResult {
  let rawSteps: Step[] = [];
  let isExceededLimit = false;

  try {
    rawSteps = lesson.generateSteps(parsedInput);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[${APP_NAME} Simulation Error]:`, err);
    return {
      steps: [{
        line: 1,
        vars: { 'Lỗi': errorMsg },
        highlights: [],
        explain: `Đã xảy ra lỗi khi tạo các bước mô phỏng: ${errorMsg}`,
        snapshot: null,
        ops: 0,
        output: 'Lỗi'
      }],
      isExceededLimit: false,
      mismatchWarning: `Lỗi thực thi: ${errorMsg}`,
      totalSteps: 1
    };
  }

  // Rule 2: Số bước tối đa 500; vượt quá thì cắt và báo "Dữ liệu quá lớn để mô phỏng"
  let steps = rawSteps;
  if (steps.length > MAX_STEPS) {
    isExceededLimit = true;
    steps = steps.slice(0, MAX_STEPS);
    // Cập nhật bước cuối cảnh báo
    const last = { ...steps[steps.length - 1] };
    last.explain = `${last.explain} (⚠️ Dữ liệu quá lớn để mô phỏng: Đã cắt sau ${MAX_STEPS} bước để bảo vệ trình duyệt).`;
    steps[steps.length - 1] = last;
  }

  // Rule 3: Step.line luôn nằm trong [1, code.length]
  const codeLen = Math.max(1, lesson.code.length);
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    if (s.line < 1 || s.line > codeLen) {
      console.warn(`[${APP_NAME}] Bước ${i + 1} có line=${s.line} nằm ngoài phạm vi [1, ${codeLen}]`);
      s.line = Math.min(Math.max(1, s.line), codeLen);
    }
  }

  // Rule 3: Bước cuối có output và so sánh với reference(input)
  let mismatchWarning: string | null = null;
  try {
    const expectedOutput = String(lesson.reference(parsedInput)).trim();
    const lastStep = steps[steps.length - 1];

    if (lastStep) {
      if (lastStep.output === undefined) {
        lastStep.output = expectedOutput;
      }
      const actualOutput = String(lastStep.output).trim();
      if (actualOutput !== expectedOutput) {
        mismatchWarning = `Cảnh báo đối chiếu: Output của bước cuối (${actualOutput}) không khớp với hàm tham chiếu reference() (${expectedOutput}).`;
      }
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    mismatchWarning = `Lỗi khi chạy hàm reference(input): ${errorMsg}`;
  }

  return {
    steps,
    isExceededLimit,
    mismatchWarning,
    totalSteps: steps.length
  };
}
