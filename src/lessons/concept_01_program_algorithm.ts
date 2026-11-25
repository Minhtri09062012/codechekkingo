import { Lesson, Step, ParseResult, Task, Rubric, Stage, TextSnapshot } from '../core/types.ts';

interface ProgramInput {
  a: number;
  b: number;
}

const sampleCode = [
  'a = int(input())',
  'b = int(input())',
  'c = a + b',
  'print("Tong la:", c)',
  'print("Hoan thanh")',
];

const task: Task = {
  kind: 'code',
  statement:
    'Cho hai số nguyên a và b. Hãy tính tổng c = a + b và in ra hai dòng: dòng đầu ghi "Tong la: <c>", dòng thứ hai ghi "Hoan thanh".',
  inputFormat: 'Gồm 2 dòng: dòng 1 là số nguyên a, dòng 2 là số nguyên b (-10^9 <= a, b <= 10^9).',
  outputFormat: 'Dòng 1 in "Tong la: <c>", dòng 2 in "Hoan thanh".',
  constraints: '-10^9 <= a, b <= 10^9; Thời gian chạy: 1.0s',
  glossary: [
    { term: 'Lệnh tuần tự (Sequential)', meaning: 'Các dòng lệnh thực thi lần lượt từ trên xuống dưới, lệnh trước xong mới tới lệnh sau' },
    { term: 'Thông dịch (Interpreter)', meaning: 'Trình chạy đọc và thực thi từng dòng lệnh một thay vì biên dịch toàn bộ cùng lúc' },
  ],
  examples: [
    { input: '3\n5', output: 'Tong la: 8\nHoan thanh', note: 'a=3, b=5 -> tổng là 8' },
    { input: '10\n-4', output: 'Tong la: 6\nHoan thanh', note: 'a=10, b=-4 -> tổng là 6' },
  ],
  ioMode: { kind: 'stdio' },
  referenceSolution: 'a = int(input())\nb = int(input())\nc = a + b\nprint("Tong la:", c)\nprint("Hoan thanh")',
  tests: [
    { input: '3\n5', output: 'Tong la: 8\nHoan thanh', label: 'Ví dụ 1', isPublic: true },
    { input: '10\n-4', output: 'Tong la: 6\nHoan thanh', label: 'Ví dụ 2', isPublic: true },
    { input: '0\n0', output: 'Tong la: 0\nHoan thanh', label: 'Biên: Hai số 0', isPublic: false },
    { input: '-100\n-200', output: 'Tong la: -300\nHoan thanh', label: 'Biên: Hai số âm', isPublic: false },
    { input: '1000\n-1000', output: 'Tong la: 0\nHoan thanh', label: 'Biên: Đối xứng', isPublic: false },
    { input: '123\n456', output: 'Tong la: 579\nHoan thanh', label: 'Ngẫu nhiên 1', isPublic: false },
    { input: '9999\n1', output: 'Tong la: 10000\nHoan thanh', label: 'Ngẫu nhiên 2', isPublic: false },
    { input: '-50\n50', output: 'Tong la: 0\nHoan thanh', label: 'Ngẫu nhiên 3', isPublic: false },
    { input: '42\n58', output: 'Tong la: 100\nHoan thanh', label: 'Ngẫu nhiên 4', isPublic: false },
  ],
  analysis: {
    maxN: '|a|, |b| <= 10^9',
    expectedComplexities: ['O(1) thời gian', 'O(1) bộ nhớ'],
    note: 'Thuật toán tuần tự cơ bản với 3 thao tác: Nhập -> Xử lý tính toán -> Xuất kết quả.',
  },
  starterCode: '# Nhập 2 số a, b và in tổng tuần tự\na = int(input())\nb = int(input())\n# Tính tổng và in ra màn hình\n',
  timeLimitSec: 3,
};

const rubric: Rubric = {
  keyIdeas: [
    {
      id: 'idea-read-input',
      description: 'Nhập tuần tự hai số nguyên a và b từ bàn phím bằng hàm input() và int()',
      keywords: ['input', 'int', 'đọc dữ liệu'],
    },
    {
      id: 'idea-calc-sum',
      description: 'Tính tổng hai số nguyên c = a + b',
      keywords: ['c = a + b', 'phép cộng', 'tính toán'],
    },
    {
      id: 'idea-print-seq',
      description: 'In kết quả tuần tự 2 dòng theo đúng định dạng đề bài yêu cầu',
      keywords: ['print', 'Tong la:', 'Hoan thanh'],
    },
  ],
  commonMistakes: [
    'Quên chuyển kiểu int() khiến phép cộng a + b trở thành ghép hai xâu ký tự',
    'In sai chính tả hoặc sai thứ tự các dòng thông báo kết quả',
    'Nhập cả 2 biến trên cùng 1 dòng thay vì đọc lần lượt 2 dòng',
  ],
  hintsByIdea: {
    'idea-read-input': [
      'Bậc 1: Để nhận một số nguyên từ người dùng, cần dùng kết hợp hai hàm nào?',
      'Bậc 2: Dùng int(input()) để đọc dòng và ép kiểu sang số nguyên.',
      'Bậc 3: a = int(input())\nb = int(input())',
      'Bậc 4: a = int(___())\nb = int(___())',
    ],
    'idea-calc-sum': [
      'Bậc 1: Dùng biến c để lưu kết quả của phép toán nào?',
      'Bậc 2: Thực hiện phép cộng c = a + b.',
      'Bậc 3: c = a + b',
      'Bậc 4: c = a + ___',
    ],
    'idea-print-seq': [
      'Bậc 1: Cần dùng bao nhiêu lệnh print để in ra hai dòng riêng biệt?',
      'Bậc 2: Dùng hai lệnh print liên tiếp: print("Tong la:", c) và print("Hoan thanh").',
      'Bậc 3: print("Tong la:", c)\nprint("Hoan thanh")',
      'Bậc 4: print("Tong la:", ___)\nprint("___")',
    ],
  },
};

const stages: Stage[] = [
  {
    title: 'Nhập dữ liệu tuần tự',
    goal: 'Đọc lần lượt 2 số a và b từ luồng dữ liệu vào',
    question: 'Tại sao dòng nhập a chạy xong thì máy tính mới dừng lại chờ nhập b?',
    codeLines: [1, 2],
    blanks: [
      { line: 1, before: 'a = ', answer: 'int(input())', after: '' },
      { line: 2, before: 'b = ', answer: 'int(input())', after: '' },
    ],
  },
  {
    title: 'Tính toán biểu thức',
    goal: 'Thực hiện phép tính c = a + b',
    question: 'Giá trị của a và b có bị thay đổi sau phép gán c = a + b không?',
    codeLines: [3, 3],
    blanks: [{ line: 3, before: 'c = ', answer: 'a + b', after: '' }],
  },
  {
    title: 'Xuất kết quả tuần tự',
    goal: 'In dòng tổng rồi in dòng thông báo kết thúc',
    question: 'Thứ tự xuất hiện của các dòng chữ trên màn hình phụ thuộc vào điều gì?',
    codeLines: [4, 5],
    blanks: [
      { line: 4, before: 'print("Tong la:", ', answer: 'c', after: ')' },
      { line: 5, before: 'print("', answer: 'Hoan thanh', after: '")' },
    ],
  },
];

export const lesson: Lesson = {
  id: 'concept-program-algorithm',
  explanation: [
    {
      type: 'text',
      text: 'Hãy hình dung máy tính như một người đầu bếp làm việc theo công thức nấu ăn: từng bước một được thực hiện tuần tự từ trên xuống dưới, không bao giờ nhảy cóc hay làm trước bước sau.',
    },
    {
      type: 'text',
      text: 'Thuật toán là một dãy hữu hạn các chỉ thị rõ ràng được sắp đặt theo một trật tự xác định để giải quyết một bài toán. Trong Python, chương trình sẽ chạy lần lượt từng dòng lệnh (tuần tự), dòng trước hoàn thành thì dòng sau mới bắt đầu.',
    },
    {
      type: 'example',
      title: 'Dòng chảy thực thi tuần tự',
      body: 'Lệnh 1 đọc số a -> Lệnh 2 đọc số b -> Lệnh 3 cộng tổng c = a + b -> Lệnh 4 in tổng -> Lệnh 5 in hoàn thành.',
    },
    {
      type: 'callout',
      tone: 'warn',
      text: 'BẪY PYTHON: Python là ngôn ngữ thông dịch (interpreter). Nếu dòng thứ 4 gặp lỗi (ví dụ chia cho 0 hoặc gọi biến chưa khai báo), các dòng 1, 2, 3 phía trước vẫn đã được thực thi và kết quả của chúng vẫn hiển thị trên màn hình trước khi chương trình sụp đổ đột ngột!',
    },
  ],
  sample: {
    statement:
      'Mô phỏng chương trình tuần tự gồm 5 lệnh: đọc a, đọc b, cộng c = a + b, in tổng và in kết thúc.',
    constraints: '-10^9 <= a, b <= 10^9',
    maxSimSize: '|a|, |b| <= 10^9',
    fields: [
      {
        key: 'a',
        label: 'Số nguyên a',
        placeholder: 'Ví dụ: 3',
        kind: 'int',
      },
      {
        key: 'b',
        label: 'Số nguyên b',
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
        name: 'Ví dụ 1 (3, 5)',
        input: { a: '3', b: '5' },
      },
      {
        name: 'Ví dụ 2 (10, -4)',
        input: { a: '10', b: '-4' },
      },
      {
        name: 'Biên số 0 (0, 0)',
        input: { a: '0', b: '0' },
      },
      {
        name: 'Biên âm (-100, -200)',
        input: { a: '-100', b: '-200' },
      },
    ],
    parse: (raw: Record<string, string>): ParseResult<ProgramInput> => {
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
      const { a, b } = val as ProgramInput;
      return `${a}\n${b}`;
    },
  },
  code: sampleCode,
  lineNotes: [
    'Đọc số nguyên a từ bàn phím (dòng 1 của stdin)',
    'Đọc số nguyên b từ bàn phím (dòng 2 của stdin)',
    'Tính tổng hai số và lưu vào biến c',
    'Xuất thông báo tổng ra màn hình (stdout)',
    'Xuất thông báo hoàn thành ra màn hình (stdout)',
  ],
  generateSteps: (input: unknown): Step[] => {
    const { a, b } = input as ProgramInput;
    const steps: Step[] = [];
    const stdinLines = [String(a), String(b)];
    let ops = 0;

    // Bước 1: a = int(input())
    ops += 1;
    steps.push({
      line: 1,
      vars: { a },
      highlights: [{ target: 'var:a', indices: [], role: 'active' }],
      explain: `Đọc dòng đầu tiên từ stdin: nhận giá trị a = ${a}.`,
      snapshot: {
        stdin: stdinLines,
        stdinPos: 0,
        stdout: [],
      } as TextSnapshot,
      ops,
    });

    // Bước 2: b = int(input())
    ops += 1;
    steps.push({
      line: 2,
      vars: { a, b },
      highlights: [{ target: 'var:b', indices: [], role: 'active' }],
      explain: `Đọc dòng tiếp theo từ stdin: nhận giá trị b = ${b}.`,
      snapshot: {
        stdin: stdinLines,
        stdinPos: 1,
        stdout: [],
      } as TextSnapshot,
      ops,
    });

    // Bước 3: c = a + b (KEY STEP)
    ops += 1;
    const c = a + b;
    steps.push({
      line: 3,
      vars: { a, b, c },
      highlights: [{ target: 'var:c', indices: [], role: 'swap' }],
      explain: `Thực hiện phép tính cộng c = ${a} + (${b}) = ${c}.`,
      snapshot: {
        stdin: stdinLines,
        stdinPos: 2,
        stdout: [],
      } as TextSnapshot,
      ops,
      key: true,
    });

    // Bước 4: print("Tong la:", c)
    ops += 1;
    const outLine1 = `Tong la: ${c}`;
    steps.push({
      line: 4,
      vars: { a, b, c },
      highlights: [{ target: 'var:c', indices: [], role: 'done' }],
      explain: `In kết quả ra stdout: "${outLine1}".`,
      snapshot: {
        stdin: stdinLines,
        stdinPos: 2,
        stdout: [outLine1],
      } as TextSnapshot,
      ops,
    });

    // Bước 5: print("Hoan thanh")
    ops += 1;
    const outLine2 = 'Hoan thanh';
    const finalOut = `${outLine1}\n${outLine2}`;
    steps.push({
      line: 5,
      vars: { a, b, c },
      highlights: [],
      explain: `In kết thúc chương trình: "${outLine2}". Toàn bộ quy trình hoàn tất!`,
      snapshot: {
        stdin: stdinLines,
        stdinPos: 2,
        stdout: [outLine1, outLine2],
      } as TextSnapshot,
      ops,
      output: finalOut,
    });

    return steps;
  },
  reference: (input: unknown): string => {
    const { a, b } = input as ProgramInput;
    return `Tong la: ${a + b}\nHoan thanh`;
  },
  selfTest: (assert) => {
    // 1. Thông thường
    const s1 = lesson.generateSteps({ a: 3, b: 5 });
    const out1 = s1[s1.length - 1]?.output;
    const ref1 = lesson.reference({ a: 3, b: 5 });
    assert(out1 === 'Tong la: 8\nHoan thanh', `Thông thường (3, 5): mong đợi "Tong la: 8\\nHoan thanh", nhận được "${out1}"`);
    assert(ref1 === 'Tong la: 8\nHoan thanh', `Reference (3, 5) lệch`);

    // 2. Biên số 0
    const s2 = lesson.generateSteps({ a: 0, b: 0 });
    const out2 = s2[s2.length - 1]?.output;
    const ref2 = lesson.reference({ a: 0, b: 0 });
    assert(out2 === 'Tong la: 0\nHoan thanh', `Biên (0, 0) lệch`);
    assert(ref2 === 'Tong la: 0\nHoan thanh', `Reference (0, 0) lệch`);

    // 3. Số âm
    const s3 = lesson.generateSteps({ a: -100, b: -200 });
    const out3 = s3[s3.length - 1]?.output;
    const ref3 = lesson.reference({ a: -100, b: -200 });
    assert(out3 === 'Tong la: -300\nHoan thanh', `Số âm (-100, -200) lệch`);
    assert(ref3 === 'Tong la: -300\nHoan thanh', `Reference số âm lệch`);
  },
  rubric,
  task,
  stages,
};

export default lesson;
