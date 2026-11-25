import { Lesson, Step, ParseResult, Task, Rubric, Stage } from '../core/types.ts';

interface SwapInput {
  a: number;
  b: number;
}

const sampleCode = [
  'a = int(input())',
  'b = int(input())',
  'temp = a',
  'a = b',
  'b = temp',
  'print(a, b)',
];

const task: Task = {
  kind: 'code',
  statement:
    'Cho hai số nguyên a và b. Hãy thực hiện hoán đổi giá trị của hai biến sao cho giá trị ban đầu của a chuyển sang b, và giá trị ban đầu của b chuyển sang a. In ra a và b sau khi hoán đổi.',
  inputFormat: 'Gồm 2 dòng: dòng 1 là số nguyên a, dòng 2 là số nguyên b (-10^9 <= a, b <= 10^9).',
  outputFormat: 'In ra hai số nguyên a và b sau khi hoán đổi trên cùng một dòng, cách nhau bởi khoảng trắng.',
  constraints: '-10^9 <= a, b <= 10^9; Thời gian chạy: 1.0s',
  glossary: [
    { term: 'Biến tạm (temp)', meaning: 'Biến trung gian lưu giữ giá trị của biến thứ nhất trước khi bị biến thứ hai ghi đè' },
    { term: 'Tuple unpacking', meaning: 'Cú pháp a, b = b, a trong Python cho phép hoán đổi đồng thời mà không cần tạo biến tạm tường minh' },
  ],
  examples: [
    { input: '3\n5', output: '5 3', note: 'Ban đầu a=3, b=5. Sau khi đổi chỗ: a=5, b=3' },
    { input: '-10\n20', output: '20 -10', note: 'a=-10, b=20 -> a=20, b=-10' },
  ],
  ioMode: { kind: 'stdio' },
  referenceSolution: 'a = int(input())\nb = int(input())\na, b = b, a\nprint(a, b)',
  tests: [
    { input: '3\n5', output: '5 3', label: 'Ví dụ 1', isPublic: true },
    { input: '-10\n20', output: '20 -10', label: 'Ví dụ 2', isPublic: true },
    { input: '0\n0', output: '0 0', label: 'Biên hai số 0', isPublic: false },
    { input: '100\n100', output: '100 100', label: 'Biên hai số bằng nhau', isPublic: false },
    { input: '-999\n999', output: '999 -999', label: 'Biên đối xứng', isPublic: false },
    { input: '42\n58', output: '58 42', label: 'Ngẫu nhiên 1', isPublic: false },
    { input: '7\n1', output: '1 7', label: 'Ngẫu nhiên 2', isPublic: false },
    { input: '-50\n-80', output: '-80 -50', label: 'Ngẫu nhiên 3', isPublic: false },
    { input: '123456\n654321', output: '654321 123456', label: 'Ngẫu nhiên 4', isPublic: false },
  ],
  analysis: {
    maxN: '|a|, |b| <= 10^9',
    expectedComplexities: ['O(1) thời gian', 'O(1) bộ nhớ'],
    note: 'Thuật toán hoán đổi cơ bản ứng dụng liên tục trong các thuật toán sắp xếp (Bubble sort, Selection sort, Quick sort).',
  },
  starterCode: '# Nhập 2 số a, b và hoán đổi giá trị\na = int(input())\nb = int(input())\n# Viết lệnh hoán đổi và in ra màn hình\n',
  timeLimitSec: 3,
};

const rubric: Rubric = {
  keyIdeas: [
    {
      id: 'idea-temp-store',
      description: 'Lưu giữ giá trị ban đầu của biến a vào biến tạm temp trước khi a bị thay đổi',
      keywords: ['temp = a', 'biến tạm', 'lưu giữ'],
    },
    {
      id: 'idea-overwrite-assign',
      description: 'Gán a = b rồi lấy lại giá trị cũ của a từ temp gán cho b (b = temp)',
      keywords: ['a = b', 'b = temp', 'hoán đổi'],
    },
    {
      id: 'idea-print-swapped',
      description: 'In ra màn hình hai biến đã được hoán đổi thành công',
      keywords: ['print', 'a, b', 'xuất'],
    },
  ],
  commonMistakes: [
    'Gán a = b rồi gán b = a (làm mất giá trị ban đầu của a, khiến cả hai biến đều mang giá trị của b)',
    'Nhầm lẫn thứ tự: gán b = a trước khi gán a = b',
    'Chỉ in print(b, a) mà không thực sự thay đổi giá trị của hai biến trong bộ nhớ',
  ],
  hintsByIdea: {
    'idea-temp-store': [
      'Bậc 1: Nếu gán a = b ngay, giá trị cũ của a sẽ ra sao?',
      'Bậc 2: Giá trị cũ của a sẽ bị mất, do đó cần một biến phụ temp = a để cất giữ.',
      'Bậc 3: temp = a',
      'Bậc 4: temp = ___',
    ],
    'idea-overwrite-assign': [
      'Bậc 1: Sau khi đã cất a vào temp, ta gán giá trị của b vào a bằng lệnh nào?',
      'Bậc 2: Gán a = b, sau đó lấy giá trị từ temp gán vào b: b = temp.',
      'Bậc 3: a = b\nb = temp',
      'Bậc 4: a = b\nb = ___',
    ],
    'idea-print-swapped': [
      'Bậc 1: In hai biến a và b ra màn hình sau khi đổi.',
      'Bậc 2: print(a, b).',
      'Bậc 3: print(a, b)',
      'Bậc 4: print(___, ___)',
    ],
  },
};

const stages: Stage[] = [
  {
    title: 'Đọc dữ liệu',
    goal: 'Đọc hai số a và b từ bàn phím',
    question: 'Hai biến a và b trỏ vào hai ô nhớ độc lập như thế nào?',
    codeLines: [1, 2],
    blanks: [
      { line: 1, before: 'a = ', answer: 'int(input())', after: '' },
      { line: 2, before: 'b = ', answer: 'int(input())', after: '' },
    ],
  },
  {
    title: 'Hoán đổi bằng biến tạm',
    goal: 'Cất giá trị a vào temp, đổi a sang b và b sang temp',
    question: 'Tại sao cần lệnh temp = a trước khi gán a = b?',
    codeLines: [3, 5],
    blanks: [
      { line: 3, before: 'temp = ', answer: 'a', after: '' },
      { line: 4, before: 'a = ', answer: 'b', after: '' },
      { line: 5, before: 'b = ', answer: 'temp', after: '' },
    ],
  },
  {
    title: 'In kết quả',
    goal: 'Xuất a và b sau hoán đổi',
    question: 'Giá trị a và b lúc này so với ban đầu đã thay đổi ra sao?',
    codeLines: [6, 6],
    blanks: [{ line: 6, before: 'print(', answer: 'a, b', after: ')' }],
  },
];

export const lesson: Lesson = {
  id: 'concept-assignment-swap',
  explanation: [
    {
      type: 'text',
      text: 'Hãy tưởng tượng bạn có 2 chiếc cốc: cốc A đựng nước cam, cốc B đựng sữa. Bạn muốn đổi nước cam sang cốc B và sữa sang cốc A. Bạn không thể đổ trực tiếp vì chúng sẽ bị trộn lẫn vào nhau! Bạn bắt buộc phải dùng thêm 1 chiếc cốc rỗng tạm thời (cốc TEMP).',
    },
    {
      type: 'text',
      text: 'Quy trình 3 bước với biến tạm:\n1. Đổ nước cam từ cốc A sang cốc TEMP (temp = a)\n2. Đổ sữa từ cốc B sang cốc A (a = b)\n3. Đổ nước cam từ cốc TEMP sang cốc B (b = temp)\nBây giờ cốc A đã chứa sữa, và cốc B chứa nước cam!',
    },
    {
      type: 'example',
      title: 'Đổi chỗ kỳ diệu trong Python: a, b = b, a',
      body: 'Python hỗ trợ cú pháp đặc biệt "a, b = b, a". Máy tính sẽ tự động đóng gói vế phải thành tuple (b, a) trước khi mở gói gán cho a và b, không cần viết 3 dòng!',
    },
    {
      type: 'callout',
      tone: 'warn',
      text: 'BẪY PYTHON CHẾT NGƯỜI: Sai lầm phổ biến nhất của người mới học là viết:\na = b\nb = a\nSau câu lệnh đầu tiên "a = b", ô nhớ a đã bị ghi đè bằng giá trị của b. Giá trị ban đầu của a vĩnh viễn biến mất! Câu lệnh tiếp theo "b = a" chỉ đơn giản là gán lại giá trị vừa nhận, kết quả là cả a và b đều bị biến thành b!',
    },
  ],
  sample: {
    statement:
      'Cho hai số nguyên a và b. Quan sát quá trình đổi chỗ từng bước bằng biến trung gian temp: temp = a, a = b, b = temp.',
    constraints: '-10^9 <= a, b <= 10^9',
    maxSimSize: 'Hoán đổi 2 biến',
    fields: [
      {
        key: 'a',
        label: 'Số nguyên a ban đầu',
        placeholder: 'Ví dụ: 3',
        kind: 'int',
      },
      {
        key: 'b',
        label: 'Số nguyên b ban đầu',
        placeholder: 'Ví dụ: 5',
        kind: 'int',
      },
    ],
    defaultInput: {
      a: '3',
      b: '5',
    },
    presets: [
      {
        name: 'Ví dụ 1 (3 và 5)',
        input: { a: '3', b: '5' },
      },
      {
        name: 'Số âm (-10 và 20)',
        input: { a: '-10', b: '20' },
      },
      {
        name: 'Biên số 0 (0 và 0)',
        input: { a: '0', b: '0' },
      },
      {
        name: 'Hai số bằng nhau (100 và 100)',
        input: { a: '100', b: '100' },
      },
    ],
    parse: (raw: Record<string, string>): ParseResult<SwapInput> => {
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
      const { a, b } = val as SwapInput;
      return `${a}\n${b}`;
    },
  },
  code: sampleCode,
  lineNotes: [
    'Đọc số nguyên a từ bàn phím',
    'Đọc số nguyên b từ bàn phím',
    'Lưu giá trị của a vào biến tạm temp để không bị mất',
    'Gán giá trị của b cho biến a (a nhận giá trị mới)',
    'Lấy lại giá trị ban đầu của a (từ temp) gán cho biến b',
    'In ra màn hình hai biến sau khi hoán đổi',
  ],
  generateSteps: (input: unknown): Step[] => {
    const { a: initA, b: initB } = input as SwapInput;
    const steps: Step[] = [];
    let ops = 0;

    // Bước 1: a = int(input())
    ops += 1;
    steps.push({
      line: 1,
      vars: { a: initA },
      highlights: [{ target: 'var:a', indices: [], role: 'active' }],
      explain: `Khởi tạo biến a = ${initA}.`,
      snapshot: {},
      ops,
    });

    // Bước 2: b = int(input())
    ops += 1;
    steps.push({
      line: 2,
      vars: { a: initA, b: initB },
      highlights: [{ target: 'var:b', indices: [], role: 'active' }],
      explain: `Khởi tạo biến b = ${initB}.`,
      snapshot: {},
      ops,
    });

    // Bước 3: temp = a (KEY STEP)
    ops += 1;
    steps.push({
      line: 3,
      vars: { a: initA, b: initB, temp: initA },
      highlights: [{ target: 'var:temp', indices: [], role: 'active' }],
      explain: `Cất giá trị của a (${initA}) vào biến tạm temp để bảo toàn.`,
      snapshot: {},
      ops,
      key: true,
    });

    // Bước 4: a = b (KEY STEP)
    ops += 1;
    steps.push({
      line: 4,
      vars: { a: initB, b: initB, temp: initA },
      highlights: [{ target: 'var:a', indices: [], role: 'swap' }],
      explain: `Gán a = b: biến a nhận giá trị mới là ${initB}.`,
      snapshot: {},
      ops,
      key: true,
    });

    // Bước 5: b = temp (KEY STEP)
    ops += 1;
    steps.push({
      line: 5,
      vars: { a: initB, b: initA, temp: initA },
      highlights: [{ target: 'var:b', indices: [], role: 'swap' }],
      explain: `Gán b = temp: biến b nhận lại giá trị ban đầu của a là ${initA}. Hoán đổi hoàn tất!`,
      snapshot: {},
      ops,
      key: true,
    });

    // Bước 6: print(a, b)
    ops += 1;
    const outStr = `${initB} ${initA}`;
    steps.push({
      line: 6,
      vars: { a: initB, b: initA, temp: initA },
      highlights: [
        { target: 'var:a', indices: [], role: 'done' },
        { target: 'var:b', indices: [], role: 'done' },
      ],
      explain: `In kết quả sau hoán đổi: a = ${initB}, b = ${initA}.`,
      snapshot: {},
      ops,
      output: outStr,
    });

    return steps;
  },
  reference: (input: unknown): string => {
    const { a, b } = input as SwapInput;
    return `${b} ${a}`;
  },
  selfTest: (assert) => {
    // 1. Thường
    const s1 = lesson.generateSteps({ a: 3, b: 5 });
    const out1 = s1[s1.length - 1]?.output;
    assert(out1 === '5 3', `Test 1 ra: "${out1}"`);
    assert(lesson.reference({ a: 3, b: 5 }) === '5 3', 'Ref 1 sai');

    // 2. Số âm
    const s2 = lesson.generateSteps({ a: -10, b: 20 });
    const out2 = s2[s2.length - 1]?.output;
    assert(out2 === '20 -10', `Test 2 ra: "${out2}"`);
    assert(lesson.reference({ a: -10, b: 20 }) === '20 -10', 'Ref 2 sai');

    // 3. Hai số bằng nhau
    const s3 = lesson.generateSteps({ a: 0, b: 0 });
    const out3 = s3[s3.length - 1]?.output;
    assert(out3 === '0 0', `Test 3 ra: "${out3}"`);
  },
  rubric,
  task,
  stages,
};

export default lesson;
