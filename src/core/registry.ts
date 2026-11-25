import { CatalogEntry, Lesson, LessonStatus, Problem, LearningSource } from './types.ts';
import { catalog } from './catalog.ts';
import { APP_NAME } from './brand.ts';

interface LessonModule {
  lesson?: Lesson;
  default?: Lesson;
}

interface ProblemModule {
  problem?: Problem;
  default?: Problem;
}

// Nạp các file nội dung bài học trong src/lessons/ bằng import.meta.glob
const lessonFiles = import.meta.glob<LessonModule>(['../lessons/*.ts', '../lessons/**/*.ts'], { eager: true });
const rawLessonMap = new Map<string, Lesson>();

for (const path in lessonFiles) {
  const mod = lessonFiles[path];
  const item = mod.lesson || mod.default;
  if (item && item.id) {
    if (rawLessonMap.has(item.id)) {
      console.warn(`[${APP_NAME} Dev Check] Cảnh báo: Trùng lặp file nội dung cho lesson id "${item.id}" tại ${path}`);
    } else {
      rawLessonMap.set(item.id, item);
    }
  }
}

export const devErrors: string[] = [];
export const devWarnings: string[] = [];

// Chuẩn hóa bài tập tại cửa vào (registry)
export function normalizeProblem(raw: any): { problem: Problem | null; fixes: string[] } {
  if (!raw || typeof raw !== 'object') {
    return { problem: null, fixes: ['Dữ liệu bài tập không phải đối tượng (object)'] };
  }

  const fixes: string[] = [];
  const p: any = { ...raw };

  // lessonIds:
  // - nếu là mảng thì lọc ra phần tử là chuỗi không rỗng
  // - nếu là một chuỗi thì thành [chuỗi]
  // - nếu có trường cũ lessonId (chuỗi) thì thành [lessonId]
  // - còn lại là []
  if (Array.isArray(p.lessonIds)) {
    const originalLen = p.lessonIds.length;
    const filtered = p.lessonIds
      .filter((x: any) => typeof x === 'string' && x.trim() !== '')
      .map((x: string) => x.trim());
    if (filtered.length !== originalLen) {
      fixes.push('lessonIds (lọc bỏ phần tử không phải chuỗi không rỗng)');
    }
    p.lessonIds = filtered;
  } else if (typeof p.lessonIds === 'string' && p.lessonIds.trim() !== '') {
    fixes.push('lessonIds (chuyển chuỗi thành mảng [chuỗi])');
    p.lessonIds = [p.lessonIds.trim()];
  } else if (typeof p.lessonId === 'string' && p.lessonId.trim() !== '') {
    fixes.push('lessonIds (chuyển từ trường cũ lessonId thành lessonIds)');
    p.lessonIds = [p.lessonId.trim()];
  } else {
    if (p.lessonIds !== undefined && p.lessonIds !== null) {
      fixes.push('lessonIds (giá trị không hợp lệ -> [])');
    } else if (p.lessonIds === undefined || p.lessonIds === null) {
      fixes.push('lessonIds (thiếu trường -> [])');
    }
    p.lessonIds = [];
  }

  // Xóa hẳn mọi tham chiếu tới lessonId cũ trên đối tượng bài tập
  if ('lessonId' in p) {
    delete p.lessonId;
  }

  // tags: bảo đảm là mảng (mặc định []) và loại bỏ tagname chứa cụm từ HSG
  if (Array.isArray(p.tags)) {
    p.tags = p.tags
      .filter((t: any) => typeof t === 'string' && t.trim() !== '')
      .filter((t: string) => !t.toUpperCase().includes('HSG'));
  } else {
    if (p.tags !== undefined) fixes.push('tags (không phải mảng -> [])');
    p.tags = [];
  }

  // simPresets: bảo đảm là mảng (mặc định [])
  if (!Array.isArray(p.simPresets)) {
    if (p.simPresets !== undefined) fixes.push('simPresets (không phải mảng -> [])');
    p.simPresets = [];
  }

  // task & các mảng bên trong task:
  if (p.task && typeof p.task === 'object') {
    p.task = { ...p.task };
    // task.tests: bảo đảm là mảng (mặc định [])
    if (!Array.isArray(p.task.tests)) {
      if (p.task.tests !== undefined) fixes.push('task.tests (không phải mảng -> [])');
      p.task.tests = [];
    }
    // task.examples: bảo đảm là mảng (mặc định [])
    if (!Array.isArray(p.task.examples)) {
      if (p.task.examples !== undefined) fixes.push('task.examples (không phải mảng -> [])');
      p.task.examples = [];
    }
    // task.analysis.expectedComplexities: bảo đảm là mảng (mặc định [])
    if (p.task.analysis && typeof p.task.analysis === 'object') {
      p.task.analysis = { ...p.task.analysis };
      if (!Array.isArray(p.task.analysis.expectedComplexities)) {
        if (p.task.analysis.expectedComplexities !== undefined) {
          fixes.push('task.analysis.expectedComplexities (không phải mảng -> [])');
        }
        p.task.analysis.expectedComplexities = [];
      }
    }
  }

  // rubric.keyIdeas: bảo đảm là mảng (mặc định [])
  if (p.rubric && typeof p.rubric === 'object') {
    p.rubric = { ...p.rubric };
    if (!Array.isArray(p.rubric.keyIdeas)) {
      if (p.rubric.keyIdeas !== undefined) fixes.push('rubric.keyIdeas (không phải mảng -> [])');
      p.rubric.keyIdeas = [];
    }
    if (!Array.isArray(p.rubric.commonMistakes)) {
      p.rubric.commonMistakes = [];
    }
    if (!p.rubric.hintsByIdea || typeof p.rubric.hintsByIdea !== 'object') {
      p.rubric.hintsByIdea = {};
    }
  }

  return { problem: p as Problem, fixes };
}

// Kiểm tra tính hợp lệ bắt buộc của bài tập
export function validateProblem(p: Problem | null): { isValid: boolean; missingFields: string[] } {
  if (!p) {
    return { isValid: false, missingFields: ['Dữ liệu bài tập null hoặc rỗng'] };
  }

  const missing: string[] = [];
  if (!p.id || typeof p.id !== 'string' || p.id.trim() === '') missing.push('id');
  if (!p.title || typeof p.title !== 'string' || p.title.trim() === '') missing.push('title');
  if (!p.task || typeof p.task !== 'object') missing.push('task');
  if (!p.rubric || typeof p.rubric !== 'object') missing.push('rubric');

  return {
    isValid: missing.length === 0,
    missingFields: missing,
  };
}

// Nạp các file bài tập trong src/problems/ bằng import.meta.glob
const problemFiles = import.meta.glob<ProblemModule>(['../problems/*.ts', '../problems/**/*.ts'], { eager: true });
const problemMap = new Map<string, Problem>();

for (const path in problemFiles) {
  // Bỏ qua thư mục sets vì chứa đề thi (ExamSet), không phải Problem
  if (path.includes('/sets/')) {
    continue;
  }

  const mod = problemFiles[path];
  const rawItem = mod.problem || mod.default;
  if (!rawItem) continue;

  const { problem: normalized, fixes } = normalizeProblem(rawItem);
  const check = validateProblem(normalized);

  if (!check.isValid || !normalized) {
    const err = `[Lỗi Bài Tập File] File bài tập tại ${path} thiếu trường bắt buộc: ${check.missingFields.join(', ')}. Bài tập này bị bỏ qua khỏi danh sách.`;
    console.error(err);
    devErrors.push(err);
    continue;
  }

  if (fixes.length > 0) {
    const warn = `[${APP_NAME} Dev Normalizer] Bài tập "${normalized.id}" (tại ${path}): tự động sửa các trường [${fixes.join(', ')}]. Vui lòng cập nhật mã nguồn bài tập.`;
    console.warn(warn);
    devWarnings.push(warn);
  }

  // Kiểm tra lessonIds: mỗi id phải nằm trong catalog (không thì cảnh báo)
  for (const lid of normalized.lessonIds) {
    const inCatalog = catalog.some((c) => c.id === lid);
    if (!inCatalog) {
      const warn = `[Cảnh báo Bài Tập] Bài "${normalized.id}" tại ${path} liên kết tới lessonId "${lid}" không tồn tại trong catalog!`;
      console.warn(warn);
      devWarnings.push(warn);
    }
  }

  if (problemMap.has(normalized.id)) {
    console.warn(`[${APP_NAME} Dev Check] Cảnh báo: Trùng lặp file bài tập id "${normalized.id}" tại ${path}`);
  } else {
    problemMap.set(normalized.id, normalized);
  }
}

// Rule 7: Kiểm tra tính hợp lệ của file nội dung bài học
function validateLessonContent(lesson: Lesson): { isValid: boolean; missingFields: string[] } {
  const missing: string[] = [];

  if (!lesson.id) missing.push('id');
  if (!Array.isArray(lesson.explanation)) missing.push('explanation');
  else {
    const hasWarn = lesson.explanation.some((b) => b.type === 'callout' && b.tone === 'warn');
    if (!hasWarn) missing.push('explanation thiếu callout warn về bẫy Python');
  }

  if (!lesson.sample) missing.push('sample');
  else {
    if (!lesson.sample.statement) missing.push('sample.statement');
    if (!lesson.sample.constraints) missing.push('sample.constraints');
    if (!lesson.sample.maxSimSize) missing.push('sample.maxSimSize');
    if (!Array.isArray(lesson.sample.fields)) missing.push('sample.fields');
    if (!lesson.sample.defaultInput) missing.push('sample.defaultInput');
    if (!Array.isArray(lesson.sample.presets) || lesson.sample.presets.length < 3) {
      missing.push('sample.presets (cần >= 3 presets)');
    }
    if (typeof lesson.sample.parse !== 'function') missing.push('sample.parse');
    if (typeof lesson.sample.toStdin !== 'function') missing.push('sample.toStdin');
  }

  if (!Array.isArray(lesson.code)) missing.push('code');
  if (!Array.isArray(lesson.lineNotes)) missing.push('lineNotes');
  else if (Array.isArray(lesson.code) && lesson.lineNotes.length !== lesson.code.length) {
    missing.push(`lineNotes độ dài (${lesson.lineNotes.length}) khác code (${lesson.code.length})`);
  }

  if (typeof lesson.generateSteps !== 'function') missing.push('generateSteps');
  if (typeof lesson.reference !== 'function') missing.push('reference');

  if (!lesson.rubric) missing.push('rubric');
  else {
    if (!Array.isArray(lesson.rubric.keyIdeas) || lesson.rubric.keyIdeas.length < 1) {
      missing.push('rubric.keyIdeas (cần >= 1 ý)');
    }
    if (!Array.isArray(lesson.rubric.commonMistakes)) missing.push('rubric.commonMistakes');
    if (!lesson.rubric.hintsByIdea) missing.push('rubric.hintsByIdea');
  }

  if (!lesson.task) missing.push('task');
  if (!Array.isArray(lesson.stages) || lesson.stages.length < 2 || lesson.stages.length > 4) {
    missing.push('stages (cần 2-4 chặng)');
  }

  return {
    isValid: missing.length === 0,
    missingFields: missing,
  };
}

// Rule 6: Kiểm tra tính toàn vẹn của catalog
function validateCatalog() {
  const seenCatalogIds = new Set<string>();
  const entryById = new Map<string, CatalogEntry>();

  let conceptCount = 0;
  let algoCount = 0;

  for (const entry of catalog) {
    if (seenCatalogIds.has(entry.id)) {
      const err = `[Lỗi Catalog] Trùng lặp ID: "${entry.id}"`;
      console.error(err);
      devErrors.push(err);
    }
    seenCatalogIds.add(entry.id);
    entryById.set(entry.id, entry);

    if (entry.kind === 'concept') conceptCount++;
    if (entry.kind === 'algorithm') algoCount++;
  }

  if (conceptCount !== 51) {
    const err = `[Lỗi Catalog] Số lượng bài khái niệm không đúng: hiện có ${conceptCount}/51 bài.`;
    console.error(err);
    devErrors.push(err);
  }
  if (algoCount !== 43) {
    const err = `[Lỗi Catalog] Số lượng bài thuật toán không đúng: hiện có ${algoCount}/43 bài.`;
    console.error(err);
    devErrors.push(err);
  }

  // Kiểm tra không có nhóm rỗng (10 nhóm khái niệm, 7 nhóm thuật toán)
  const conceptGroups = new Set<string>();
  const algoGroups = new Set<string>();
  for (const entry of catalog) {
    if (entry.kind === 'concept') conceptGroups.add(`${entry.groupOrder}-${entry.group}`);
    if (entry.kind === 'algorithm') algoGroups.add(`${entry.groupOrder}-${entry.group}`);
  }

  if (conceptGroups.size !== 10) {
    const err = `[Lỗi Catalog] Số lượng nhóm khái niệm không đúng: hiện có ${conceptGroups.size}/10 nhóm.`;
    console.error(err);
    devErrors.push(err);
  }
  if (algoGroups.size !== 7) {
    const err = `[Lỗi Catalog] Số lượng nhóm thuật toán không đúng: hiện có ${algoGroups.size}/7 nhóm.`;
    console.error(err);
    devErrors.push(err);
  }

  for (const entry of catalog) {
    for (const prereqId of entry.prerequisites) {
      const prereq = entryById.get(prereqId);
      if (!prereq) {
        const err = `[Lỗi Catalog] Bài "${entry.id}" khai báo tiền đề không tồn tại: "${prereqId}"`;
        console.error(err);
        devErrors.push(err);
      } else {
        if (prereq.kind === entry.kind && prereq.order >= entry.order) {
          const err = `[Lỗi Catalog] Tiền đề "${prereqId}" (order=${prereq.order}) phải có order nhỏ hơn bài "${entry.id}" (order=${entry.order})`;
          console.error(err);
          devErrors.push(err);
        }
      }
    }
  }

  for (const [lessonId] of rawLessonMap.entries()) {
    if (!entryById.has(lessonId)) {
      const err = `[Lỗi Lesson File] File bài học "${lessonId}" không tồn tại trong catalog!`;
      console.error(err);
      devErrors.push(err);
    }
  }
}

validateCatalog();

export interface RegisteredLesson extends CatalogEntry {
  status: LessonStatus;
  content?: Lesson;
  missingFields?: string[];
}

// Sắp xếp catalog theo (groupOrder, order) tăng dần
const sortedCatalog: CatalogEntry[] = [...catalog].sort((a, b) => {
  if (a.groupOrder !== b.groupOrder) {
    return a.groupOrder - b.groupOrder;
  }
  return a.order - b.order;
});

// Ghép CatalogEntry với file nội dung
export const allRegisteredLessons: RegisteredLesson[] = sortedCatalog.map((entry) => {
  const content = rawLessonMap.get(entry.id);
  if (!content) {
    return {
      ...entry,
      status: 'soon',
    };
  }

  const check = validateLessonContent(content);
  if (!check.isValid) {
    const err = `[Lỗi Lesson File] Bài "${entry.id}" thiếu các trường bắt buộc: ${check.missingFields.join(', ')}`;
    console.error(err);
    devErrors.push(err);
    return {
      ...entry,
      status: 'soon',
      content,
      missingFields: check.missingFields,
    };
  }

  return {
    ...entry,
    status: 'ready',
    content,
  };
});

// Danh mục bài tập rỗng ban đầu (Prompt 6 sẽ bổ sung danh mục bài tập)
export const problemCatalog: Problem[] = [];

// Trả về toàn bộ siêu dữ liệu catalog
export function getCatalog(): CatalogEntry[] {
  return catalog;
}

// Rule 8: Chiều bài học -> bài tập do registry tính tự động từ Problem.lessonIds
export function getProblemsForLesson(lessonId: string): Problem[] {
  return getProblemsOfLesson(lessonId);
}

// Lấy danh sách bài học theo kind
export function getLessons(kind?: 'concept' | 'algorithm'): RegisteredLesson[] {
  if (!kind) return allRegisteredLessons;
  return allRegisteredLessons.filter((l) => l.kind === kind);
}

// Lấy một bài học theo id
export function getLesson(id: string): RegisteredLesson | undefined {
  return allRegisteredLessons.find((l) => l.id === id);
}

// Đếm số bài sẵn sàng (ready)
export function getReadyCount(kind: 'concept' | 'algorithm'): { ready: number; total: number } {
  const list = getLessons(kind);
  const ready = list.filter((l) => l.status === 'ready').length;
  return { ready, total: list.length };
}

export interface LessonGroup {
  groupName: string;
  groupOrder: number;
  topicNo?: number;
  lessons: RegisteredLesson[];
}

// Nhóm các bài học cho sidebar
export function getGroupedLessons(kind?: 'concept' | 'algorithm'): LessonGroup[] {
  const list = getLessons(kind);
  const map = new Map<string, LessonGroup>();

  for (const lesson of list) {
    const key = `${lesson.groupOrder}-${lesson.group}`;
    if (!map.has(key)) {
      map.set(key, {
        groupName: lesson.group,
        groupOrder: lesson.groupOrder,
        topicNo: lesson.topicNo,
        lessons: [],
      });
    }
    map.get(key)!.lessons.push(lesson);
  }

  return Array.from(map.values()).sort((a, b) => a.groupOrder - b.groupOrder);
}

// Kiểm tra tiền đề khuyến nghị (khóa mềm)
export function getMissingPrerequisites(
  lesson: CatalogEntry,
  completedLessons: string[]
): CatalogEntry[] {
  const missing: CatalogEntry[] = [];
  for (const prereqId of lesson.prerequisites) {
    if (!completedLessons.includes(prereqId)) {
      const prereq = catalog.find((c) => c.id === prereqId);
      if (prereq) missing.push(prereq);
    }
  }
  return missing;
}

// Tìm bài nên học tiếp
export function getNextRecommendedLesson(
  kind: 'concept' | 'algorithm',
  completedLessons: string[]
): RegisteredLesson | undefined {
  const readyLessons = getLessons(kind).filter(
    (l) => l.status === 'ready' && !completedLessons.includes(l.id)
  );

  const withPrereqsMet = readyLessons.find((l) =>
    l.prerequisites.every((pId) => completedLessons.includes(pId))
  );

  return withPrereqsMet || readyLessons[0];
}

// ==========================================
// CÁC HÀM TRUY VẤN BÀI TẬP (PROBLEMS)
// ==========================================

export function getProblems(): Problem[] {
  return Array.from(problemMap.values());
}

export function getProblem(id: string): Problem | undefined {
  return problemMap.get(id);
}

// Quy tắc 8: Liên kết bài tập ↔ bài học chỉ khai báo ở Problem.lessonIds; chiều ngược lại do registry tính tự động
export function getProblemsOfLesson(lessonId: string): Problem[] {
  if (!lessonId) return [];
  return Array.from(problemMap.values()).filter((p) => {
    const ids = Array.isArray(p.lessonIds) ? p.lessonIds : [];
    return ids.includes(lessonId);
  });
}

export function getLessonsOfProblem(problemId: string): Lesson[] {
  if (!problemId) return [];
  const prob = problemMap.get(problemId);
  if (!prob) return [];
  const lessons: Lesson[] = [];
  const lessonIds = Array.isArray(prob.lessonIds) ? prob.lessonIds : [];
  for (const lid of lessonIds) {
    const regLesson = getLesson(lid);
    // Danh sách lesson của bài tập chỉ gồm lesson tồn tại trong catalog;
    // lesson 'soon' hoặc không tồn tại thì bị bỏ qua và bài tập coi như không có mô phỏng ở phần đó, không crash.
    if (regLesson && regLesson.status === 'ready' && regLesson.content) {
      lessons.push(regLesson.content);
    }
  }
  return lessons;
}

export function createLearningSourceFromProblem(problem: Problem): LearningSource {
  const readyLessons = getLessonsOfProblem(problem.id);
  return {
    id: problem.id,
    kind: 'problem',
    title: problem.title,
    task: problem.task,
    rubric: problem.rubric,
    lessons: readyLessons,
  };
}

// Đăng ký bài tập mới vào bộ nhớ phiên
export function registerSessionProblem(p: Problem): void {
  const { problem: normalized, fixes } = normalizeProblem(p);
  const check = validateProblem(normalized);
  if (!check.isValid || !normalized) {
    const err = `[Lỗi Bài Tập Phiên] Không thể nạp bài tập: thiếu trường ${check.missingFields.join(', ')}`;
    console.error(err);
    devErrors.push(err);
    return;
  }
  if (fixes.length > 0) {
    const warn = `[${APP_NAME} Dev Normalizer] Bài tập phiên "${normalized.id}": tự động sửa các trường [${fixes.join(', ')}].`;
    console.warn(warn);
    devWarnings.push(warn);
  }
  problemMap.set(normalized.id, normalized);
}

// Lấy topicNo cho bài học hoặc bài tập
export function getLessonTopicNo(sourceId: string): number {
  const prob = problemMap.get(sourceId);
  if (prob && prob.topicNo) return prob.topicNo;

  const entry = catalog.find((c) => c.id === sourceId);
  if (!entry) return 1;
  if (entry.topicNo) return entry.topicNo;

  if (entry.kind === 'algorithm') {
    if (entry.groupOrder >= 1 && entry.groupOrder <= 7) {
      return entry.groupOrder;
    }
    return 1;
  }

  // Concept groups mapping
  switch (entry.groupOrder) {
    case 1:
    case 2:
    case 3:
      return 1;
    case 4:
      return 9; // Đệ quy và Quay lui
    case 5:
      return 10; // Xâu ký tự & Bảng băm
    case 7:
    case 9:
      return 8; // Cấu trúc dữ liệu
    case 6:
    case 8:
    case 10:
    default:
      return 11; // Kỹ thuật nâng cao & Bitmask
  }
}

// Chạy selfTest tự động khi khởi động
import { runAllSelfTests } from './selfTest.ts';
const testRes = runAllSelfTests(
  allRegisteredLessons,
  Array.from(problemMap.values()),
  catalog,
  normalizeProblem,
  validateProblem
);
if (!testRes.passed) {
  devErrors.push(...testRes.errors);
}

