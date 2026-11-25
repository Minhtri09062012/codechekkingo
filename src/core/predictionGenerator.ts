import { Step, Task, TestCase, Stage } from './types.ts';

export interface DeterministicQuestion {
  id: string;
  stepIndex: number;
  type: 'line' | 'var';
  prompt: string;
  options: string[];
  correctAnswer: string;
  explain: string;
}

/**
 * Chọn tối đa 5 bước quan trọng để hỏi dự đoán ở Cấp độ 2
 * Ưu tiên: step.key -> thay đổi biến -> highlights swap/found/done
 */
export function selectKeyStepsForPrediction(steps: Step[], codeLength: number): number[] {
  if (steps.length === 0) return [];
  if (steps.length <= 5) {
    return steps.map((_, i) => i);
  }

  const scoredSteps: { index: number; score: number }[] = [];

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    let score = 0;

    // 1. Ưu tiên cao nhất: key = true
    if (step.key) score += 100;

    // 2. Highlights quan trọng
    const hasSpecialHighlight = step.highlights.some(
      (h) => h.role === 'swap' || h.role === 'found' || h.role === 'done'
    );
    if (hasSpecialHighlight) score += 50;

    // 3. Biến thay đổi so với bước trước
    if (i > 0) {
      const prevVars = steps[i - 1].vars;
      const currVars = step.vars;
      const changed = Object.keys(currVars).some((k) => currVars[k] !== prevVars[k]);
      if (changed) score += 30;
    }

    // 4. Có output bước cuối
    if (step.output !== undefined) score += 40;

    scoredSteps.push({ index: i, score });
  }

  // Sắp xếp theo điểm giảm dần
  scoredSteps.sort((a, b) => b.score - a.score);

  // Chọn các bước có điểm cao nhưng cách nhau hợp lý (không quá liền kề nếu mảng dài)
  const chosenIndices: number[] = [];
  for (const item of scoredSteps) {
    if (chosenIndices.length >= 5) break;
    const isTooClose = chosenIndices.some((idx) => Math.abs(idx - item.index) < Math.floor(steps.length / 8));
    if (!isTooClose || chosenIndices.length < 2) {
      chosenIndices.push(item.index);
    }
  }

  // Nếu vẫn chưa đủ, lấy thêm theo phân bổ đều
  if (chosenIndices.length < 3) {
    const stride = Math.floor(steps.length / 4);
    for (let s = 1; s < steps.length - 1; s += stride) {
      if (!chosenIndices.includes(s) && chosenIndices.length < 5) {
        chosenIndices.push(s);
      }
    }
  }

  return chosenIndices.sort((a, b) => a - b);
}

/**
 * Sinh câu hỏi dự đoán tất định cho một bước
 */
export function generateQuestionForStep(
  stepIndex: number,
  steps: Step[],
  codeLength: number,
  preferredType?: 'line' | 'var'
): DeterministicQuestion {
  const currentStep = steps[stepIndex];
  const nextStep = stepIndex + 1 < steps.length ? steps[stepIndex + 1] : null;

  // Quyết định loại câu hỏi: xen kẽ giữa hỏi dòng và hỏi biến
  const type = preferredType || (stepIndex % 2 === 0 ? 'line' : 'var');

  if (type === 'line' && nextStep) {
    // Câu hỏi (a): "Dòng nào chạy tiếp theo?"
    const correctLine = nextStep.line;
    const distractors = new Set<number>();

    // Sinh 3 phương án nhiễu
    const candidates = [
      currentStep.line,
      correctLine + 1,
      correctLine - 1,
      1,
      codeLength,
      currentStep.line + 2,
    ];

    for (const c of candidates) {
      if (c >= 1 && c <= codeLength && c !== correctLine) {
        distractors.add(c);
        if (distractors.size === 3) break;
      }
    }

    // Nếu chưa đủ 3 nhiễu
    for (let l = 1; l <= codeLength; l++) {
      if (distractors.size >= 3) break;
      if (l !== correctLine) distractors.add(l);
    }

    const allOptions = [correctLine, ...Array.from(distractors)]
      .sort(() => (stepIndex % 2 === 0 ? -1 : 1))
      .map((l) => `Dòng ${l}`);

    return {
      id: `pred_line_${stepIndex}`,
      stepIndex,
      type: 'line',
      prompt: `Sau khi thực hiện dòng ${currentStep.line}, theo em dòng lệnh nào sẽ được thực thi tiếp theo?`,
      options: allOptions,
      correctAnswer: `Dòng ${correctLine}`,
      explain: currentStep.explain || `Lệnh chuyển tiếp tới dòng ${correctLine}.`,
    };
  }

  // Câu hỏi (b): "Sau bước này biến X bằng bao nhiêu?"
  // Tìm biến số có giá trị thay đổi hoặc biến đầu tiên
  const varKeys = Object.keys(currentStep.vars);
  let targetVar = varKeys[0] || 'kết quả';
  for (const k of varKeys) {
    if (stepIndex > 0 && currentStep.vars[k] !== steps[stepIndex - 1]?.vars[k]) {
      targetVar = k;
      break;
    }
  }

  const rawVal = currentStep.vars[targetVar];
  const correctVal = rawVal === null ? 'None' : String(rawVal);
  const distractors = new Set<string>();

  if (typeof rawVal === 'number') {
    distractors.add(String(rawVal + 1));
    distractors.add(String(rawVal - 1));
    distractors.add(String(rawVal * 2));
    distractors.add(String(Math.abs(rawVal)));
    distractors.add('0');
  } else if (typeof rawVal === 'boolean') {
    distractors.add(rawVal ? 'False' : 'True');
    distractors.add('None');
    distractors.add('0');
    distractors.add('1');
  } else {
    // string / others
    distractors.add(`"${correctVal}_tam"`);
    distractors.add('""');
    distractors.add('None');
    distractors.add('0');
  }

  // Lọc lấy 3 nhiễu khác đáp án đúng
  const optionsArr = [correctVal];
  for (const d of distractors) {
    if (d !== correctVal && optionsArr.length < 4) {
      optionsArr.push(d);
    }
  }

  // Đảm bảo đủ 4 phương án
  while (optionsArr.length < 4) {
    optionsArr.push(`Giá trị ${optionsArr.length}`);
  }

  // Hoán vị có tính quy luật
  optionsArr.sort((a, b) => a.localeCompare(b));

  return {
    id: `pred_var_${stepIndex}`,
    stepIndex,
    type: 'var',
    prompt: `Tại bước này, biến "${targetVar}" có giá trị là bao nhiêu?`,
    options: optionsArr,
    correctAnswer: correctVal,
    explain: currentStep.explain || `Biến ${targetVar} mang giá trị ${correctVal}.`,
  };
}

/**
 * Lấy 2-3 test cases nhỏ nhất từ task.tests cho Bước B2 Cấp độ 3
 */
export function getSmallestTests(task: Task, count = 3): TestCase[] {
  const tests = [...task.tests];
  tests.sort((a, b) => a.input.trim().length - b.input.trim().length);
  return tests.slice(0, count);
}

/**
 * So khớp chuẩn hóa đáp án của học sinh với kết quả mong đợi
 */
export function matchAnswerNormalized(studentAns: string, expectedAns: string): boolean {
  const normS = studentAns.trim().replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
  const normE = expectedAns.trim().replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
  return normS === normE;
}

/**
 * Lọc các bước mô phỏng thuộc về một chặng cụ thể
 */
export function filterStepsByStage(steps: Step[], stage: Stage): Step[] {
  const [startLine, endLine] = stage.codeLines;
  return steps.filter((s) => s.line >= startLine && s.line <= endLine);
}
