import { ProgressState, LevelProgress } from '../core/types.ts';

export interface SampleStudentProfile {
  name: string;
  filename: string;
  progress: ProgressState;
}

const defaultLevelProgress: LevelProgress = {
  attempts: 1,
  matchedIdeas: ['idea-1'],
  hintLevel: 1,
  codeUnlocked: true,
  stagesDone: 3,
  predictRight: 3,
  predictTotal: 3,
};

export const SAMPLE_STUDENTS: SampleStudentProfile[] = [
  {
    name: 'Nguyễn Tuấn Anh',
    filename: 'nguyen_tuan_anh.json',
    progress: {
      version: 1,
      understood: [
        'concept-01-program-algorithm',
        'concept-02-variables',
        'concept-03-data-types',
        'concept-04-io-files',
        'concept-05-arithmetic-ops',
        'concept-06-assignment-swap',
        'concept-07-logic-compare',
        'concept-08-if-elif-else',
        'concept-09-nested-conditions',
        'algo-01-min-max',
      ],
      solved: {
        demkytu: { bestScore: 100, attempts: 2, lastAt: '2026-09-28T14:30:00Z' },
        cuasotruot: { bestScore: 100, attempts: 3, lastAt: '2026-09-29T10:15:00Z' },
        tongdoan: { bestScore: 90, attempts: 2, lastAt: '2026-09-30T16:00:00Z' },
        sodb: { bestScore: 85, attempts: 4, lastAt: '2026-10-01T09:20:00Z' },
        nhiphan: { bestScore: 95, attempts: 2, lastAt: '2026-10-02T11:45:00Z' },
      },
      errorBook: [
        {
          sourceId: 'sodb',
          testLabel: 'Biên số 0 và số nguyên tố nhỏ',
          type: 'wrong-edge',
          at: '2026-09-27T10:00:00Z',
        },
        {
          sourceId: 'tongdoan',
          testLabel: 'Mảng rỗng và truy vấn ngoài biên',
          type: 'wrong-edge',
          at: '2026-09-29T16:20:00Z',
        },
      ],
      levels: {
        'demkytu|4': defaultLevelProgress,
        'cuasotruot|4': defaultLevelProgress,
        'tongdoan|3': defaultLevelProgress,
        'sodb|3': defaultLevelProgress,
        'nhiphan|3': defaultLevelProgress,
      },
      placement: {
        completedAt: '2026-09-25T08:00:00Z',
        topicMastery: {
          1: 'mastered',
          2: 'mastered',
          3: 'mastered',
          4: 'mastered',
          5: 'review',
          6: 'review',
          7: 'not-started',
          8: 'not-started',
          9: 'not-started',
          10: 'not-started',
          11: 'not-started',
        },
        recommendedLessonId: 'concept-07-logic-compare',
        recommendedLevels: {
          1: 4,
          2: 4,
          3: 3,
          4: 3,
          5: 2,
          6: 2,
        },
        answers: {},
      },
    },
  },
  {
    name: 'Trần Minh Đức',
    filename: 'tran_minh_duc.json',
    progress: {
      version: 1,
      understood: [
        'concept-01-program-algorithm',
        'concept-02-variables',
        'concept-03-data-types',
        'concept-05-arithmetic-ops',
        'concept-07-logic-compare',
        'concept-08-if-elif-else',
        'algo-01-min-max',
      ],
      solved: {
        demkytu: { bestScore: 80, attempts: 3, lastAt: '2026-09-26T15:00:00Z' },
        cuasotruot: { bestScore: 60, attempts: 4, lastAt: '2026-09-28T09:00:00Z' },
        tongdoan: { bestScore: 70, attempts: 2, lastAt: '2026-09-30T14:30:00Z' },
      },
      errorBook: [
        {
          sourceId: 'demkytu',
          testLabel: 'Ký tự khoảng trắng và xuống dòng',
          type: 'wrong-format',
          at: '2026-09-25T11:00:00Z',
        },
        {
          sourceId: 'cuasotruot',
          testLabel: 'Cửa sổ k > n',
          type: 'wrong-edge',
          at: '2026-09-28T08:45:00Z',
        },
        {
          sourceId: 'cuasotruot',
          testLabel: 'Dữ liệu lớn n = 10^5',
          type: 'timeout',
          at: '2026-09-28T09:10:00Z',
        },
        {
          sourceId: 'tongdoan',
          testLabel: 'Chỉ số 0-based thay vì 1-based',
          type: 'wrong-algorithm',
          at: '2026-09-30T14:00:00Z',
        },
      ],
      levels: {
        'demkytu|2': defaultLevelProgress,
        'cuasotruot|2': defaultLevelProgress,
        'tongdoan|2': defaultLevelProgress,
      },
      placement: {
        completedAt: '2026-09-24T09:30:00Z',
        topicMastery: {
          1: 'mastered',
          2: 'review',
          3: 'review',
          4: 'not-started',
          5: 'not-started',
          6: 'not-started',
          7: 'not-started',
          8: 'not-started',
          9: 'not-started',
          10: 'not-started',
          11: 'not-started',
        },
        recommendedLessonId: 'concept-05-arithmetic-ops',
        recommendedLevels: {
          1: 3,
          2: 2,
          3: 2,
          4: 1,
        },
        answers: {},
      },
    },
  },
  {
    name: 'Lê Thu Hà',
    filename: 'le_thu_ha.json',
    progress: {
      version: 1,
      understood: [
        'concept-01-program-algorithm',
        'concept-02-variables',
        'concept-03-data-types',
        'concept-04-io-files',
      ],
      solved: {
        demkytu: { bestScore: 50, attempts: 5, lastAt: '2026-09-29T10:00:00Z' },
        tongdoan: { bestScore: 40, attempts: 3, lastAt: '2026-10-01T15:20:00Z' },
      },
      errorBook: [
        {
          sourceId: 'demkytu',
          testLabel: 'In thừa khoảng trắng cuối dòng',
          type: 'wrong-format',
          at: '2026-09-29T09:40:00Z',
        },
        {
          sourceId: 'demkytu',
          testLabel: 'Lỗi cú pháp Python IndentationError',
          type: 'runtime',
          at: '2026-09-29T09:50:00Z',
        },
        {
          sourceId: 'tongdoan',
          testLabel: 'Tính tổng lặp O(N*Q) dẫn đến quá thời gian',
          type: 'timeout',
          at: '2026-10-01T15:10:00Z',
        },
        {
          sourceId: 'tongdoan',
          testLabel: 'Truy vấn đoạn L > R',
          type: 'wrong-edge',
          at: '2026-10-01T15:15:00Z',
        },
        {
          sourceId: 'concept-05-arithmetic-ops',
          testLabel: 'Chia cho 0 (ZeroDivisionError)',
          type: 'runtime',
          at: '2026-10-02T08:30:00Z',
        },
      ],
      levels: {
        'demkytu|1': defaultLevelProgress,
        'tongdoan|1': defaultLevelProgress,
      },
      placement: {
        completedAt: '2026-09-23T14:00:00Z',
        topicMastery: {
          1: 'review',
          2: 'not-started',
          3: 'not-started',
          4: 'not-started',
          5: 'not-started',
          6: 'not-started',
          7: 'not-started',
          8: 'not-started',
          9: 'not-started',
          10: 'not-started',
          11: 'not-started',
        },
        recommendedLessonId: 'concept-02-variables',
        recommendedLevels: {
          1: 2,
          2: 1,
        },
        answers: {},
      },
    },
  },
];
