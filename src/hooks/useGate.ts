import { useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { LearningSource } from '../core/types.ts';
import { getLesson } from '../core/registry.ts';

export interface GateResult {
  codeUnlocked: boolean;
  reason: string;
}

/**
 * Hook kiểm tra điều kiện mở khóa code cho Prompt 7
 * Cấp 1: Mở khi mọi keyIdeas đã đạt
 * Cấp 2: Mở khi đã hoàn thành dự đoán và rút ra quy tắc được công nhận >= 2/3 ý
 * Cấp 3: Mở khi hoàn thành mọi chặng (stages)
 * Cấp 4: Mở ngay lập tức
 */
export function useGate(
  sourceId: string,
  level: number,
  source?: LearningSource
): GateResult {
  const { state } = useApp();

  return useMemo(() => {
    // Quy tắc Prompt 6: Nếu source là bài tập (kind: 'problem'), BẮT BUỘC hoàn thành "Phân tích đề" ở MỌI cấp độ
    if (source?.kind === 'problem') {
      const analysisProgress = state.progress.levels[`${sourceId}|analysis`];
      const isAnalysisDone = Boolean(analysisProgress?.codeUnlocked);

      if (!isAnalysisDone) {
        return {
          codeUnlocked: false,
          reason: 'Cần hoàn thành phần "Phân tích đề" (Input, Output, N tối đa, Độ phức tạp) trước khi mở khóa viết code.',
        };
      }
    }

    // 1. Cấp 4: Luôn mở khóa ngay lập tức (khi đã xong Phân tích đề nếu là bài tập)
    if (level === 4) {
      return {
        codeUnlocked: true,
        reason: 'Được phép mở khóa trực tiếp để thực hành viết code ở Cấp độ 4.',
      };
    }

    const key = `${sourceId}|${level}`;
    const levelProgress = state.progress.levels[key];

    // Lấy thông tin nguồn học để tính tổng số ý / tổng số chặng
    const registered = getLesson(sourceId);
    const rubric = source?.rubric || registered?.content?.rubric;
    const stages = source?.lessons?.[0]?.stages || registered?.content?.stages || [];

    const totalKeyIdeas = rubric?.keyIdeas?.length || 3;
    const totalStages = stages.length || 2;

    // 2. Cấp 1: Mở khi mọi keyIdeas đã đạt
    if (level === 1) {
      const matchedCount = levelProgress?.matchedIdeas?.length || 0;
      const isComplete = levelProgress?.codeUnlocked || matchedCount >= totalKeyIdeas;

      if (isComplete) {
        return {
          codeUnlocked: true,
          reason: `Đã mở khóa code: Đạt trọn vẹn ${matchedCount}/${totalKeyIdeas} ý tưởng cốt lõi của bài toán.`,
        };
      }

      return {
        codeUnlocked: false,
        reason: `Cần đạt đủ tất cả ${totalKeyIdeas} ý cốt lõi trong Rubric (hiện tại đạt ${matchedCount}/${totalKeyIdeas} ý).`,
      };
    }

    // 3. Cấp 2: Đã hoàn thành dự đoán và rút ra quy tắc >= 2/3 ý
    if (level === 2) {
      const matchedCount = levelProgress?.matchedIdeas?.length || 0;
      const predictTotal = levelProgress?.predictTotal || 0;
      const predictCompleted = predictTotal > 0;
      const ratio = matchedCount / totalKeyIdeas;
      const isComplete = levelProgress?.codeUnlocked || (predictCompleted && ratio >= 2 / 3);

      if (isComplete) {
        return {
          codeUnlocked: true,
          reason: `Đã mở khóa code: Hoàn thành dự đoán và đạt ${matchedCount}/${totalKeyIdeas} ý quy tắc (>= 2/3).`,
        };
      }

      if (!predictCompleted) {
        return {
          codeUnlocked: false,
          reason: 'Cần hoàn thành chuỗi dự đoán các bước quan trọng của thuật toán trước khi mở khóa code.',
        };
      }

      return {
        codeUnlocked: false,
        reason: `Cần rút ra quy tắc thuật toán đạt ít nhất 2/3 số ý cốt lõi (hiện đạt ${matchedCount}/${totalKeyIdeas} ý).`,
      };
    }

    // 4. Cấp 3: Hoàn thành mọi chặng (stages)
    if (level === 3) {
      const stagesDone = levelProgress?.stagesDone || 0;
      const isComplete = levelProgress?.codeUnlocked || stagesDone >= totalStages;

      if (isComplete) {
        return {
          codeUnlocked: true,
          reason: `Đã mở khóa code: Đã hoàn thành toàn bộ ${totalStages}/${totalStages} chặng bài tập.`,
        };
      }

      return {
        codeUnlocked: false,
        reason: `Cần hoàn thành tất cả các chặng hướng dẫn trước khi viết code (hiện xong ${stagesDone}/${totalStages} chặng).`,
      };
    }

    return {
      codeUnlocked: false,
      reason: 'Cấp độ học tập không xác định.',
    };
  }, [sourceId, level, source, state.progress.levels]);
}
