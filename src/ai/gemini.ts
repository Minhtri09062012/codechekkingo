import { Rubric } from '../core/types.ts';
import { AiRubricEvaluation, FailingTestDiagnostic } from './aiPrompts.ts';
import {
  evaluateWithRubricFallback,
  explainCodeLineFallback,
  diagnoseFailingTestFallback,
} from './rubricCheck.ts';

export function getIsAiRunning(): boolean {
  return false;
}

export interface RubricEvaluationResult {
  evaluation: AiRubricEvaluation;
  isFallback: boolean;
  statusMessage?: string;
}

/**
 * Chấm Rubric bằng bộ so khớp từ khóa cục bộ theo tiêu chí bài học
 */
export async function evaluateStudentAnswer(params: {
  statement: string;
  rubric: Rubric;
  studentText: string;
  attemptNo: number;
  previousFeedback?: string;
  hiddenReference: string;
  mode?: 'level1' | 'level2_rule';
}): Promise<RubricEvaluationResult> {
  const { rubric, studentText, attemptNo } = params;
  return {
    evaluation: evaluateWithRubricFallback({ rubric, studentText, attemptNo }),
    isFallback: false,
  };
}

/**
 * Giải thích dòng code bằng bộ phân tích cú pháp cục bộ (Cấp 4)
 */
export async function explainCodeLineWithAi(params: {
  codeLine: string;
  lineNote: string;
  lineNumber: number;
  lessonTitle: string;
  codeContext: string[];
}): Promise<{ explanation: string; isFallback: boolean }> {
  const { codeLine, lineNote, lineNumber } = params;
  return {
    explanation: explainCodeLineFallback(codeLine, lineNote, lineNumber),
    isFallback: false,
  };
}

/**
 * Giải thích vì sao cách làm này đúng và nhanh (Cấp 4 lớp 3)
 */
export async function explainWhyFastWithAi(params: {
  lessonTitle: string;
  statement: string;
  code: string[];
  analysisNote?: string;
}): Promise<{ explanation: string; isFallback: boolean }> {
  const { analysisNote } = params;
  return {
    explanation:
      analysisNote ||
      'Thuật toán này thực hiện từng bước tuần tự có mục đích rõ ràng, tránh tính toán dư thừa và luôn hoàn thành trong giới hạn tài nguyên cho phép của bài toán.',
    isFallback: false,
  };
}

/**
 * Phân tích test sai nhỏ nhất bằng bộ kiểm tra quy tắc cục bộ
 */
export async function diagnoseFailingTestWithGemini(params: {
  statement: string;
  constraints: string;
  studentCode: string;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  commonMistakes: string[];
}): Promise<{ diagnostic: FailingTestDiagnostic; isFallback: boolean }> {
  const { input, expectedOutput, actualOutput, commonMistakes } = params;
  return {
    diagnostic: diagnoseFailingTestFallback({
      input,
      expectedOutput,
      actualOutput,
      commonMistakes,
    }),
    isFallback: false,
  };
}
