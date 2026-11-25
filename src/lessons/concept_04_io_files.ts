import { Lesson, Step, ParseResult, Task, Rubric, Stage, TextSnapshot } from '../core/types.ts';

interface IOFilesInput {
  a: number;
  b: number;
  mode: 'stdio' | 'file';
}

const sampleCode = [
  '# Che do doc/ghi du lieu',
  'a = int(input())',
  'b = int(input())',
  'tich = a * b',
  'print(tich)',
];

const task: Task = {
  kind: 'code',
  statement:
    'Đọc vào hai số nguyên a và b (mỗi số trên một dòng). Tính tích của chúng và in ra màn hình hoặc tệp đầu ra.',
  inputFormat: 'Gồm 2 dòng: dòng 1 chứa số nguyên a, dòng 2 chứa số nguyên b (-10^6 <= a, b <= 10^6).',
  outputFormat: 'In ra một số nguyên duy nhất là tích a * b.',
  constraints: '-10^6 <= a, b <= 10^6; Thời gian chạy: 1.0s',
  glossary: [
    { term: 'stdin / stdout', meaning: 'Luồng nhập chuẩn (bàn phím) và luồng xuất chuẩn (màn hình console)' },
    { term: 'INP / OUT', meaning: 'Tệp tin dữ liệu vào (.INP) và tệp tin ghi kết quả (.OUT) trong các kỳ thi HSG Tin học' },
    { term: 'sys.stdin', meaning: 'Đối tượng trong thư viện sys của Python cho phép chuyển hướng luồng đọc từ file' },
  ],
  examples: [
    { input: '4\n7', output: '28', note: '4 * 7 = 28' },
    { input: '-3\n9', output: '-27', note: '-3 * 9 = -27' },
  ],
  ioMode: { kind: 'stdio' },
  referenceSolution: 'a = int(input())\nb = int(input())\nprint(a * b)',
  tests: [
    { input: '4\n7', output: '28', label: 'Ví dụ 1', isPublic: true },
    { input: '-3\n9', output: '-27', label: 'Ví dụ 2', isPublic: true },
    { input: '0\n100', output: '0', label: 'Biên số 0', isPublic: false },
    { input: '-5\n-8', output: '40', label: 'Biên hai số âm', isPublic: false },
    { input: '1000\n1000', output: '1000000', label: 'Biên số lớn', isPublic: false },
    { input: '12\n12', output: '144', label: 'Ngẫu nhiên 1', isPublic: false },
    { input: '25\n4', output: '100', label: 'Ngẫu nhiên 2', isPublic: false },
    { input: '-10\n50', output: '-500', label: 'Ngẫu nhiên 3', isPublic: false },
    { input: '99\n1', output: '99', label: 'Ngẫu nhiên 4', isPublic: false },
  ],
  analysis: {
    maxN: '|a|, |b| <= 10^6',
    expectedComplexities: ['O(1) thời gian', 'O(1) bộ nhớ'],
    note: 'Thao tác nhập xuất cơ bản qua bàn phím hoặc tệp tin INP/OUT.',
  },
  starterCode: '# Đọc a và b, tính tích a * b\na = int(input())\nb = int(input())\nprint(a * b)\n',
  timeLimitSec: 3,
};

const rubric: Rubric = {
  keyIdeas: [
    {
      id: 'idea-read-two-ints',
      description: 'Đọc tuần tự hai số nguyên a và b từ luồng dữ liệu vào',
      keywords: ['input', 'int', 'đọc dữ liệu'],
    },
    {
      id: 'idea-calc-product',
      description: 'Thực hiện phép nhân tich = a * b',
      keywords: ['a * b', 'tích', 'nhân'],
    },
    {
      id: 'idea-output-result',
      description: 'Xuất tích ra đúng luồng màn hình hoặc tệp tin theo yêu cầu',
      keywords: ['print', 'xuất', 'output'],
    },
  ],
  commonMistakes: [
    'Quên gán hoặc đóng tệp tin khi chuyển hướng sys.stdin / sys.stdout sang file INP/OUT',
    'Nhập input() mà không ép kiểu int(), dẫn đến lỗi phép nhân xâu',
    'In thừa các câu dẫn thừa (ví dụ: "Ket qua la: ") khi đề bài chỉ yêu cầu in số',
  ],
  hintsByIdea: {
    'idea-read-two-ints': [
      'Bậc 1: Dùng lệnh nào để đọc một dòng số nguyên từ luồng vào?',
      'Bậc 2: Đọc lần lượt từng dòng: a = int(input()) rồi b = int(input()).',
      'Bậc 3: a = int(input())\nb = int(input())',
      'Bậc 4: a = int(___())\nb = int(___())',
    ],
    'idea-calc-product': [
      'Bậc 1: Ký hiệu phép nhân trong Python là gì?',
      'Bậc 2: Dùng toán tử sao (*) để nhân hai số: tich = a * b.',
      'Bậc 3: tich = a * b',
      'Bậc 4: tich = a ___ b',
    ],
    'idea-output-result': [
      'Bậc 1: Dùng hàm print để in kết quả.',
      'Bậc 2: print(tich) hoặc print(a * b).',
      'Bậc 3: print(tich)',
      'Bậc 4: print(___)',
    ],
  },
};

const stages: Stage[] = [
  {
    title: 'Khởi tạo luồng vào',
    goal: 'Đọc hai số nguyên a và b từ bàn phím hoặc tệp ảo',
    question: 'Khi chuyển sang chế độ tệp, dữ liệu được nạp từ tệp nào?',
    codeLines: [1, 3],
    blanks: [
      { line: 2, before: 'a = ', answer: 'int(input())', after: '' },
      { line: 3, before: 'b = ', answer: 'int(input())', after: '' },
    ],
  },
  {
    title: 'Tính tích và Xuất kết quả',
    goal: 'Tính tich = a * b và ghi ra màn hình / tệp OUT',
    question: 'Hàm print() sẽ xuất dữ liệu tới đâu nếu chương trình được chuyển hướng tệp tin?',
    codeLines: [4, 5],
    blanks: [
      { line: 4, before: 'tich = ', answer: 'a * b', after: '' },
      { line: 5, before: 'print(', answer: 'tich', after: ')' },
    ],
  },
];

export const lesson: Lesson = {
  id: 'concept-io-files',
  explanation: [
    {
      type: 'text',
      text: 'Hãy hình dung luồng nhập xuất (I/O) như một đường ống dẫn nước: đầu vào có thể nối với vòi nước (bàn phím người dùng gõ trực tiếp) hoặc bể chứa nước dự trữ (tệp tin .INP). Đầu ra có thể chảy vào cốc uống nước (màn hình) hoặc bồn chứa lưu trữ (tệp tin .OUT).',
    },
    {
      type: 'text',
      text: 'Trong các kỳ thi HSG Tin học, ban giám khảo thường dùng tệp tin (ví dụ BAI1.INP và BAI1.OUT) để chấm điểm tự động. Trong Python, ta có thể dùng "sys.stdin = open(\'BAI1.INP\', \'r\')" và "sys.stdout = open(\'BAI1.OUT\', \'w\')" để chuyển hướng toàn bộ lệnh input() và print() thông thường sang đọc/ghi tệp mà không cần sửa code tính toán!',
    },
    {
      type: 'example',
      title: 'Chuyển hướng tệp tin trong HSG Tin học',
      body: 'import sys\nsys.stdin = open("BAI1.INP", "r")\nsys.stdout = open("BAI1.OUT", "w")\n# Từ đây input() sẽ đọc file INP, print() sẽ ghi ra file OUT!',
    },
    {
      type: 'callout',
      tone: 'warn',
      text: 'BẪY PYTHON: Khi ghi ra tệp tin bằng print() hoặc file.write(), Python gom dữ liệu vào bộ nhớ đệm (buffer) trước khi xả xuống ổ đĩa. Nếu chương trình bị ngắt đột ngột (hoặc quên sys.stdout.flush() / quên file.close()), tệp .OUT trên đĩa có thể bị rỗng (0 byte), khiến học sinh bị 0 điểm oan uổng!',
    },
  ],
  sample: {
    statement:
      'Mô phỏng nhập xuất dữ liệu tính tích a * b với 2 chế độ: "Bàn phím & Màn hình" (stdin/stdout) hoặc "Tệp tin" (BAI1.INP / BAI1.OUT).',
    constraints: '-10^6 <= a, b <= 10^6',
    maxSimSize: 'Nhập xuất 2 số nguyên',
    fields: [
      {
        key: 'a',
        label: 'Số nguyên a',
        placeholder: 'Ví dụ: 4',
        kind: 'int',
      },
      {
        key: 'b',
        label: 'Số nguyên b',
        placeholder: 'Ví dụ: 7',
        kind: 'int',
      },
      {
        key: 'mode',
        label: 'Chế độ Nhập/Xuất',
        placeholder: 'Chọn chế độ',
        kind: 'choice',
        options: ['stdio', 'file'],
        help: 'Chọn stdio (Bàn phím/Màn hình) hoặc file (Tệp ảo BAI1.INP / BAI1.OUT)',
      },
    ],
    defaultInput: {
      a: '4',
      b: '7',
      mode: 'stdio',
    },
    presets: [
      {
        name: 'Bàn phím: 4 và 7',
        input: { a: '4', b: '7', mode: 'stdio' },
      },
      {
        name: 'Tệp tin BAI1.INP: 4 và 7',
        input: { a: '4', b: '7', mode: 'file' },
      },
      {
        name: 'Tệp tin số âm: -3 và 9',
        input: { a: '-3', b: '9', mode: 'file' },
      },
      {
        name: 'Biên số 0: 0 và 100',
        input: { a: '0', b: '100', mode: 'stdio' },
      },
    ],
    parse: (raw: Record<string, string>): ParseResult<IOFilesInput> => {
      const a = Number(raw.a);
      const b = Number(raw.b);
      if (raw.a === undefined || raw.a === '' || isNaN(a) || !Number.isInteger(a)) {
        return { ok: false, error: 'Giá trị a phải là một số nguyên hợp lệ.' };
      }
      if (raw.b === undefined || raw.b === '' || isNaN(b) || !Number.isInteger(b)) {
        return { ok: false, error: 'Giá trị b phải là một số nguyên hợp lệ.' };
      }
      const mode = raw.mode === 'file' ? 'file' : 'stdio';
      return { ok: true, value: { a, b, mode } };
    },
    toStdin: (val: unknown): string => {
      const { a, b } = val as IOFilesInput;
      return `${a}\n${b}`;
    },
  },
  code: sampleCode,
  lineNotes: [
    'Xác định chế độ nhập xuất: Bàn phím luồng chuẩn hoặc Tệp tin ảo',
    'Đọc số nguyên a từ stdin hoặc từ dòng đầu tiên của tệp BAI1.INP',
    'Đọc số nguyên b từ stdin hoặc từ dòng thứ hai của tệp BAI1.INP',
    'Tính tích hai số tich = a * b',
    'In tích ra màn hình stdout hoặc ghi vào tệp BAI1.OUT',
  ],
  generateSteps: (input: unknown): Step[] => {
    const { a, b, mode } = input as IOFilesInput;
    const steps: Step[] = [];
    const isFile = mode === 'file';
    const inpContent = `${a}\n${b}`;
    const tich = a * b;
    let ops = 0;

    const makeSnapshot = (
      stdinPos: number,
      stdout: string[],
      includeOutFile: boolean
    ): TextSnapshot => {
      if (isFile) {
        const files = [{ name: 'BAI1.INP', content: inpContent }];
        if (includeOutFile) {
          files.push({ name: 'BAI1.OUT', content: String(tich) });
        }
        return {
          stdin: [String(a), String(b)],
          stdinPos,
          stdout: includeOutFile ? [String(tich)] : [],
          files,
        };
      }
      return {
        stdin: [String(a), String(b)],
        stdinPos,
        stdout,
      };
    };

    // Bước 1: # Chế độ
    ops += 1;
    steps.push({
      line: 1,
      vars: { mode: isFile ? 'Tệp tin (BAI1.INP/OUT)' : 'Bàn phím & Màn hình' },
      highlights: [],
      explain: isFile
        ? 'Chế độ TỆP TIN: Dữ liệu đầu vào nằm trong tệp ảo BAI1.INP.'
        : 'Chế độ BÀN PHÍM: Nhập dữ liệu qua luồng chuẩn stdin.',
      snapshot: makeSnapshot(0, [], false),
      ops,
    });

    // Bước 2: a = int(input())
    ops += 1;
    steps.push({
      line: 2,
      vars: { a },
      highlights: [{ target: 'var:a', indices: [], role: 'active' }],
      explain: isFile
        ? `Đọc dòng 1 từ tệp BAI1.INP: nhận a = ${a}.`
        : `Đọc dòng 1 từ bàn phím: nhận a = ${a}.`,
      snapshot: makeSnapshot(0, [], false),
      ops,
    });

    // Bước 3: b = int(input())
    ops += 1;
    steps.push({
      line: 3,
      vars: { a, b },
      highlights: [{ target: 'var:b', indices: [], role: 'active' }],
      explain: isFile
        ? `Đọc dòng 2 từ tệp BAI1.INP: nhận b = ${b}.`
        : `Đọc dòng 2 từ bàn phím: nhận b = ${b}.`,
      snapshot: makeSnapshot(1, [], false),
      ops,
    });

    // Bước 4: tich = a * b (KEY STEP)
    ops += 1;
    steps.push({
      line: 4,
      vars: { a, b, tich },
      highlights: [{ target: 'var:tich', indices: [], role: 'swap' }],
      explain: `Thực hiện phép tính tích: tich = ${a} * ${b} = ${tich}.`,
      snapshot: makeSnapshot(2, [], false),
      ops,
      key: true,
    });

    // Bước 5: print(tich)
    ops += 1;
    steps.push({
      line: 5,
      vars: { a, b, tich },
      highlights: [{ target: 'var:tich', indices: [], role: 'done' }],
      explain: isFile
        ? `Ghi kết quả ${tich} vào tệp ảo BAI1.OUT hoàn tất!`
        : `In kết quả ${tich} ra màn hình xuất stdout.`,
      snapshot: makeSnapshot(2, [String(tich)], true),
      ops,
      output: String(tich),
    });

    return steps;
  },
  reference: (input: unknown): string => {
    const { a, b } = input as IOFilesInput;
    return String(a * b);
  },
  selfTest: (assert) => {
    // 1. Bình thường stdio
    const s1 = lesson.generateSteps({ a: 4, b: 7, mode: 'stdio' });
    const out1 = s1[s1.length - 1]?.output;
    assert(out1 === '28', `Test 1 ra: "${out1}"`);
    assert(lesson.reference({ a: 4, b: 7, mode: 'stdio' }) === '28', 'Ref 1 sai');

    // 2. Chế độ file
    const s2 = lesson.generateSteps({ a: -3, b: 9, mode: 'file' });
    const out2 = s2[s2.length - 1]?.output;
    assert(out2 === '-27', `Test 2 ra: "${out2}"`);
    assert(lesson.reference({ a: -3, b: 9, mode: 'file' }) === '-27', 'Ref 2 sai');

    // 3. Biên 0
    const s3 = lesson.generateSteps({ a: 0, b: 100, mode: 'stdio' });
    const out3 = s3[s3.length - 1]?.output;
    assert(out3 === '0', `Test 3 ra: "${out3}"`);
  },
  rubric,
  task,
  stages,
};

export default lesson;
