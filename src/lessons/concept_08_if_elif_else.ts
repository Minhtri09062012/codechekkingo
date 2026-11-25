import { Lesson, Step, ParseResult, Task, Rubric, Stage } from '../core/types.ts';

interface IfElseInput {
  n: number;
}

const sampleCode = [
  'n = int(input())',
  'if n > 0:',
  '    ans = "Duong"',
  'elif n < 0:',
  '    ans = "Am"',
  'else:',
  '    ans = "Khong"',
  'print(ans)',
];

const task: Task = {
  kind: 'code',
  statement:
    'Cho một số nguyên n. Sử dụng cấu trúc rẽ nhánh if / elif / else để phân loại số n thành một trong ba trường hợp: in ra "Duong" nếu n > 0, "Am" nếu n < 0, và "Khong" nếu n == 0.',
  inputFormat: 'Gồm một dòng duy nhất chứa số nguyên n (-10^9 <= n <= 10^9).',
  outputFormat: 'In ra một xâu ký tự duy nhất: "Duong", "Am" hoặc "Khong".',
  constraints: '-10^9 <= n <= 10^9; Thời gian chạy: 1.0s',
  glossary: [
    { term: 'if', meaning: 'Kiểm tra điều kiện đầu tiên; nếu đúng thì thực thi khối lệnh bên trong và bỏ qua toàn bộ phần còn lại' },
    { term: 'elif (else if)', meaning: 'Điều kiện phụ; chỉ được kiểm tra khi tất cả các điều kiện if và elif phía trước đều sai' },
    { term: 'else', meaning: 'Nhánh mặc định; thực thi khi tất cả các điều kiện phía trên đều sai' },
    { term: 'Thụt lề (Indentation)', meaning: 'Khoảng trắng đầu dòng trong Python (thường là 4 spaces) dùng để xác định khối lệnh' },
  ],
  examples: [
    { input: '15', output: 'Duong', note: '15 > 0 -> "Duong"' },
    { input: '-8', output: 'Am', note: '-8 < 0 -> "Am"' },
    { input: '0', output: 'Khong', note: '0 == 0 -> "Khong"' },
  ],
  ioMode: { kind: 'stdio' },
  referenceSolution:
    'n = int(input())\nif n > 0:\n    print("Duong")\nelif n < 0:\n    print("Am")\nelse:\n    print("Khong")',
  tests: [
    { input: '15', output: 'Duong', label: 'Ví dụ 1', isPublic: true },
    { input: '-8', output: 'Am', label: 'Ví dụ 2', isPublic: true },
    { input: '0', output: 'Khong', label: 'Ví dụ 3', isPublic: true },
    { input: '1', output: 'Duong', label: 'Biên dương nhỏ nhất', isPublic: false },
    { input: '-1', output: 'Am', label: 'Biên âm lớn nhất', isPublic: false },
    { input: '1000000000', output: 'Duong', label: 'Biên cực đại', isPublic: false },
    { input: '-1000000000', output: 'Am', label: 'Biên cực tiểu', isPublic: false },
    { input: '42', output: 'Duong', label: 'Ngẫu nhiên 1', isPublic: false },
    { input: '-999', output: 'Am', label: 'Ngẫu nhiên 2', isPublic: false },
  ],
  analysis: {
    maxN: '|n| <= 10^9',
    expectedComplexities: ['O(1) thời gian', 'O(1) bộ nhớ'],
    note: 'Cấu trúc điều khiển rẽ nhánh cơ bản nhất để máy tính đưa ra quyết định.',
  },
  starterCode: '# Nhập số nguyên n và phân loại\nn = int(input())\n# Dùng if - elif - else để in Duong, Am hoặc Khong\n',
  timeLimitSec: 3,
};

const rubric: Rubric = {
  keyIdeas: [
    {
      id: 'idea-if-positive',
      description: 'Kiểm tra nhánh if n > 0 để xác định số dương',
      keywords: ['if n > 0', 'Duong', 'nhánh 1'],
    },
    {
      id: 'idea-elif-negative',
      description: 'Sử dụng elif n < 0 để bắt trường hợp số âm loại trừ',
      keywords: ['elif n < 0', 'Am', 'nhánh 2'],
    },
    {
      id: 'idea-else-zero',
      description: 'Sử dụng nhánh else mặc định cho trường hợp n == 0',
      keywords: ['else', 'Khong', 'mặc định'],
    },
  ],
  commonMistakes: [
    'Dùng 3 lệnh if riêng biệt thay vì if-elif-else (làm máy tính phải kiểm tra thừa)',
    'Quên dấu hai chấm ":" ở cuối câu lệnh if/elif/else',
    'Thụt lề sai (lỗi IndentationError) khi viết code bên trong khối lệnh',
  ],
  hintsByIdea: {
    'idea-if-positive': [
      'Bậc 1: Điều kiện để một số là số dương là gì?',
      'Bậc 2: Viết if n > 0: ans = "Duong".',
      'Bậc 3: if n > 0:\n    ans = "Duong"',
      'Bậc 4: if n > ___:\n    ans = "Duong"',
    ],
    'idea-elif-negative': [
      'Bậc 1: Khi n không dương, dùng từ khóa nào để kiểm tra tiếp n có âm hay không?',
      'Bậc 2: Dùng elif n < 0: ans = "Am".',
      'Bậc 3: elif n < 0:\n    ans = "Am"',
      'Bậc 4: elif n < ___:\n    ans = "Am"',
    ],
    'idea-else-zero': [
      'Bậc 1: Khi số n không dương cũng không âm thì chắc chắn n là số mấy?',
      'Bậc 2: Dùng else: ans = "Khong".',
      'Bậc 3: else:\n    ans = "Khong"',
      'Bậc 4: else:\n    ans = "___"',
    ],
  },
};

const stages: Stage[] = [
  {
    title: 'Đọc dữ liệu',
    goal: 'Đọc số nguyên n',
    question: 'Điều kiện kiểm tra n > 0 có bao quát được số 0 không?',
    codeLines: [1, 1],
    blanks: [{ line: 1, before: 'n = ', answer: 'int(input())', after: '' }],
  },
  {
    title: 'Rẽ nhánh điều kiện',
    goal: 'Phân loại n vào một trong ba nhánh if / elif / else',
    question: 'Tại sao khi một nhánh đã thỏa mãn thì máy tính bỏ qua các nhánh còn lại?',
    codeLines: [2, 7],
    blanks: [
      { line: 2, before: 'if ', answer: 'n > 0', after: ':' },
      { line: 3, before: '    ans = "', answer: 'Duong', after: '"' },
      { line: 4, before: 'elif ', answer: 'n < 0', after: ':' },
      { line: 5, before: '    ans = "', answer: 'Am', after: '"' },
      { line: 6, before: '', answer: 'else', after: ':' },
      { line: 7, before: '    ans = "', answer: 'Khong', after: '"' },
    ],
  },
  {
    title: 'Xuất kết quả',
    goal: 'In kết quả phân loại',
    question: 'Lệnh print() in giá trị của biến ans',
    codeLines: [8, 8],
    blanks: [{ line: 8, before: 'print(', answer: 'ans', after: ')' }],
  },
];

export const lesson: Lesson = {
  id: 'concept-if-elif-else',
  explanation: [
    {
      type: 'text',
      text: 'Hãy hình dung ngã ba đường ray xe lửa: khi đoàn tàu đến nút giao, hệ thống bẻ ghi sẽ chọn đúng MỘT hướng ray an toàn để tàu đi qua. Khi tàu đã rẽ vào một nhánh, tất cả các nhánh ray khác sẽ tự động đóng lại.',
    },
    {
      type: 'text',
      text: 'Cấu trúc if / elif / else trong Python hoạt động như sau:\n1. if: Kiểm tra điều kiện đầu tiên. Nếu Đúng -> chạy thân lệnh rồi nhảy thẳng xuống sau khối if.\n2. elif: Chỉ kiểm tra khi tất cả nhánh phía trước đều Sai.\n3. else: Nhánh "vét" cuối cùng, chạy khi tất cả điều kiện trên đều Sai.',
    },
    {
      type: 'example',
      title: 'Dòng chảy rẽ nhánh loại trừ',
      body: 'Với n = 15: Kiểm tra n > 0 (Đúng) -> gán ans = "Duong" -> BỎ QUA elif và else -> nhảy thẳng đến print(ans).',
    },
    {
      type: 'callout',
      tone: 'warn',
      text: 'BẪY PYTHON PHỔ BIẾN: Viết nhiều lệnh "if" độc lập thay vì "if - elif - else"!\nNếu viết:\nif n >= 0: print("Khong am")\nif n == 0: print("Bang khong")\nThì với n = 0, CẢ HAI lệnh print đều bị thực thi! Trong khi với if - elif, máy tính chỉ chọn duy nhất 1 nhánh đầu tiên thỏa mãn.',
    },
  ],
  sample: {
    statement:
      'Nhập số nguyên n. Quan sát luồng thực thi rẽ nhánh: máy tính kiểm tra if n > 0, nếu sai xét tiếp elif n < 0, và rơi vào else nếu n == 0.',
    constraints: '-10^9 <= n <= 10^9',
    maxSimSize: 'Phân loại số nguyên',
    fields: [
      {
        key: 'n',
        label: 'Số nguyên n',
        placeholder: 'Ví dụ: 15',
        kind: 'int',
      },
    ],
    defaultInput: {
      n: '15',
    },
    presets: [
      {
        name: 'Số dương: 15 ("Duong")',
        input: { n: '15' },
      },
      {
        name: 'Số âm: -8 ("Am")',
        input: { n: '-8' },
      },
      {
        name: 'Biên số 0: 0 ("Khong")',
        input: { n: '0' },
      },
      {
        name: 'Số dương lớn: 1000000',
        input: { n: '1000000' },
      },
    ],
    parse: (raw: Record<string, string>): ParseResult<IfElseInput> => {
      const n = Number(raw.n);
      if (raw.n === undefined || raw.n === '' || isNaN(n) || !Number.isInteger(n)) {
        return { ok: false, error: 'Giá trị n phải là một số nguyên hợp lệ.' };
      }
      return { ok: true, value: { n } };
    },
    toStdin: (val: unknown): string => {
      const { n } = val as IfElseInput;
      return `${n}`;
    },
  },
  code: sampleCode,
  lineNotes: [
    'Đọc số nguyên n từ bàn phím',
    'Kiểm tra điều kiện: n > 0 ? (Nếu đúng nhảy vào dòng 3, nếu sai nhảy xuống dòng 4)',
    'Thực hiện khi n dương: gán ans = "Duong"',
    'Kiểm tra điều kiện loại trừ: n < 0 ? (Nếu đúng nhảy vào dòng 5, nếu sai nhảy xuống dòng 6)',
    'Thực hiện khi n âm: gán ans = "Am"',
    'Nhánh mặc định khi n không dương cũng không âm (tức n == 0)',
    'Thực hiện khi n == 0: gán ans = "Khong"',
    'In kết quả phân loại ans ra màn hình',
  ],
  generateSteps: (input: unknown): Step[] => {
    const { n } = input as IfElseInput;
    const steps: Step[] = [];
    let ops = 0;

    // Bước 1: n = int(input())
    ops += 1;
    steps.push({
      line: 1,
      vars: { n },
      highlights: [{ target: 'var:n', indices: [], role: 'active' }],
      explain: `Đọc giá trị n = ${n}.`,
      snapshot: {},
      ops,
    });

    if (n > 0) {
      // Dòng 2: if n > 0 (True)
      ops += 1;
      steps.push({
        line: 2,
        vars: { n, 'n > 0': true },
        highlights: [{ target: 'var:n', indices: [], role: 'compare' }],
        explain: `Kiểm tra điều kiện: ${n} > 0 là ĐÚNG (True) -> Đi vào nhánh if!`,
        snapshot: {},
        ops,
        key: true,
      });

      // Dòng 3: ans = "Duong"
      ops += 1;
      steps.push({
        line: 3,
        vars: { n, ans: 'Duong' },
        highlights: [{ target: 'var:ans', indices: [], role: 'swap' }],
        explain: `Gán ans = "Duong". Bỏ qua toàn bộ các nhánh elif và else phía dưới.`,
        snapshot: {},
        ops,
        key: true,
      });
    } else if (n < 0) {
      // Dòng 2: if n > 0 (False)
      ops += 1;
      steps.push({
        line: 2,
        vars: { n, 'n > 0': false },
        highlights: [{ target: 'var:n', indices: [], role: 'compare' }],
        explain: `Kiểm tra điều kiện: ${n} > 0 là SAI (False) -> Bỏ qua dòng 3, chuyển xuống dòng 4 (elif)!`,
        snapshot: {},
        ops,
      });

      // Dòng 4: elif n < 0 (True)
      ops += 1;
      steps.push({
        line: 4,
        vars: { n, 'n < 0': true },
        highlights: [{ target: 'var:n', indices: [], role: 'compare' }],
        explain: `Kiểm tra nhánh elif: ${n} < 0 là ĐÚNG (True) -> Đi vào nhánh elif!`,
        snapshot: {},
        ops,
        key: true,
      });

      // Dòng 5: ans = "Am"
      ops += 1;
      steps.push({
        line: 5,
        vars: { n, ans: 'Am' },
        highlights: [{ target: 'var:ans', indices: [], role: 'swap' }],
        explain: `Gán ans = "Am". Bỏ qua nhánh else.`,
        snapshot: {},
        ops,
        key: true,
      });
    } else {
      // n == 0
      // Dòng 2: if n > 0 (False)
      ops += 1;
      steps.push({
        line: 2,
        vars: { n, 'n > 0': false },
        highlights: [{ target: 'var:n', indices: [], role: 'compare' }],
        explain: `Kiểm tra điều kiện: 0 > 0 là SAI (False) -> Chuyển xuống elif.`,
        snapshot: {},
        ops,
      });

      // Dòng 4: elif n < 0 (False)
      ops += 1;
      steps.push({
        line: 4,
        vars: { n, 'n < 0': false },
        highlights: [{ target: 'var:n', indices: [], role: 'compare' }],
        explain: `Kiểm tra nhánh elif: 0 < 0 là SAI (False) -> Chuyển tiếp xuống else.`,
        snapshot: {},
        ops,
      });

      // Dòng 6: else
      ops += 1;
      steps.push({
        line: 6,
        vars: { n },
        highlights: [],
        explain: `Cả if và elif đều sai -> Tự động rơi vào nhánh mặc định else!`,
        snapshot: {},
        ops,
      });

      // Dòng 7: ans = "Khong"
      ops += 1;
      steps.push({
        line: 7,
        vars: { n, ans: 'Khong' },
        highlights: [{ target: 'var:ans', indices: [], role: 'swap' }],
        explain: `Gán ans = "Khong".`,
        snapshot: {},
        ops,
        key: true,
      });
    }

    // Dòng 8: print(ans)
    const finalAns = n > 0 ? 'Duong' : n < 0 ? 'Am' : 'Khong';
    ops += 1;
    steps.push({
      line: 8,
      vars: { n, ans: finalAns },
      highlights: [{ target: 'var:ans', indices: [], role: 'done' }],
      explain: `In kết quả phân loại: "${finalAns}".`,
      snapshot: {},
      ops,
      output: finalAns,
    });

    return steps;
  },
  reference: (input: unknown): string => {
    const { n } = input as IfElseInput;
    if (n > 0) return 'Duong';
    if (n < 0) return 'Am';
    return 'Khong';
  },
  selfTest: (assert) => {
    // 1. Dương
    const s1 = lesson.generateSteps({ n: 15 });
    assert(s1[s1.length - 1]?.output === 'Duong', 'Test 15 phải ra Duong');

    // 2. Âm
    const s2 = lesson.generateSteps({ n: -8 });
    assert(s2[s2.length - 1]?.output === 'Am', 'Test -8 phải ra Am');

    // 3. Số 0
    const s3 = lesson.generateSteps({ n: 0 });
    assert(s3[s3.length - 1]?.output === 'Khong', 'Test 0 phải ra Khong');
  },
  rubric,
  task,
  stages,
};

export default lesson;
