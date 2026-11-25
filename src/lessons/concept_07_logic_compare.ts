import { Lesson, Step, ParseResult, Task, Rubric, Stage, TableSnapshot } from '../core/types.ts';
import { TableRenderer } from '../components/renderers/TableRenderer.tsx';

interface LogicInput {
  a: number;
  b: number;
}

const sampleCode = [
  'a = int(input())',
  'b = int(input())',
  'A = (a > 0)',
  'B = (b > 0)',
  'ans_not = not A',
  'ans_and = A and B',
  'ans_or = A or B',
  'print(A, B, ans_not, ans_and, ans_or)',
];

const task: Task = {
  kind: 'code',
  statement:
    'Cho hai số nguyên a và b. Tạo hai mệnh đề logic A = (a > 0) và B = (b > 0). Hãy tính not A, A and B, A or B. In ra A, B, not A, A and B, A or B trên một dòng cách nhau bởi khoảng trắng.',
  inputFormat: 'Gồm 2 dòng: dòng 1 chứa số nguyên a, dòng 2 chứa số nguyên b (-10^9 <= a, b <= 10^9).',
  outputFormat: 'In 5 giá trị boolean cách nhau bởi dấu cách: A, B, ans_not, ans_and, ans_or.',
  constraints: '-10^9 <= a, b <= 10^9; Thời gian chạy: 1.0s',
  glossary: [
    { term: 'and (VÀ)', meaning: 'Chỉ đúng (True) khi CẢ HAI mệnh đề đều đúng' },
    { term: 'or (HOẶC)', meaning: 'Đúng (True) khi ÍT NHẤT MỘT trong hai mệnh đề đúng' },
    { term: 'not (PHỦ ĐỊNH)', meaning: 'Đảo ngược giá trị logic: not True thành False, not False thành True' },
    { term: 'Bảng sự thật (Truth Table)', meaning: 'Bảng liệt kê tất cả các tổ hợp giá trị chân lý có thể có của các mệnh đề' },
  ],
  examples: [
    { input: '5\n3', output: 'True True False True True', note: 'A=True, B=True -> not A=False, A and B=True, A or B=True' },
    { input: '5\n-2', output: 'True False False False True', note: 'A=True, B=False -> not A=False, A and B=False, A or B=True' },
    { input: '-1\n-4', output: 'False False True False False', note: 'A=False, B=False -> not A=True, A and B=False, A or B=False' },
  ],
  ioMode: { kind: 'stdio' },
  referenceSolution:
    'a = int(input())\nb = int(input())\nA = (a > 0)\nB = (b > 0)\nprint(A, B, not A, A and B, A or B)',
  tests: [
    { input: '5\n3', output: 'True True False True True', label: 'Ví dụ 1 (True, True)', isPublic: true },
    { input: '5\n-2', output: 'True False False False True', label: 'Ví dụ 2 (True, False)', isPublic: true },
    { input: '-1\n-4', output: 'False False True False False', label: 'Ví dụ 3 (False, False)', isPublic: true },
    { input: '-3\n8', output: 'False True True False True', label: 'Tổ hợp (False, True)', isPublic: false },
    { input: '0\n0', output: 'False False True False False', label: 'Biên số 0', isPublic: false },
    { input: '100\n0', output: 'True False False False True', label: 'Biên a > 0, b = 0', isPublic: false },
    { input: '0\n100', output: 'False True True False True', label: 'Biên a = 0, b > 0', isPublic: false },
    { input: '42\n99', output: 'True True False True True', label: 'Ngẫu nhiên 1', isPublic: false },
    { input: '-50\n50', output: 'False True True False True', label: 'Ngẫu nhiên 2', isPublic: false },
  ],
  analysis: {
    maxN: '|a|, |b| <= 10^9',
    expectedComplexities: ['O(1) thời gian', 'O(1) bộ nhớ'],
    note: 'Nền tảng của cấu trúc rẽ nhánh và biểu thức điều kiện trong mọi thuật toán.',
  },
  starterCode: '# Nhập 2 số a, b và tính toán biểu thức logic\na = int(input())\nb = int(input())\n# Tạo mệnh đề A, B và in 5 giá trị logic\n',
  timeLimitSec: 3,
};

const rubric: Rubric = {
  keyIdeas: [
    {
      id: 'idea-boolean-predicates',
      description: 'Thiết lập hai mệnh đề boolean A = (a > 0) và B = (b > 0)',
      keywords: ['A = (a > 0)', 'B = (b > 0)', 'so sánh', 'mệnh đề'],
    },
    {
      id: 'idea-logical-operators',
      description: 'Áp dụng chính xác 3 toán tử logic: not, and, or',
      keywords: ['not', 'and', 'or', 'logic'],
    },
    {
      id: 'idea-print-truth-values',
      description: 'In đầy đủ 5 giá trị logic ra màn hình cách nhau bởi dấu cách',
      keywords: ['print', 'A, B, not A, A and B, A or B'],
    },
  ],
  commonMistakes: [
    'Dùng ký hiệu toán tử bit &, |, ~ thay cho toán tử logic and, or, not',
    'Nhầm lẫn bảng sự thật của phép and (chỉ cần 1 vế False là cả biểu thức thành False)',
    'Nhầm tưởng a = 0 cho kết quả a > 0 là True',
  ],
  hintsByIdea: {
    'idea-boolean-predicates': [
      'Bậc 1: Mệnh đề a > 0 kiểm tra điều gì?',
      'Bậc 2: Gán A = (a > 0) và B = (b > 0).',
      'Bậc 3: A = (a > 0)\nB = (b > 0)',
      'Bậc 4: A = (a > 0)\nB = (b > ___)',
    ],
    'idea-logical-operators': [
      'Bậc 1: Ký hiệu phủ định, và, hoặc trong Python viết thế nào?',
      'Bậc 2: Dùng từ khóa tiếng Anh: not A, A and B, A or B.',
      'Bậc 3: ans_not = not A\nans_and = A and B\nans_or = A or B',
      'Bậc 4: ans_not = not A\nans_and = A and B\nans_or = A ___ B',
    ],
    'idea-print-truth-values': [
      'Bậc 1: Dùng lệnh print() để in 5 biến.',
      'Bậc 2: print(A, B, ans_not, ans_and, ans_or).',
      'Bậc 3: print(A, B, ans_not, ans_and, ans_or)',
      'Bậc 4: print(___, ___, ___, ___, ___)',
    ],
  },
};

const stages: Stage[] = [
  {
    title: 'Tạo mệnh đề logic',
    goal: 'Đọc số và kiểm tra điều kiện a > 0, b > 0',
    question: 'Khi nào mệnh đề (a > 0) nhận giá trị True?',
    codeLines: [1, 4],
    blanks: [
      { line: 3, before: 'A = (', answer: 'a > 0', after: ')' },
      { line: 4, before: 'B = (', answer: 'b > 0', after: ')' },
    ],
  },
  {
    title: 'Tính toán logic: not, and, or',
    goal: 'Áp dụng các toán tử logic trên A và B',
    question: 'Phép toán A and B cho kết quả True khi nào?',
    codeLines: [5, 7],
    blanks: [
      { line: 5, before: 'ans_not = ', answer: 'not A', after: '' },
      { line: 6, before: 'ans_and = ', answer: 'A and B', after: '' },
      { line: 7, before: 'ans_or = ', answer: 'A or B', after: '' },
    ],
  },
  {
    title: 'In bảng kết quả',
    goal: 'Xuất 5 giá trị logic',
    question: 'Thứ tự các giá trị in ra màn hình',
    codeLines: [8, 8],
    blanks: [
      {
        line: 8,
        before: 'print(',
        answer: 'A, B, ans_not, ans_and, ans_or',
        after: ')',
      },
    ],
  },
];

export const lesson: Lesson = {
  id: 'concept-logic-compare',
  Renderer: TableRenderer,
  explanation: [
    {
      type: 'text',
      text: 'Hãy hình dung điều kiện thi đấu: Một học sinh được vào đội tuyển nếu "Có đam mê" AND "Chăm chỉ luyện tập" (phải thỏa mãn cả 2). Ngược lại, điều kiện được nghỉ ngơi là "Hôm nay là Thứ Bảy" OR "Hôm nay là Chủ Nhật" (chỉ cần 1 trong 2 ngày là được).',
    },
    {
      type: 'text',
      text: 'Bảng sự thật (Truth Table) quy định chuẩn:\n• not: Phủ định (đảo ngược True thành False, False thành True)\n• and: Phép VÀ (chỉ True khi cả 2 vế đều True)\n• or: Phép HOẶC (chỉ cần 1 vế True là toàn bộ True)',
    },
    {
      type: 'example',
      title: 'Bảng sự thật hoàn chỉnh',
      body: 'A=F, B=F -> not A=T, and=F, or=F\nA=F, B=T -> not A=T, and=F, or=T\nA=T, B=F -> not A=F, and=F, or=T\nA=T, B=T -> not A=F, and=T, or=T',
    },
    {
      type: 'callout',
      tone: 'warn',
      text: 'BẪY PYTHON RẤT TINH VI (ĐÁNH GIÁ LƯỜI - SHORT-CIRCUIT):\n1. Trong biểu thức "X and Y", nếu X là False, Python sẽ DỪNG NGAY LẬP TỨC và không thèm kiểm tra Y! Tương tự với "X or Y", nếu X là True, Python cũng dừng ngay không chạy Y.\n2. Toán tử and/or trong Python trả về chính toán hạng chứ không nhất thiết là bool: "0 and \'hello\'" trả về số 0, "\'apple\' or \'banana\'" trả về xâu \'apple\'!',
    },
  ],
  sample: {
    statement:
      'Nhập vào số nguyên a và b. Xem bảng sự thật tương ứng với mệnh đề A = (a > 0) và B = (b > 0).',
    constraints: '-10^9 <= a, b <= 10^9',
    maxSimSize: 'Bảng sự thật 4 dòng',
    fields: [
      {
        key: 'a',
        label: 'Số nguyên a',
        placeholder: 'Ví dụ: 5',
        kind: 'int',
      },
      {
        key: 'b',
        label: 'Số nguyên b',
        placeholder: 'Ví dụ: 3',
        kind: 'int',
      },
    ],
    defaultInput: {
      a: '5',
      b: '3',
    },
    presets: [
      {
        name: 'Cả hai dương: 5 và 3 (True, True)',
        input: { a: '5', b: '3' },
      },
      {
        name: 'a dương, b âm: 5 và -2 (True, False)',
        input: { a: '5', b: '-2' },
      },
      {
        name: 'Cả hai âm: -1 và -4 (False, False)',
        input: { a: '-1', b: '-4' },
      },
      {
        name: 'a âm, b dương: -3 và 8 (False, True)',
        input: { a: '-3', b: '8' },
      },
    ],
    parse: (raw: Record<string, string>): ParseResult<LogicInput> => {
      const a = Number(raw.a);
      const b = Number(raw.b);
      if (raw.a === undefined || raw.a === '' || isNaN(a) || !Number.isInteger(a)) {
        return { ok: false, error: 'Giá trị a phải là một số nguyên hợp lệ.' };
      }
      if (raw.b === undefined || raw.b === '' || isNaN(b) || !Number.isInteger(b)) {
        return { ok: false, error: 'Giá trị b phải là một số nguyên hợp lệ.' };
      }
      return { ok: true, value: { a, b } };
    },
    toStdin: (val: unknown): string => {
      const { a, b } = val as LogicInput;
      return `${a}\n${b}`;
    },
  },
  code: sampleCode,
  lineNotes: [
    'Đọc số nguyên a từ bàn phím',
    'Đọc số nguyên b từ bàn phím',
    'Tạo mệnh đề logic A: kiểm tra a > 0 (True nếu a dương, False nếu a <= 0)',
    'Tạo mệnh đề logic B: kiểm tra b > 0 (True nếu b dương, False nếu b <= 0)',
    'Tính phủ định not A: đảo ngược giá trị của A',
    'Tính phép VÀ: ans_and = A and B (chỉ True khi cả A và B đều True)',
    'Tính phép HOẶC: ans_or = A or B (True nếu ít nhất một trong A hoặc B là True)',
    'In kết quả 5 giá trị logic ra màn hình',
  ],
  generateSteps: (input: unknown): Step[] => {
    const { a, b } = input as LogicInput;
    const steps: Step[] = [];
    let ops = 0;

    const A = a > 0;
    const B = b > 0;
    const ans_not = !A;
    const ans_and = A && B;
    const ans_or = A || B;

    // Hàng tương ứng trong bảng sự thật (0: FF, 1: FT, 2: TF, 3: TT)
    const activeRowIndex = (A ? 2 : 0) + (B ? 1 : 0);

    const makeSnapshot = (activeRow?: number, activeCol?: number): TableSnapshot => ({
      title: 'Bảng sự thật các phép toán logic (Truth Table)',
      headers: ['Mệnh đề A', 'Mệnh đề B', 'not A', 'A and B', 'A or B'],
      rows: [
        [false, false, true, false, false],
        [false, true, true, false, true],
        [true, false, false, false, true],
        [true, true, false, true, true],
      ],
      highlightRow: activeRow,
      highlightCol: activeCol,
    });

    // Bước 1: a = int(input())
    ops += 1;
    steps.push({
      line: 1,
      vars: { a },
      highlights: [{ target: 'var:a', indices: [], role: 'active' }],
      explain: `Đọc giá trị a = ${a}.`,
      snapshot: makeSnapshot(),
      ops,
    });

    // Bước 2: b = int(input())
    ops += 1;
    steps.push({
      line: 2,
      vars: { a, b },
      highlights: [{ target: 'var:b', indices: [], role: 'active' }],
      explain: `Đọc giá trị b = ${b}.`,
      snapshot: makeSnapshot(),
      ops,
    });

    // Bước 3: A = (a > 0)
    ops += 1;
    steps.push({
      line: 3,
      vars: { a, b, A },
      highlights: [{ target: 'var:A', indices: [], role: 'active' }],
      explain: `Mệnh đề A = (a > 0): ${a} > 0 là ${A ? 'True' : 'False'}.`,
      snapshot: makeSnapshot(undefined, 0),
      ops,
    });

    // Bước 4: B = (b > 0)
    ops += 1;
    steps.push({
      line: 4,
      vars: { a, b, A, B },
      highlights: [{ target: 'var:B', indices: [], role: 'active' }],
      explain: `Mệnh đề B = (b > 0): ${b} > 0 là ${B ? 'True' : 'False'}.`,
      snapshot: makeSnapshot(undefined, 1),
      ops,
    });

    // Bước 5: ans_not = not A
    ops += 1;
    steps.push({
      line: 5,
      vars: { a, b, A, B, ans_not },
      highlights: [{ target: 'var:ans_not', indices: [], role: 'swap' }],
      explain: `Phủ định not A: not ${A ? 'True' : 'False'} = ${ans_not ? 'True' : 'False'}.`,
      snapshot: makeSnapshot(activeRowIndex, 2),
      ops,
    });

    // Bước 6: ans_and = A and B (KEY STEP)
    ops += 1;
    steps.push({
      line: 6,
      vars: { a, b, A, B, ans_not, ans_and },
      highlights: [{ target: 'var:ans_and', indices: [], role: 'swap' }],
      explain: `Phép VÀ (and): ${A ? 'True' : 'False'} and ${B ? 'True' : 'False'} = ${
        ans_and ? 'True' : 'False'
      }.`,
      snapshot: makeSnapshot(activeRowIndex, 3),
      ops,
      key: true,
    });

    // Bước 7: ans_or = A or B (KEY STEP)
    ops += 1;
    steps.push({
      line: 7,
      vars: { a, b, A, B, ans_not, ans_and, ans_or },
      highlights: [{ target: 'var:ans_or', indices: [], role: 'swap' }],
      explain: `Phép HOẶC (or): ${A ? 'True' : 'False'} or ${B ? 'True' : 'False'} = ${
        ans_or ? 'True' : 'False'
      }.`,
      snapshot: makeSnapshot(activeRowIndex, 4),
      ops,
      key: true,
    });

    // Bước 8: print
    ops += 1;
    const outStr = `${A ? 'True' : 'False'} ${B ? 'True' : 'False'} ${
      ans_not ? 'True' : 'False'
    } ${ans_and ? 'True' : 'False'} ${ans_or ? 'True' : 'False'}`;
    steps.push({
      line: 8,
      vars: { a, b, A, B, ans_not, ans_and, ans_or },
      highlights: [
        { target: 'var:A', indices: [], role: 'done' },
        { target: 'var:B', indices: [], role: 'done' },
        { target: 'var:ans_not', indices: [], role: 'done' },
        { target: 'var:ans_and', indices: [], role: 'done' },
        { target: 'var:ans_or', indices: [], role: 'done' },
      ],
      explain: `In kết quả tương ứng với hàng ${activeRowIndex + 1} trong bảng sự thật: ${outStr}.`,
      snapshot: makeSnapshot(activeRowIndex),
      ops,
      output: outStr,
    });

    return steps;
  },
  reference: (input: unknown): string => {
    const { a, b } = input as LogicInput;
    const A = a > 0;
    const B = b > 0;
    const ans_not = !A;
    const ans_and = A && B;
    const ans_or = A || B;
    return `${A ? 'True' : 'False'} ${B ? 'True' : 'False'} ${ans_not ? 'True' : 'False'} ${
      ans_and ? 'True' : 'False'
    } ${ans_or ? 'True' : 'False'}`;
  },
  selfTest: (assert) => {
    // 1. Cả hai dương
    const s1 = lesson.generateSteps({ a: 5, b: 3 });
    const out1 = s1[s1.length - 1]?.output;
    assert(out1 === 'True True False True True', `Test 1 ra: "${out1}"`);

    // 2. Dương và âm
    const s2 = lesson.generateSteps({ a: 5, b: -2 });
    const out2 = s2[s2.length - 1]?.output;
    assert(out2 === 'True False False False True', `Test 2 ra: "${out2}"`);

    // 3. Cả hai âm
    const s3 = lesson.generateSteps({ a: -1, b: -4 });
    const out3 = s3[s3.length - 1]?.output;
    assert(out3 === 'False False True False False', `Test 3 ra: "${out3}"`);
  },
  rubric,
  task,
  stages,
};

export default lesson;
