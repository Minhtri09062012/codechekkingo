import { ExamSet } from '../../core/types.ts';
import { set01 } from './hsg_tinh_01.ts';

export const examSets: ExamSet[] = [set01];

export function getExamSets(): ExamSet[] {
  return examSets;
}

export function getExamSet(id: string): ExamSet | undefined {
  return examSets.find((s) => s.id === id);
}
