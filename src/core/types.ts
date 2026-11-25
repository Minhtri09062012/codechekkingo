import React from 'react';

export type Mode = 'concept' | 'algorithm' | 'problem';

export type Level = 'nen-tang' | 'co-ban' | 'trung-cap' | 'nang-cao';
export type ContestTag = 'core' | 'useful' | 'extra';
export type RendererKind =
  | 'text'
  | 'vars'
  | 'array'
  | 'grid'
  | 'string'
  | 'table'
  | 'callstack'
  | 'tree'
  | 'graph'
  | 'memory'
  | 'objects'
  | 'queue-stack';

// ---- Siêu dữ liệu: khai báo DUY NHẤT trong src/core/catalog.ts ----
export interface CatalogEntry {
  id: string;
  kind: 'concept' | 'algorithm';
  order: number;
  group: string;
  groupOrder: number;
  title: string;
  summary: string;
  level: Level;
  contest: ContestTag;
  prerequisites: string[];
  topicNo?: number;
  rendererKind: RendererKind;
}

// ---- Nhập liệu cho mô phỏng ----
export interface InputField {
  key: string;
  label: string;
  placeholder: string;
  help?: string;
  kind: 'int' | 'intList' | 'string' | 'matrix' | 'intPair' | 'choice' | 'edgeList';
  options?: string[]; // dùng cho kind 'choice'
}
export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

// ---- Một bước mô phỏng ----
export interface TextSnapshot {
  stdin: string[];
  stdinPos: number;
  stdout: string[];
  files?: { name: string; content: string }[];
}

export interface ArraySnapshot {
  arrays: {
    name: string;
    values: (number | string)[];
    pointers?: { name: string; index: number }[];
  }[];
}

export interface GridSnapshot {
  grid: (number | string)[][];
  pointers?: { name: string; r: number; c: number }[];
}

export interface TableSnapshot {
  headers: string[];
  rows: (string | number | boolean)[][];
  highlightRow?: number;
  highlightCol?: number;
  title?: string;
}

export type SnapshotOf<K extends RendererKind> =
  K extends 'text' ? TextSnapshot :
  K extends 'array' ? ArraySnapshot :
  K extends 'grid' ? GridSnapshot :
  K extends 'table' ? TableSnapshot :
  unknown;

export interface Step {
  line: number; // dòng code Python (từ 1) đang chạy
  vars: Record<string, string | number | boolean | null>;
  highlights: { target: string; indices: number[]; role: 'active' | 'compare' | 'swap' | 'done' | 'found' | 'visited' }[];
  explain: string; // 1-2 câu tiếng Việt dễ hiểu
  snapshot: unknown; // kiểu do renderer của rendererKind công bố (SnapshotOf<Kind>)
  ops: number; // số phép tính tích lũy (mỗi phép so sánh/gán/số học = 1)
  key?: boolean; // đánh dấu bước quan trọng (dùng cho "Dự đoán" ở cấp 2)
  output?: string; // chỉ ở bước cuối
}

// ---- Bài luyện code (dùng chung cho Lesson và Problem) ----
export interface TestCase {
  input: string;
  output: string;
  subtask?: number;
  label?: string;
  isPublic?: boolean;
}
export interface Task {
  kind: 'code' | 'predict'; // 'predict': xem predictCode, nhập đầu ra dự đoán (không cần chạy Pyodide)
  statement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string;
  glossary?: { term: string; meaning: string }[]; // giải nghĩa từ khóa (cấp 3)
  examples: { input: string; output: string; note?: string }[];
  ioMode: { kind: 'stdio' } | { kind: 'file'; inputFile: string; outputFile: string };
  referenceSolution: string; // code Python chuẩn. CHỈ dùng để chấm và gửi AI, KHÔNG hiển thị
  predictCode?: string; // chỉ khi kind='predict'
  tests: TestCase[]; // tối thiểu: ví dụ + 2 test biên + 5 test ngẫu nhiên viết sẵn
  subtasks?: { id: number; points: number; description: string }[];
  analysis: { maxN: string; expectedComplexities: string[]; note?: string }; // cho "Phân tích đề"
  starterCode: string;
  timeLimitSec?: number; // mặc định 3
}

export interface Rubric {
  keyIdeas: { id: string; description: string; keywords: string[] }[]; // tối thiểu 3
  commonMistakes: string[];
  hintsByIdea: Record<string, [string, string, string, string]>; // bậc 1..4 cho từng ý; bậc 4 là khung giả mã còn chỗ trống
}

export interface Stage { // cấp độ 3: chặng của lời giải (không phụ thuộc dữ liệu nhập)
  title: string;
  goal: string;
  question: string;
  codeLines: [number, number]; // khoảng dòng code thuộc chặng này
  blanks: { line: number; before: string; answer: string; after: string }[]; // chỗ điền khuyết
}

export interface CompareSolution {
  name: string;
  code: string[];
  complexity: string;
  generateSteps: (input: unknown) => Step[];
}

export type ExplanationBlock =
  | { type: 'text'; text: string }
  | { type: 'callout'; tone: 'tip' | 'warn' | 'info'; text: string }
  | { type: 'code'; code: string }
  | { type: 'example'; title: string; body: string };

// ---- Nội dung một bài: mỗi bài 1 file trong src/lessons/. KHÔNG lặp lại siêu dữ liệu ----
export interface Lesson {
  id: string; // phải có trong catalog
  explanation: ExplanationBlock[]; // luôn có ≥1 callout 'warn' về bẫy Python liên quan
  sample: {
    statement: string;
    constraints: string;
    maxSimSize: string;
    fields: InputField[];
    defaultInput: Record<string, string>;
    presets: { name: string; input: Record<string, string> }[]; // ≥3, gồm ≥1 trường hợp biên
    parse: (raw: Record<string, string>) => ParseResult<unknown>;
    toStdin: (value: unknown) => string; // đổi dữ liệu mô phỏng sang stdin của task (cùng một input cho mô phỏng và chạy code)
  };
  code: string[]; // code Python mẫu, mỗi phần tử 1 dòng
  lineNotes: string[]; // chú thích tiếng Việt từng dòng; length === code.length
  generateSteps: (input: unknown) => Step[];
  reference: (input: unknown) => string; // đáp án chuẩn viết ĐỘC LẬP với generateSteps
  selfTest?: (assert: (condition: boolean, message: string) => void) => void;
  Renderer?: React.FC<{ step: Step }>; // nếu thiếu thì dùng renderer mặc định của rendererKind
  compare?: CompareSolution[]; // thuật toán: vét cạn vs tối ưu (xem Prompt 4)
  rubric: Rubric;
  task: Task;
  stages: Stage[]; // stages: 2-4 chặng, phủ toàn bộ code theo thứ tự
}

export type LessonStatus = 'ready' | 'soon';

export interface RegisteredLesson extends CatalogEntry {
  status: LessonStatus;
  content?: Lesson;
  missingFields?: string[];
}

// ---- Bài tập (chế độ "Hiểu bài tập") ----
export interface Problem {
  id: string;
  title: string;
  topicNo: number;
  level: 'A' | 'B' | 'C' | 'HSG';
  source?: string;
  tags: string[];
  task: Task;
  rubric: Rubric;
  lessonIds: string[]; // các bài trong catalog dùng để mô phỏng (bài đầu là chính); [] = chưa có mô phỏng
  simPresets: { lessonId: string; label: string; input: Record<string, string> }[]; // dữ liệu nhỏ để mô phỏng, soạn tay
}

// ---- Nguồn học dùng chung cho Kiểm tra độ hiểu và Trình chạy code ----
export interface LearningSource {
  id: string;
  kind: 'lesson' | 'problem';
  title: string;
  task: Task;
  rubric: Rubric;
  lessons: Lesson[];
}

// ---- Tiến độ (xuất/nhập JSON) ----
export interface LevelProgress {
  attempts: number;
  matchedIdeas: string[];
  hintLevel: number;
  codeUnlocked: boolean;
  stagesDone: number;
  predictRight: number;
  predictTotal: number;
}
export interface ErrorEntry {
  sourceId: string;
  testLabel: string;
  type: 'wrong-algorithm' | 'wrong-edge' | 'wrong-format' | 'timeout' | 'runtime';
  at: string;
}

export const TOPIC_NAMES: Record<number, string> = {
  1: 'Duyệt và đếm',
  2: 'Đoạn con và cộng dồn',
  3: 'Số học',
  4: 'Sắp xếp và tìm kiếm',
  5: 'Tham lam và vét cạn',
  6: 'Quy hoạch động',
  7: 'Đồ thị',
  8: 'Cấu trúc dữ liệu',
  9: 'Đệ quy và Quay lui',
  10: 'Xâu ký tự và Bảng băm',
  11: 'Kỹ thuật nâng cao & Bitmask',
};

export interface ExamSet {
  id: string;
  title: string;
  description?: string;
  problemIds: string[];
  durationMin: number;
  note?: string;
}

export interface PlacementResult {
  completedAt: string;
  topicMastery: Record<number, 'mastered' | 'review' | 'not-started'>; // vững, cần ôn, chưa học
  recommendedLessonId: string;
  recommendedLevels: Record<number, 1 | 2 | 3 | 4>; // Cấp độ hỗ trợ đề xuất theo từng chuyên đề
  answers: Record<string, { answer: string; isCorrect: boolean }>;
}

export interface ProgressState {
  version: 1;
  understood: string[];
  levels: Record<string, LevelProgress>; // khóa `${sourceId}|${1..4}`
  solved: Record<string, { bestScore: number; attempts: number; lastAt: string }>;
  errorBook: ErrorEntry[];
  placement?: PlacementResult;
  lastVisited?: { path: string; title: string; at: string };
  [key: string]: unknown;
}
