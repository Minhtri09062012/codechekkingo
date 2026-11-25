import { Lesson, Step, RegisteredLesson, Problem, CatalogEntry } from './types.ts';
import { APP_NAME } from './brand.ts';

export interface SelfTestResult {
  passed: boolean;
  totalTested: number;
  errors: string[];
}

export const selfTestErrors: string[] = [];

// Nạp các tệp nguồn để quét kiểm toán thương hiệu tự động (Dev Test)
const sourceFilesRaw: Record<string, string> =
  typeof import.meta !== 'undefined' && typeof (import.meta as any).glob === 'function'
    ? (import.meta as any).glob(['../*.tsx', '../**/*.ts', '../**/*.tsx'], {
        query: '?raw',
        import: 'default',
        eager: true,
      })
    : {};

/**
 * Sinh ngẫu nhiên dữ liệu hợp lệ cho một bài học dựa trên ID và các fields
 */
function generateRandomValidInput(lesson: Lesson): Record<string, string> {
  const presets = lesson.sample.presets || [];
  const baseInput = presets.length > 0
    ? presets[Math.floor(Math.random() * presets.length)].input
    : lesson.sample.defaultInput;

  const raw: Record<string, string> = { ...baseInput };

  for (const field of lesson.sample.fields) {
    if (field.kind === 'int') {
      const baseNum = Number(raw[field.key]) || 5;
      const delta = Math.floor(Math.random() * 21) - 10;
      let nextVal = baseNum + delta;
      if (lesson.id === 'concept-arithmetic-ops' && field.key === 'b') {
        nextVal = Math.floor(Math.random() * 9) + 1; // 1..9
      }
      if (lesson.id === 'concept-nested-conditions' && field.key === 'score') {
        nextVal = Math.floor(Math.random() * 101); // 0..100
      }
      raw[field.key] = String(nextVal);
    } else if (field.kind === 'intList') {
      const len = Math.floor(Math.random() * 6) + 1; // 1 đến 6 phần tử
      const arr = Array.from({ length: len }, () => Math.floor(Math.random() * 100) - 50);
      raw[field.key] = arr.join(' ');
    } else if (field.kind === 'choice') {
      const opts = field.options || ['max', 'min'];
      raw[field.key] = opts[Math.floor(Math.random() * opts.length)];
    } else if (field.kind === 'intPair') {
      const a = Math.floor(Math.random() * 100);
      const b = Math.floor(Math.random() * 100);
      raw[field.key] = `${a} ${b}`;
    } else if (field.kind === 'string') {
      if (field.key === 'f') {
        raw[field.key] = (Math.random() * 20 - 10).toFixed(2);
      } else if (field.key === 's') {
        const words = ['Python', APP_NAME, 'Algorithm', 'TinHoc', 'Test'];
        raw[field.key] = words[Math.floor(Math.random() * words.length)];
      } else {
        raw[field.key] = raw[field.key] || 'Sample';
      }
    } else {
      raw[field.key] = raw[field.key] || '0';
    }
  }

  return raw;
}

/**
 * Kiểm tra tính đúng đắn toàn diện của một bài học ở trạng thái 'ready'
 */
export function runLessonSelfTest(registeredLesson: RegisteredLesson): { passed: boolean; errors: string[] } {
  const errors: string[] = [];
  const lesson = registeredLesson.content;
  if (!lesson) {
    return { passed: true, errors: [] };
  }

  const id = lesson.id;
  const codeLen = lesson.code.length;

  // Chạy tự kiểm tra: selfTest(assert) của bài học (chạy thử ít nhất 3 bộ test: biên, thông thường, đặc biệt)
  if (typeof lesson.selfTest === 'function') {
    try {
      lesson.selfTest((condition: boolean, msg: string) => {
        if (!condition) {
          errors.push(`[${id} selfTest] ${msg}`);
        }
      });
    } catch (e) {
      errors.push(`[${id} selfTest] Ngoại lệ khi chạy selfTest: ${String(e)}`);
    }
  }

  // (d) lineNotes.length === code.length
  if (!lesson.lineNotes || lesson.lineNotes.length !== codeLen) {
    errors.push(`[${id}] lineNotes độ dài (${lesson.lineNotes?.length || 0}) khác code.length (${codeLen})`);
  }

  // (e) stages phủ liên tiếp các dòng code từ 1 đến code.length, không chồng
  if (!lesson.stages || lesson.stages.length < 2) {
    errors.push(`[${id}] Cần ít nhất 2 chặng trong stages`);
  } else {
    let expectedStart = 1;
    for (let i = 0; i < lesson.stages.length; i++) {
      const st = lesson.stages[i];
      const [start, end] = st.codeLines;
      if (start !== expectedStart) {
        errors.push(`[${id}] Chặng ${i + 1} ("${st.title}") bắt đầu ở dòng ${start}, mong đợi dòng ${expectedStart}`);
      }
      if (end < start) {
        errors.push(`[${id}] Chặng ${i + 1} có dòng kết thúc ${end} nhỏ hơn dòng bắt đầu ${start}`);
      }
      expectedStart = end + 1;
    }
    if (expectedStart - 1 !== codeLen) {
      errors.push(`[${id}] Các chặng stages kết thúc ở dòng ${expectedStart - 1}, không phủ hết code.length (${codeLen})`);
    }
  }

  // (g) mỗi keyIdea có hintsByIdea đủ 4 bậc
  if (!lesson.rubric?.keyIdeas || lesson.rubric.keyIdeas.length === 0) {
    errors.push(`[${id}] rubric thiếu keyIdeas`);
  } else {
    for (const idea of lesson.rubric.keyIdeas) {
      const hints = lesson.rubric.hintsByIdea?.[idea.id];
      if (!hints || !Array.isArray(hints) || hints.length !== 4) {
        errors.push(`[${id}] Ý cốt lõi "${idea.id}" thiếu đủ 4 bậc gợi ý trong hintsByIdea`);
      } else {
        for (let b = 0; b < 4; b++) {
          if (!hints[b] || typeof hints[b] !== 'string' || hints[b].trim().length === 0) {
            errors.push(`[${id}] Ý "${idea.id}" bậc ${b + 1} bị rỗng`);
          }
        }
      }
    }
  }

  // (f) với mỗi preset: nếu task.tests có test cùng stdin (toStdin) thì output phải bằng reference
  if (lesson.sample?.presets) {
    for (const preset of lesson.sample.presets) {
      const parsed = lesson.sample.parse(preset.input);
      if (parsed.ok) {
        const stdin = lesson.sample.toStdin(parsed.value).trim();
        const refOutput = lesson.reference(parsed.value).trim();
        const matchingTest = lesson.task.tests.find((t) => t.input.trim() === stdin);
        if (matchingTest) {
          if (matchingTest.output.trim() !== refOutput) {
            errors.push(
              `[${id}] Preset "${preset.name}" có kết quả trong task.tests ("${matchingTest.output}") khác reference ("${refOutput}")`
            );
          }
        }
      }
    }
  }

  // (a), (b), (c) Chạy thử 30 test ngẫu nhiên hợp lệ
  const testInputs: unknown[] = [];

  // Lấy các presets trước
  for (const preset of lesson.sample.presets || []) {
    const res = lesson.sample.parse(preset.input);
    if (res.ok) testInputs.push(res.value);
  }

  // Bổ sung random inputs cho đủ ít nhất 30 input
  let attempts = 0;
  while (testInputs.length < 30 && attempts < 100) {
    attempts++;
    const raw = generateRandomValidInput(lesson);
    const res = lesson.sample.parse(raw);
    if (res.ok) {
      testInputs.push(res.value);
    }
  }

  let testIdx = 0;
  for (const val of testInputs) {
    testIdx++;
    let steps: Step[] = [];
    try {
      steps = lesson.generateSteps(val);
    } catch (err) {
      errors.push(`[${id}] generateSteps bị ném ngoại lệ ở test #${testIdx}: ${String(err)}`);
      continue;
    }

    // (a) steps kết thúc <= 500
    if (steps.length === 0) {
      errors.push(`[${id}] generateSteps trả về 0 bước ở test #${testIdx}`);
    } else if (steps.length > 500) {
      errors.push(`[${id}] generateSteps sinh ${steps.length} bước (> 500) ở test #${testIdx}`);
    }

    // (b) 1 <= line <= code.length
    for (let sIdx = 0; sIdx < steps.length; sIdx++) {
      const step = steps[sIdx];
      if (step.line < 1 || step.line > codeLen) {
        errors.push(`[${id}] Bước ${sIdx + 1} trỏ vào dòng không hợp lệ: line=${step.line} (code có ${codeLen} dòng)`);
        break;
      }
    }

    // (c) output cuối === reference(input)
    if (steps.length > 0) {
      const lastStep = steps[steps.length - 1];
      const expectedRef = lesson.reference(val).trim();
      if (!lastStep.output || lastStep.output.trim() !== expectedRef) {
        errors.push(
          `[${id}] Test #${testIdx}: output bước cuối ("${lastStep.output}") khác reference chuẩn ("${expectedRef}")`
        );
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}

/**
 * Kiểm tra tính đúng đắn toàn diện của các bài tập và ca giả lập
 */
export function runProblemSelfTests(
  problems: Problem[],
  catalogList: CatalogEntry[],
  normalizeFn?: (raw: any) => { problem: Problem | null; fixes: string[] },
  validateFn?: (p: Problem | null) => { isValid: boolean; missingFields: string[] }
): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Kiểm tra mọi bài tập sau chuẩn hóa thỏa kiểu Problem
  for (const p of problems) {
    if (!p.id || typeof p.id !== 'string') {
      errors.push(`[selfTest Problem] Bài tập thiếu id hợp lệ`);
      continue;
    }
    if (!Array.isArray(p.lessonIds)) {
      errors.push(`[selfTest Problem] Bài "${p.id}": lessonIds không phải mảng`);
    } else {
      for (const lid of p.lessonIds) {
        if (typeof lid !== 'string' || lid.trim() === '') {
          errors.push(`[selfTest Problem] Bài "${p.id}": lessonIds chứa phần tử không phải chuỗi không rỗng`);
        }
        const existsInCatalog = catalogList.some((c) => c.id === lid);
        if (!existsInCatalog) {
          console.warn(`[selfTest Cảnh báo] Bài "${p.id}": lessonId "${lid}" không tồn tại trong catalog`);
        }
      }
    }

    if (!Array.isArray(p.tags)) {
      errors.push(`[selfTest Problem] Bài "${p.id}": tags không phải mảng`);
    }
    if (!Array.isArray(p.simPresets)) {
      errors.push(`[selfTest Problem] Bài "${p.id}": simPresets không phải mảng`);
    }
    if (!p.task || typeof p.task !== 'object') {
      errors.push(`[selfTest Problem] Bài "${p.id}": task không phải object`);
    } else {
      if (!Array.isArray(p.task.tests)) errors.push(`[selfTest Problem] Bài "${p.id}": task.tests không phải mảng`);
      if (!Array.isArray(p.task.examples)) errors.push(`[selfTest Problem] Bài "${p.id}": task.examples không phải mảng`);
      if (p.task.analysis && !Array.isArray(p.task.analysis.expectedComplexities)) {
        errors.push(`[selfTest Problem] Bài "${p.id}": task.analysis.expectedComplexities không phải mảng`);
      }
    }
    if (!p.rubric || typeof p.rubric !== 'object') {
      errors.push(`[selfTest Problem] Bài "${p.id}": rubric không phải object`);
    } else {
      if (!Array.isArray(p.rubric.keyIdeas)) {
        errors.push(`[selfTest Problem] Bài "${p.id}": rubric.keyIdeas không phải mảng`);
      }
    }
    if ('lessonId' in (p as any)) {
      errors.push(`[selfTest Problem] Bài "${p.id}": vẫn còn chứa trường cũ "lessonId"`);
    }
  }

  // 2. Test giả lập các ca lỗi nếu có hàm normalizeFn và validateFn
  if (normalizeFn && validateFn) {
    const dummyTask = {
      kind: 'code' as const,
      statement: 'Đề bài test',
      inputFormat: 'input test',
      outputFormat: 'output test',
      constraints: 'test',
      ioMode: { kind: 'stdio' as const },
      examples: [],
      tests: [],
      referenceSolution: 'print(1)',
    };
    const dummyRubric = {
      keyIdeas: [{ id: 'k1', title: 'Ý 1', desc: '', weight: 1 }],
      commonMistakes: [],
      hintsByIdea: { k1: ['b1', 'b2', 'b3', 'b4'] },
    };

    // Ca 1: lessonIds undefined
    const caseUndef = normalizeFn({
      id: 'sim-undef',
      title: 'Test Undefined lessonIds',
      task: dummyTask,
      rubric: dummyRubric,
    });
    if (!caseUndef.problem || !Array.isArray(caseUndef.problem.lessonIds) || caseUndef.problem.lessonIds.length !== 0) {
      errors.push(`[selfTest Giả lập] Ca lessonIds undefined chuẩn hóa không thành mảng rỗng`);
    }

    // Ca 2: lessonIds null
    const caseNull = normalizeFn({
      id: 'sim-null',
      title: 'Test Null lessonIds',
      lessonIds: null,
      task: dummyTask,
      rubric: dummyRubric,
    });
    if (!caseNull.problem || !Array.isArray(caseNull.problem.lessonIds) || caseNull.problem.lessonIds.length !== 0) {
      errors.push(`[selfTest Giả lập] Ca lessonIds null chuẩn hóa không thành mảng rỗng`);
    }

    // Ca 3: lessonIds là chuỗi 'algo-binary-search'
    const caseStr = normalizeFn({
      id: 'sim-str',
      title: 'Test String lessonIds',
      lessonIds: 'algo-binary-search',
      task: dummyTask,
      rubric: dummyRubric,
    });
    if (
      !caseStr.problem ||
      !Array.isArray(caseStr.problem.lessonIds) ||
      caseStr.problem.lessonIds[0] !== 'algo-binary-search'
    ) {
      errors.push(`[selfTest Giả lập] Ca lessonIds dạng chuỗi chuẩn hóa không thành mảng ['algo-binary-search']`);
    }

    // Ca 4: trường cũ lessonId (chuỗi)
    const caseLegacy = normalizeFn({
      id: 'sim-legacy',
      title: 'Test Legacy lessonId',
      lessonId: 'algo-prefix-sum',
      task: dummyTask,
      rubric: dummyRubric,
    });
    if (
      !caseLegacy.problem ||
      !Array.isArray(caseLegacy.problem.lessonIds) ||
      caseLegacy.problem.lessonIds[0] !== 'algo-prefix-sum'
    ) {
      errors.push(`[selfTest Giả lập] Ca trường cũ lessonId chuẩn hóa không thành lessonIds: ['algo-prefix-sum']`);
    }
    if (caseLegacy.problem && 'lessonId' in (caseLegacy.problem as any)) {
      errors.push(`[selfTest Giả lập] Ca trường cũ lessonId không xóa được trường cũ lessonId`);
    }

    // Ca 5: thiếu trường bắt buộc (không thể sửa: thiếu task & rubric)
    const caseInvalid = validateFn({
      id: 'sim-invalid',
      title: 'Test Invalid',
    } as any);
    if (caseInvalid.isValid) {
      errors.push(`[selfTest Giả lập] validateProblem không từ chối bài thiếu task và rubric`);
    }

    // Ca 6: Kiểm tra duyệt mảng an toàn không crash với mọi ca giả lập
    const simulatedProblems = [
      caseUndef.problem,
      caseNull.problem,
      caseStr.problem,
      caseLegacy.problem,
    ].filter(Boolean) as Problem[];

    for (const simProb of simulatedProblems) {
      try {
        const count = (simProb.lessonIds || []).filter((id) => id.startsWith('algo')).length;
        const joined = (simProb.tags || []).join(', ');
        const simCount = (simProb.simPresets || []).length;
        if (typeof count !== 'number' || typeof joined !== 'string' || typeof simCount !== 'number') {
          errors.push(`[selfTest Giả lập] Thuộc tính của simProb không hợp lệ`);
        }
      } catch (e) {
        errors.push(`[selfTest Giả lập] Duyệt bài tập giả lập bị crash: ${String(e)}`);
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}

/**
 * Quy tắc 5 (Audit Thương hiệu):
 * Quét toàn bộ mã nguồn (trừ brand.ts, file selfTest và dòng migration key cũ)
 * Báo lỗi nếu còn "CodeLens" (không phân biệt hoa thường) hoặc tên mới viết tay ngoài brand.ts.
 */
export function runBrandAudit(): { passed: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const filePath in sourceFilesRaw) {
    // Bỏ qua brand.ts (nơi định nghĩa nguồn sự thật duy nhất) và chính file selfTest này
    if (filePath.endsWith('brand.ts') || filePath.endsWith('selfTest.ts')) {
      continue;
    }

    const content = sourceFilesRaw[filePath];
    if (typeof content !== 'string') continue;

    const lines = content.split('\n');
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];

      // Bỏ qua dòng di chuyển khóa lưu trữ cũ để tương thích ngược
      if (line.includes('OLD_STORAGE_BACKUP_KEY')) {
        continue;
      }

      // 1. Kiểm tra sự tồn tại của tên cũ "CodeLens" (không phân biệt hoa thường)
      if (/codelens/i.test(line)) {
        errors.push(
          `[Brand Audit] Còn sót tên cũ "CodeLens" tại ${filePath}:${lineIndex + 1}: ${line.trim()}`
        );
      }

      // 2. Kiểm tra tên mới viết tay "CodeTrekking" trong các file giao diện (components, App.tsx, layouts, pages, modals)
      // Cấm viết cứng chuỗi "CodeTrekking" thay vì import APP_NAME từ brand.ts
      const isUIFile =
        filePath.includes('/components/') ||
        filePath.endsWith('App.tsx') ||
        filePath.includes('/pages/') ||
        filePath.includes('/layout/') ||
        filePath.includes('/modals/');

      if (isUIFile) {
        if (
          line.includes('"CodeTrekking"') ||
          line.includes("'CodeTrekking'") ||
          line.includes('`CodeTrekking`') ||
          line.includes('>CodeTrekking<')
        ) {
          errors.push(
            `[Brand Audit] Tên mới "${APP_NAME}" bị viết cứng tại ${filePath}:${lineIndex + 1}. Bắt buộc import APP_NAME từ src/core/brand.ts!`
          );
        }
      }
    }
  }

  return {
    passed: errors.length === 0,
    errors,
  };
}

/**
 * Chạy selfTest tự động khi khởi động
 */
export function runAllSelfTests(
  lessons: RegisteredLesson[],
  problems?: Problem[],
  catalogList?: CatalogEntry[],
  normalizeFn?: (raw: any) => { problem: Problem | null; fixes: string[] },
  validateFn?: (p: Problem | null) => { isValid: boolean; missingFields: string[] }
): SelfTestResult {
  selfTestErrors.length = 0;
  let totalReady = 0;

  // 1. Kiểm tra toàn vẹn thương hiệu (Brand Audit)
  const brandAuditRes = runBrandAudit();
  if (!brandAuditRes.passed) {
    selfTestErrors.push(...brandAuditRes.errors);
  }

  for (const registeredLesson of lessons) {
    if (registeredLesson.status === 'ready' && registeredLesson.content) {
      totalReady++;
      const res = runLessonSelfTest(registeredLesson);
      if (!res.passed) {
        selfTestErrors.push(...res.errors);
      }
    }
  }

  let problemCount = 0;
  if (problems && catalogList) {
    problemCount = problems.length;
    const pRes = runProblemSelfTests(problems, catalogList, normalizeFn, validateFn);
    if (!pRes.passed) {
      selfTestErrors.push(...pRes.errors);
    }
  }

  if (selfTestErrors.length > 0) {
    console.error(`=== [${APP_NAME} selfTest THẤT BẠI] ===`);
    for (const err of selfTestErrors) {
      console.error(err);
    }
  } else {
    console.log(
      `[${APP_NAME} selfTest] Đã kiểm tra thành công ${totalReady} bài học ready và ${problemCount} bài tập (đạt chuẩn 100%).`
    );
  }

  return {
    passed: selfTestErrors.length === 0,
    totalTested: totalReady + problemCount,
    errors: selfTestErrors,
  };
}
