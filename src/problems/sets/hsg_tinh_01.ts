import { ExamSet } from '../../core/types.ts';

export const set01: ExamSet = {
  id: 'set-hsg-tinh-01',
  title: 'Đề luyện thi Học sinh giỏi Tin học - Bộ đề số 01',
  description: 'Bộ đề thi chuẩn 4 bài rèn luyện tư duy thuật toán theo cấu trúc đề thi HSG Tỉnh và Olympic Tin học.',
  problemIds: ['demkytu', 'tongdoan', 'nhiphan', 'xeplich'],
  durationMin: 60,
  note: 'Thời gian: 60 phút. Tắt mô phỏng và gợi ý trong khi thi. Hệ thống tự động chấm điểm theo từng subtask và tự động nộp bài khi hết giờ.',
};
