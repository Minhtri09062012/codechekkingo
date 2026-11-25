import { Lesson, Step, ParseResult, Task, Rubric, Stage } from '../core/types.ts';

const sampleCode = [
  'x = int(input())',
  'y = int(input())',
  'a = x',
  'b = y',
  'a = a + b',
  'print(a, b)',
];

const task: Task = {
  kind: 'code',
  statement:
    'Cho hai số nguyên x và y. Tạo biến a = x, b = y, sau đó thực hiện cộng a = a + b và in ra hai giá trị a và b cách nhau một dấu cách.',
  inputFormat: 'Gồm 2 dòng: dòng 1 chứa số nguyên x, dòng 2 chứa số nguyên y (-10^9 <= x, y <= 10^9).',
  outputFormat: 'In ra hai số nguyên a và b sau khi tính toán trên cùng một dòng, cách nhau bởi khoảng trắng.',
  constraints: '-10^9 <= x, y <= 10^9; Thời gian chạy: 1.0s',
  glossary: [
    { term: 'Ô nhớ (Memory cell)', meaning: 'Vùng nhớ trong RAM lưu trữ giá trị cụ thể của một đối tượng' },
    { term: 'Phép gán (Assignment)', meaning: 'Gắn nhãn biến vào ô nhớ hoặc ghi đè giá trị mới' },
  ],
  examples: [
    { input: '3\n4', output: '7 4', note: 'Ban đầu a=3, b=4. Sau khi a = a + b, a trở thành 7, b giữ nguyên 4.' },
    { input: '-5\n12', output: '7 12', note: 'a = (-5) + 12 = 7, b = 12' },
  ],
  ioMode: { kind: 'stdio' },
  referenceSolution: 'x = int(input())\ny = int(input())\na = x\nb = y\na = a + b\nprint(a, b)',
  tests: [
    { input: '3\n4', output: '7 4', label: 'Ví dụ 1', isPublic: true },
    { input: '-5\n12', output: '7 12', label: 'Ví dụ 2', isPublic: true },
    { input: '0\n0', output: '0 0', label: 'Biên: Hai số 0', isPublic: false },
    { input: '1000\n-1000', output: '0 -1000', label: 'Biên: Đối xứng âm dương', isPublic: false },
    { input: '15\n30', output: '45 30', label: 'Ngẫu nhiên 1', isPublic: false },
    { input: '-100\n-200', output: '-300 -200', label: 'Ngẫu nhiên 2: Toàn số âm', isPublic: false },
    { input: '9999\n1', output: '10000 1', label: 'Ngẫu nhiên 3', isPublic: false },
    { input: '50\n0', output: '50 0', label: 'Ngẫu nhiên 4', isPublic: false },
    { input: '123\n456', output: '579 456', label: 'Ngẫu nhiên 5', isPublic: false },
  ],
  analysis: {
    maxN: '|x|, |y| <= 10^9',
    expectedComplexities: ['O(1) thời gian', 'O(1) bộ nhớ'],
    note: 'Bài toán cơ bản về cấp phát ô nhớ và cập nhật biến.',
  },
  starterCode: '# Nhập 2 số x, y và tính toán\nx = int(input())\ny = int(input())\n# Viết code tạo biến a, b và tính a = a + b tại đây\n',
  timeLimitSec: 3,
};

const rubric: Rubric = {
  keyIdeas: [
    {
      id: 'idea-init-vars',
      description: 'Khởi tạo biến a và b nhận giá trị tương ứng từ x và y',
      keywords: ['gán', 'a = x', 'b = y', 'biến'],
    },
    {
      id: 'idea-accumulate',
      description: 'Thực hiện phép toán a = a + b để tính tổng và cập nhật ô nhớ a',
      keywords: ['a = a + b', 'phép cộng', 'cập nhật', 'ghi đè'],
    },
    {
      id: 'idea-print-result',
      description: 'In hai biến a và b ra màn hình đúng định dạng cách nhau dấu cách',
      keywords: ['print', 'a, b', 'xuất'],
    },
  ],
  commonMistakes: [
    'Quên gán a = a + b mà in x + y (không cập nhật đúng biến a theo yêu cầu đề bài)',
    'Nhầm lẫn thứ tự biến khi in ra màn hình: print(b, a)',
    'Gán b = a + b thay vì gán vào biến a',
  ],
  hintsByIdea: {
    'idea-init-vars': [
      'Bậc 1: Cần tạo hai biến mới nào theo đề bài?',
      'Bậc 2: Dùng lệnh gán để lưu giá trị x vào a và y vào b.',
      'Bậc 3: Viết a = x và b = y.',
      'Bậc 4: a = x\nb = ___',
    ],
    'idea-accumulate': [
      'Bậc 1: Muốn tăng giá trị của a thêm một lượng bằng b, ta làm thế nào?',
      'Bậc 2: Tính giá trị biểu thức a + b rồi gán ngược lại cho chính a.',
      'Bậc 3: Viết a = a + b.',
      'Bậc 4: a = a + ___',
    ],
    'idea-print-result': [
      'Bậc 1: Hàm nào trong Python dùng để xuất dữ liệu ra màn hình?',
      'Bậc 2: Hàm print() có thể nhận nhiều đối số cách nhau bởi dấu phẩy.',
      'Bậc 3: Viết lệnh print(a, b).',
      'Bậc 4: print(___, ___)',
    ],
  },
};

const stages: Stage[] = [
  {
    title: 'Đọc dữ liệu',
    goal: 'Đọc hai số nguyên x và y từ bàn phím',
    question: 'Hàm nào dùng để chuyển dữ liệu nhập thành số nguyên?',
    codeLines: [1, 2],
    blanks: [
      { line: 1, before: 'x = ', answer: 'int(input())', after: '' },
      { line: 2, before: 'y = ', answer: 'int(input())', after: '' },
    ],
  },
  {
    title: 'Khởi tạo biến a và b',
    goal: 'Gán giá trị từ x sang a và từ y sang b',
    question: 'Lệnh gán giá trị biến trong Python được viết như thế nào?',
    codeLines: [3, 4],
    blanks: [
      { line: 3, before: 'a = ', answer: 'x', after: '' },
      { line: 4, before: 'b = ', answer: 'y', after: '' },
    ],
  },
  {
    title: 'Cộng và In kết quả',
    goal: 'Cập nhật a = a + b và in ra màn hình',
    question: 'Tại sao sau lệnh a = a + b thì giá trị của b không bị thay đổi?',
    codeLines: [5, 6],
    blanks: [
      { line: 5, before: 'a = ', answer: 'a + b', after: '' },
      { line: 6, before: 'print(', answer: 'a, b', after: ')' },
    ],
  },
];

export const lesson: Lesson = {
  id: 'concept-variables-memory',
  explanation: [
    {
      type: 'text',
      text: 'Trong Python, biến hoạt động như một "nhãn dán" trỏ tới vùng ô nhớ chứa đối tượng dữ liệu trong RAM. Khi ta gán a = x, biến a sẽ cùng trỏ vào ô nhớ mang giá trị của x.',
    },
    {
      type: 'callout',
      tone: 'warn',
      text: 'BẪY PYTHON: Trong câu lệnh "a = a + b", vế phải (a + b) luôn được máy tính tính toán xong trước, sau đó mới tạo ra ô nhớ mới và gắn nhãn "a" trỏ vào kết quả đó. Biến b hoàn toàn không bị ảnh hưởng hay thay đổi.',
    },
    {
      type: 'example',
      title: 'Ý nghĩa của phép gán a = a + b',
      body: 'Đây là mô hình tích luỹ (accumulator) cơ bản nhất. Giá trị cũ của a bị thay thế bằng tổng mới.',
    },
  ],
  sample: {
    statement: 'Cho hai số nguyên x, y. Tạo a = x, b = y, rồi a = a + b, in a và b.',
    constraints: '-10^9 <= x, y <= 10^9',
    maxSimSize: '|x|, |y| <= 10^9',
    fields: [
      {
        key: 'x',
        label: 'Số nguyên x',
        placeholder: 'Ví dụ: 3',
        kind: 'int',
      },
      {
        key: 'y',
        label: 'Số nguyên y',
        placeholder: 'Ví dụ: 4',
        kind: 'int',
      },
    ],
    defaultInput: {
      x: '3',
      y: '4',
    },
    presets: [
      {
        name: 'Ví dụ cơ bản (3, 4)',
        input: { x: '3', y: '4' },
      },
      {
        name: 'Số âm (-5, 12)',
        input: { x: '-5', y: '12' },
      },
      {
        name: 'Biên số 0 (0, 0)',
        input: { x: '0', y: '0' },
      },
      {
        name: 'Biên cực trị (1000, -1000)',
        input: { x: '1000', y: '-1000' },
      },
    ],
    parse: (raw: Record<string, string>): ParseResult<{ x: number; y: number }> => {
      const x = Number(raw.x);
      const y = Number(raw.y);
      if (raw.x === undefined || raw.x === '' || isNaN(x) || !Number.isInteger(x)) {
        return { ok: false, error: 'Giá trị x phải là một số nguyên hợp lệ.' };
      }
      if (raw.y === undefined || raw.y === '' || isNaN(y) || !Number.isInteger(y)) {
        return { ok: false, error: 'Giá trị y phải là một số nguyên hợp lệ.' };
      }
      return { ok: true, value: { x, y } };
    },
    toStdin: (val: unknown): string => {
      const { x, y } = val as { x: number; y: number };
      return `${x}\n${y}`;
    },
  },
  code: sampleCode,
  lineNotes: [
    'Đọc số nguyên x từ đầu vào',
    'Đọc số nguyên y từ đầu vào',
    'Khởi tạo biến a mang giá trị của x',
    'Khởi tạo biến b mang giá trị của y',
    'Cộng a với b và ghi đè kết quả vào ô nhớ a',
    'In giá trị của a và b ra màn hình',
  ],
  generateSteps: (input: unknown): Step[] => {
    const { x, y } = input as { x: number; y: number };
    const steps: Step[] = [];

    // Bước 1: x = int(input())
    steps.push({
      line: 1,
      vars: { x },
      highlights: [{ target: 'var:x', indices: [], role: 'active' }],
      explain: `Đọc giá trị x = ${x} từ đầu vào và cấp phát ô nhớ cho biến x.`,
      snapshot: {},
      ops: 1,
    });

    // Bước 2: y = int(input())
    steps.push({
      line: 2,
      vars: { x, y },
      highlights: [{ target: 'var:y', indices: [], role: 'active' }],
      explain: `Đọc giá trị y = ${y} từ đầu vào và cấp phát ô nhớ cho biến y.`,
      snapshot: {},
      ops: 2,
    });

    // Bước 3: a = x
    steps.push({
      line: 3,
      vars: { x, y, a: x },
      highlights: [{ target: 'var:a', indices: [], role: 'active' }],
      explain: `Gán a = x. Tạo biến a trỏ vào ô nhớ có giá trị ${x}.`,
      snapshot: {},
      ops: 3,
    });

    // Bước 4: b = y
    steps.push({
      line: 4,
      vars: { x, y, a: x, b: y },
      highlights: [{ target: 'var:b', indices: [], role: 'active' }],
      explain: `Gán b = y. Tạo biến b trỏ vào ô nhớ có giá trị ${y}.`,
      snapshot: {},
      ops: 4,
    });

    // Bước 5: a = a + b (KEY STEP)
    const sumVal = x + y;
    steps.push({
      line: 5,
      vars: { x, y, a: sumVal, b: y },
      highlights: [{ target: 'var:a', indices: [], role: 'swap' }],
      explain: `Tính a + b = ${x} + ${y} = ${sumVal}, sau đó ghi đè giá trị này vào ô nhớ a. Giá trị của b vẫn là ${y}.`,
      snapshot: {},
      ops: 6,
      key: true,
    });

    // Bước 6: print(a, b)
    steps.push({
      line: 6,
      vars: { x, y, a: sumVal, b: y },
      highlights: [
        { target: 'var:a', indices: [], role: 'done' },
        { target: 'var:b', indices: [], role: 'done' },
      ],
      explain: `In kết quả: a = ${sumVal}, b = ${y} ra màn hình.`,
      snapshot: {},
      ops: 7,
      output: `${sumVal} ${y}`,
    });

    return steps;
  },
  reference: (input: unknown): string => {
    const { x, y } = input as { x: number; y: number };
    return `${x + y} ${y}`;
  },
  selfTest: (assert) => {
    // 1. Test thông thường: x = 3, y = 4 -> a = 7, b = 4
    const s1 = lesson.generateSteps({ x: 3, y: 4 });
    const out1 = s1[s1.length - 1]?.output;
    const ref1 = lesson.reference({ x: 3, y: 4 });
    assert(out1 === '7 4', `Thông thường (3, 4): output = "${out1}", mong đợi "7 4"`);
    assert(ref1 === '7 4', `Thông thường (3, 4): reference = "${ref1}", mong đợi "7 4"`);

    // 2. Test biên: x = 0, y = 0 -> a = 0, b = 0
    const s2 = lesson.generateSteps({ x: 0, y: 0 });
    const out2 = s2[s2.length - 1]?.output;
    const ref2 = lesson.reference({ x: 0, y: 0 });
    assert(out2 === '0 0', `Biên số 0 (0, 0): output = "${out2}", mong đợi "0 0"`);
    assert(ref2 === '0 0', `Biên số 0 (0, 0): reference = "${ref2}", mong đợi "0 0"`);

    // 3. Test đặc biệt: Số âm x = -5, y = 12 -> a = 7, b = 12
    const s3 = lesson.generateSteps({ x: -5, y: 12 });
    const out3 = s3[s3.length - 1]?.output;
    const ref3 = lesson.reference({ x: -5, y: 12 });
    assert(out3 === '7 12', `Đặc biệt số âm (-5, 12): output = "${out3}", mong đợi "7 12"`);
    assert(ref3 === '7 12', `Đặc biệt số âm (-5, 12): reference = "${ref3}", mong đợi "7 12"`);

    // 4. Test biên cực trị: x = 1000, y = -1000 -> a = 0, b = -1000
    const s4 = lesson.generateSteps({ x: 1000, y: -1000 });
    const out4 = s4[s4.length - 1]?.output;
    const ref4 = lesson.reference({ x: 1000, y: -1000 });
    assert(out4 === '0 -1000', `Biên cực trị (1000, -1000): output = "${out4}", mong đợi "0 -1000"`);
    assert(ref4 === '0 -1000', `Biên cực trị (1000, -1000): reference = "${ref4}", mong đợi "0 -1000"`);
  },
  rubric,
  task,
  stages,
};

export default lesson;
