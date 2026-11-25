import { Lesson, Step, ParseResult, Task, Rubric, Stage } from '../core/types.ts';

interface DataTypesInput {
  n: number;
  f: number;
  s: string;
}

function formatPyFloat(f: number): string {
  if (Object.is(f, -0)) return '-0.0';
  return Number.isInteger(f) ? f.toFixed(1) : String(f);
}

const sampleCode = [
  'n = int(input())',
  'f = float(input())',
  's = input()',
  'is_pos = (n > 0)',
  'print(n, f, s, is_pos)',
];

const task: Task = {
  kind: 'code',
  statement:
    'Đọc vào một số nguyên n, một số thực f và một xâu ký tự s. Kiểm tra xem n có dương hay không lưu vào biến boolean is_pos = (n > 0). In ra n, f, s và is_pos trên một dòng cách nhau bởi khoảng trắng.',
  inputFormat: 'Gồm 3 dòng: dòng 1 là số nguyên n, dòng 2 là số thực f, dòng 3 là xâu ký tự s.',
  outputFormat: 'In ra giá trị của n, f, s, is_pos trên cùng một dòng cách nhau bởi dấu cách.',
  constraints: '-10^9 <= n <= 10^9; f có độ chính xác float; độ dài xâu s <= 50',
  glossary: [
    { term: 'int', meaning: 'Kiểu số nguyên (không có phần thập phân, trong Python độ dài số nguyên là vô hạn)' },
    { term: 'float', meaning: 'Kiểu số thực có dấu chấm thập phân (biểu diễn theo chuẩn IEEE 754)' },
    { term: 'str', meaning: 'Kiểu xâu ký tự (chuỗi văn bản đặt trong dấu nháy kép hoặc nháy đơn)' },
    { term: 'bool', meaning: 'Kiểu logic chỉ nhận một trong hai giá trị True hoặc False' },
  ],
  examples: [
    { input: '5\n3.14\nCodeTrekking', output: '5 3.14 CodeTrekking True', note: 'n=5 > 0 nên is_pos = True' },
    { input: '-3\n0.5\nPython', output: '-3 0.5 Python False', note: 'n=-3 <= 0 nên is_pos = False' },
  ],
  ioMode: { kind: 'stdio' },
  referenceSolution:
    'n = int(input())\nf = float(input())\ns = input()\nis_pos = (n > 0)\nprint(n, f, s, is_pos)',
  tests: [
    { input: '5\n3.14\nCodeTrekking', output: '5 3.14 CodeTrekking True', label: 'Ví dụ 1', isPublic: true },
    { input: '-3\n0.5\nPython', output: '-3 0.5 Python False', label: 'Ví dụ 2', isPublic: true },
    { input: '0\n0.0\nZero', output: '0 0.0 Zero False', label: 'Biên số 0', isPublic: false },
    { input: '100\n-2.718\nNegativeFloat', output: '100 -2.718 NegativeFloat True', label: 'Biên float âm', isPublic: false },
    { input: '-1000\n100.5\nTestNegative', output: '-1000 100.5 TestNegative False', label: 'Biên n âm lớn', isPublic: false },
    { input: '42\n1.23\nHello', output: '42 1.23 Hello True', label: 'Ngẫu nhiên 1', isPublic: false },
    { input: '-7\n9.99\nTinHoc', output: '-7 9.99 TinHoc False', label: 'Ngẫu nhiên 2', isPublic: false },
    { input: '1\n0.001\nSmall', output: '1 0.001 Small True', label: 'Ngẫu nhiên 3', isPublic: false },
    { input: '999\n50.0\nMaster', output: '999 50.0 Master True', label: 'Ngẫu nhiên 4', isPublic: false },
  ],
  analysis: {
    maxN: 'n <= 10^9, s <= 50 ký tự',
    expectedComplexities: ['O(1) thời gian', 'O(1) bộ nhớ'],
    note: 'Bài học nền tảng giúp phân biệt rõ 4 kiểu dữ liệu nguyên thủy trong bộ nhớ máy tính.',
  },
  starterCode: '# Nhập 3 kiểu dữ liệu và kiểm tra logic\nn = int(input())\nf = float(input())\ns = input()\n# Tạo biến bool và in kết quả\n',
  timeLimitSec: 3,
};

const rubric: Rubric = {
  keyIdeas: [
    {
      id: 'idea-primitive-types',
      description: 'Nhận diện và ép đúng kiểu dữ liệu nguyên thủy (int, float, str)',
      keywords: ['int', 'float', 'input', 'str'],
    },
    {
      id: 'idea-boolean-logic',
      description: 'Tạo biểu thức điều kiện trả về kiểu boolean (True/False)',
      keywords: ['is_pos = (n > 0)', 'bool', 'so sánh'],
    },
    {
      id: 'idea-print-types',
      description: 'In cả 4 giá trị thuộc 4 kiểu dữ liệu khác nhau trên 1 dòng',
      keywords: ['print', 'n, f, s, is_pos'],
    },
  ],
  commonMistakes: [
    'Quên ép kiểu float() cho số thực mà để kiểu xâu str',
    'Nhầm lẫn True/False viết hoa chữ cái đầu trong Python (true/false là lỗi NameError)',
    'Nhầm phép so sánh n > 0 (với n = 0 thì 0 > 0 cho False)',
  ],
  hintsByIdea: {
    'idea-primitive-types': [
      'Bậc 1: Để đọc số nguyên dùng int(input()), vậy số thực có dấu chấm thập phân dùng hàm nào?',
      'Bậc 2: Dùng hàm float(input()) để đọc số thực.',
      'Bậc 3: n = int(input())\nf = float(input())\ns = input()',
      'Bậc 4: n = int(input())\nf = float(___())\ns = input()',
    ],
    'idea-boolean-logic': [
      'Bậc 1: Kết quả của phép so sánh n > 0 thuộc kiểu dữ liệu nào?',
      'Bậc 2: Biểu thức n > 0 trả về giá trị True nếu n > 0, ngược lại trả về False.',
      'Bậc 3: is_pos = (n > 0)',
      'Bậc 4: is_pos = (n > ___)',
    ],
    'idea-print-types': [
      'Bậc 1: Dùng lệnh print để in đồng thời 4 biến.',
      'Bậc 2: Các đối số truyền vào print() được phân tách bởi dấu phẩy.',
      'Bậc 3: print(n, f, s, is_pos)',
      'Bậc 4: print(n, f, s, ___)',
    ],
  },
};

const stages: Stage[] = [
  {
    title: 'Đọc dữ liệu nguyên thủy',
    goal: 'Ép kiểu đúng cho int, float và str từ bàn phím',
    question: 'Hàm input() mặc định trả về dữ liệu kiểu gì?',
    codeLines: [1, 3],
    blanks: [
      { line: 1, before: 'n = ', answer: 'int(input())', after: '' },
      { line: 2, before: 'f = ', answer: 'float(input())', after: '' },
      { line: 3, before: 's = ', answer: 'input()', after: '' },
    ],
  },
  {
    title: 'Khởi tạo biến logic',
    goal: 'Gán kết quả phép so sánh n > 0 cho biến bool',
    question: 'Kiểu bool trong Python chỉ có thể nhận những giá trị nào?',
    codeLines: [4, 4],
    blanks: [{ line: 4, before: 'is_pos = ', answer: '(n > 0)', after: '' }],
  },
  {
    title: 'In toàn bộ 4 kiểu',
    goal: 'Xuất các giá trị ra màn hình',
    question: 'Hàm print() có tự động ngăn cách các giá trị bằng dấu cách không?',
    codeLines: [5, 5],
    blanks: [{ line: 5, before: 'print(', answer: 'n, f, s, is_pos', after: ')' }],
  },
];

export const lesson: Lesson = {
  id: 'concept-data-types',
  explanation: [
    {
      type: 'text',
      text: 'Hãy tưởng tượng các ô nhớ trong máy tính như những chiếc hộp với kích thước và cách sắp đặt đồ vật khác nhau: hộp đựng số nguyên nguyên khối (int), hộp đựng số thập phân đo lường (float), hộp đựng cuộn băng chữ cái (str), và chiếc công tắc đèn chỉ có 2 nấc Bật/Tắt (bool).',
    },
    {
      type: 'text',
      text: 'Python có 4 kiểu dữ liệu nguyên thủy cốt lõi:\n1. int: Số nguyên (... -2, -1, 0, 1, 2 ...)\n2. float: Số thực có dấu phẩy động (3.14, -0.5, 2.0)\n3. str: Xâu ký tự chứa văn bản ("Hello", \'Python\')\n4. bool: Kiểu logic boolean với đúng 2 giá trị True và False.',
    },
    {
      type: 'example',
      title: 'Kiểm tra kiểu dữ liệu với type()',
      body: 'type(42) là int, type(3.14) là float, type("TinHoc") là str, type(5 > 3) là bool.',
    },
    {
      type: 'callout',
      tone: 'warn',
      text: 'BẪY PYTHON: Trong Python, bool là lớp con của int, nghĩa là True tương đương số 1 và False tương đương số 0. Lệnh "True + True" sẽ ra kết quả bằng 2! Ngoài ra, float bị sai số dấu phẩy động: "0.1 + 0.2 == 0.3" sẽ trả về False vì thực tế kết quả là 0.30000000000000004.',
    },
  ],
  sample: {
    statement:
      'Nhập vào 1 số nguyên n, 1 số thực f và 1 xâu s. Tạo biến bool is_pos = (n > 0) và quan sát 4 ô nhớ với 4 kiểu dữ liệu.',
    constraints: '-10^9 <= n <= 10^9, độ dài s <= 30',
    maxSimSize: 'Bộ nhớ 4 biến nguyên thủy',
    fields: [
      {
        key: 'n',
        label: 'Số nguyên n',
        placeholder: 'Ví dụ: 5',
        kind: 'int',
      },
      {
        key: 'f',
        label: 'Số thực f',
        placeholder: 'Ví dụ: 3.14',
        kind: 'string',
        help: 'Nhập số thập phân dùng dấu chấm, ví dụ 3.14 hoặc 0.5',
      },
      {
        key: 's',
        label: 'Xâu ký tự s',
        placeholder: 'Ví dụ: CodeTrekking',
        kind: 'string',
      },
    ],
    defaultInput: {
      n: '5',
      f: '3.14',
      s: 'CodeTrekking',
    },
    presets: [
      {
        name: 'Ví dụ 1 (5, 3.14, CodeTrekking)',
        input: { n: '5', f: '3.14', s: 'CodeTrekking' },
      },
      {
        name: 'Ví dụ 2 (-3, 0.5, Python)',
        input: { n: '-3', f: '0.5', s: 'Python' },
      },
      {
        name: 'Biên số 0 (0, 0.0, Zero)',
        input: { n: '0', f: '0.0', s: 'Zero' },
      },
      {
        name: 'Biên float âm (100, -2.718, Negative)',
        input: { n: '100', f: '-2.718', s: 'Negative' },
      },
    ],
    parse: (raw: Record<string, string>): ParseResult<DataTypesInput> => {
      const n = Number(raw.n);
      if (raw.n === undefined || raw.n === '' || isNaN(n) || !Number.isInteger(n)) {
        return { ok: false, error: 'Giá trị n phải là một số nguyên hợp lệ.' };
      }
      const f = Number(raw.f);
      if (raw.f === undefined || raw.f === '' || isNaN(f)) {
        return { ok: false, error: 'Giá trị f phải là một số thực hợp lệ (ví dụ: 3.14).' };
      }
      const s = raw.s ?? '';
      if (s.trim().length === 0) {
        return { ok: false, error: 'Xâu s không được để trống.' };
      }
      return { ok: true, value: { n, f, s } };
    },
    toStdin: (val: unknown): string => {
      const { n, f, s } = val as DataTypesInput;
      return `${n}\n${formatPyFloat(f)}\n${s}`;
    },
  },
  code: sampleCode,
  lineNotes: [
    'Đọc số nguyên n từ bàn phím bằng int(input())',
    'Đọc số thực f từ bàn phím bằng float(input())',
    'Đọc xâu ký tự s từ bàn phím bằng input()',
    'Tạo biến boolean is_pos lưu kết quả so sánh n > 0 (True hoặc False)',
    'In ra màn hình cả 4 giá trị đại diện cho 4 kiểu dữ liệu',
  ],
  generateSteps: (input: unknown): Step[] => {
    const { n, f, s } = input as DataTypesInput;
    const steps: Step[] = [];
    let ops = 0;

    // Bước 1: n = int(input())
    ops += 1;
    steps.push({
      line: 1,
      vars: { 'n (int)': n },
      highlights: [{ target: 'var:n (int)', indices: [], role: 'active' }],
      explain: `Đọc n = ${n}, cấp phát ô nhớ kiểu int (số nguyên).`,
      snapshot: {},
      ops,
    });

    // Bước 2: f = float(input())
    ops += 1;
    const fStr = formatPyFloat(f);
    steps.push({
      line: 2,
      vars: { 'n (int)': n, 'f (float)': fStr },
      highlights: [{ target: 'var:f (float)', indices: [], role: 'active' }],
      explain: `Đọc f = ${fStr}, cấp phát ô nhớ kiểu float (số thực dấu phẩy động).`,
      snapshot: {},
      ops,
    });

    // Bước 3: s = input()
    ops += 1;
    steps.push({
      line: 3,
      vars: { 'n (int)': n, 'f (float)': fStr, 's (str)': s },
      highlights: [{ target: 'var:s (str)', indices: [], role: 'active' }],
      explain: `Đọc xâu ký tự s = "${s}", cấp phát ô nhớ kiểu str.`,
      snapshot: {},
      ops,
    });

    // Bước 4: is_pos = (n > 0)
    ops += 1;
    const is_pos = n > 0;
    steps.push({
      line: 4,
      vars: {
        'n (int)': n,
        'f (float)': fStr,
        's (str)': s,
        'is_pos (bool)': is_pos,
      },
      highlights: [{ target: 'var:is_pos (bool)', indices: [], role: 'found' }],
      explain: `So sánh n > 0 (${n} > 0) cho kết quả boolean: is_pos = ${is_pos ? 'True' : 'False'}.`,
      snapshot: {},
      ops,
      key: true,
    });

    // Bước 5: print(n, f, s, is_pos)
    ops += 1;
    const outStr = `${n} ${fStr} ${s} ${is_pos ? 'True' : 'False'}`;
    steps.push({
      line: 5,
      vars: {
        'n (int)': n,
        'f (float)': fStr,
        's (str)': s,
        'is_pos (bool)': is_pos,
      },
      highlights: [
        { target: 'var:n (int)', indices: [], role: 'done' },
        { target: 'var:f (float)', indices: [], role: 'done' },
        { target: 'var:s (str)', indices: [], role: 'done' },
        { target: 'var:is_pos (bool)', indices: [], role: 'done' },
      ],
      explain: `In toàn bộ 4 kiểu dữ liệu ra màn hình: ${outStr}.`,
      snapshot: {},
      ops,
      output: outStr,
    });

    return steps;
  },
  reference: (input: unknown): string => {
    const { n, f, s } = input as DataTypesInput;
    return `${n} ${formatPyFloat(f)} ${s} ${n > 0 ? 'True' : 'False'}`;
  },
  selfTest: (assert) => {
    // 1. Bình thường
    const s1 = lesson.generateSteps({ n: 5, f: 3.14, s: 'CodeTrekking' });
    const out1 = s1[s1.length - 1]?.output;
    assert(out1 === '5 3.14 CodeTrekking True', `Test 1 ra: "${out1}"`);
    assert(lesson.reference({ n: 5, f: 3.14, s: 'CodeTrekking' }) === '5 3.14 CodeTrekking True', 'Ref 1 sai');

    // 2. Số âm
    const s2 = lesson.generateSteps({ n: -3, f: 0.5, s: 'Python' });
    const out2 = s2[s2.length - 1]?.output;
    assert(out2 === '-3 0.5 Python False', `Test 2 ra: "${out2}"`);
    assert(lesson.reference({ n: -3, f: 0.5, s: 'Python' }) === '-3 0.5 Python False', 'Ref 2 sai');

    // 3. Biên số 0
    const s3 = lesson.generateSteps({ n: 0, f: 0.0, s: 'Zero' });
    const out3 = s3[s3.length - 1]?.output;
    assert(out3 === '0 0.0 Zero False', `Test 3 ra: "${out3}"`);
  },
  rubric,
  task,
  stages,
};

export default lesson;
