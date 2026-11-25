import { Lesson, Step, ParseResult, Task, Rubric, Stage } from '../core/types.ts';

interface NestedInput {
  score: number;
}

const sampleCode = [
  'score = int(input())',
  'if score >= 50:',
  '    if score >= 80:',
  '        rank = "Gioi"',
  '    else:',
  '        rank = "Dat"',
  'else:',
  '    rank = "Chua dat"',
  'print(rank)',
];

const task: Task = {
  kind: 'code',
  statement:
    'Cho điểm thi là số nguyên score (0 <= score <= 100). Sử dụng cấu trúc điều kiện lồng nhau để xếp loại: Nếu score >= 50, kiểm tra tiếp nếu score >= 80 thì xếp loại "Gioi", ngược lại xếp loại "Dat". Nếu score < 50, xếp loại "Chua dat". In kết quả ra màn hình.',
  inputFormat: 'Gồm một dòng chứa số nguyên score (0 <= score <= 100).',
  outputFormat: 'In ra một xâu ký tự: "Gioi", "Dat" hoặc "Chua dat".',
  constraints: '0 <= score <= 100; Thời gian chạy: 1.0s',
  glossary: [
    { term: 'Điều kiện lồng nhau (Nested conditions)', meaning: 'Đặt một khối lệnh if/else bên trong thân của một lệnh if hoặc else khác' },
    { term: 'Dangling else (Else treo)', meaning: 'Hiện tượng nhầm lẫn nhánh else thuộc về if ngoài hay if trong, trong Python được phân định bằng độ thụt lề' },
  ],
  examples: [
    { input: '85', output: 'Gioi', note: '85 >= 50 và 85 >= 80 -> "Gioi"' },
    { input: '65', output: 'Dat', note: '65 >= 50 nhưng 65 < 80 -> "Dat"' },
    { input: '40', output: 'Chua dat', note: '40 < 50 -> "Chua dat"' },
  ],
  ioMode: { kind: 'stdio' },
  referenceSolution:
    'score = int(input())\nif score >= 50:\n    if score >= 80:\n        print("Gioi")\n    else:\n        print("Dat")\nelse:\n    print("Chua dat")',
  tests: [
    { input: '85', output: 'Gioi', label: 'Ví dụ 1', isPublic: true },
    { input: '65', output: 'Dat', label: 'Ví dụ 2', isPublic: true },
    { input: '40', output: 'Chua dat', label: 'Ví dụ 3', isPublic: true },
    { input: '100', output: 'Gioi', label: 'Biên điểm tối đa 100', isPublic: false },
    { input: '80', output: 'Gioi', label: 'Biên điểm giỏi 80', isPublic: false },
    { input: '79', output: 'Dat', label: 'Biên điểm cận giỏi 79', isPublic: false },
    { input: '50', output: 'Dat', label: 'Biên điểm đỗ 50', isPublic: false },
    { input: '49', output: 'Chua dat', label: 'Biên điểm cận đỗ 49', isPublic: false },
    { input: '0', output: 'Chua dat', label: 'Biên điểm 0', isPublic: false },
  ],
  analysis: {
    maxN: 'score <= 100',
    expectedComplexities: ['O(1) thời gian', 'O(1) bộ nhớ'],
    note: 'Cấu trúc lồng nhau giúp phân cấp tiêu chí quyết định theo từng tầng điều kiện.',
  },
  starterCode: '# Nhập điểm thi score và xếp loại lồng nhau\nscore = int(input())\n# Viết cấu trúc if lồng nhau tại đây\n',
  timeLimitSec: 3,
};

const rubric: Rubric = {
  keyIdeas: [
    {
      id: 'idea-outer-condition',
      description: 'Kiểm tra điều kiện vòng ngoài score >= 50 để phân loại Đạt / Chưa đạt',
      keywords: ['if score >= 50', 'vòng ngoài', 'outer'],
    },
    {
      id: 'idea-inner-condition',
      description: 'Lồng thêm điều kiện vòng trong score >= 80 để nâng hạng "Gioi" hoặc "Dat"',
      keywords: ['if score >= 80', 'lồng nhau', 'inner'],
    },
    {
      id: 'idea-else-branches',
      description: 'Bố trí các nhánh else khớp đúng mức thụt lề tương ứng',
      keywords: ['else', 'thụt lề', 'Chua dat'],
    },
  ],
  commonMistakes: [
    'Thụt lề sai nhánh else: đặt else của "Chua dat" thẳng hàng với if bên trong',
    'Nhầm lẫn dấu so sánh >= thành > tại các điểm biên (50 và 80)',
    'Viết gộp điều kiện không tối ưu khiến code khó bảo trì',
  ],
  hintsByIdea: {
    'idea-outer-condition': [
      'Bậc 1: Điều kiện đầu tiên để học sinh vượt qua ngưỡng là gì?',
      'Bậc 2: Viết if score >= 50: để mở khối lệnh.',
      'Bậc 3: if score >= 50:\n    # khối lồng bên trong\nelse:\n    rank = "Chua dat"',
      'Bậc 4: if score >= 50:\n    ...\nelse:\n    rank = "___"',
    ],
    'idea-inner-condition': [
      'Bậc 1: Khi đã biết score >= 50, kiểm tra tiếp điều kiện gì để xếp loại Giỏi?',
      'Bậc 2: Thụt lề thêm 4 khoảng trắng và viết if score >= 80: rank = "Gioi".',
      'Bậc 3:     if score >= 80:\n        rank = "Gioi"\n    else:\n        rank = "Dat"',
      'Bậc 4:     if score >= 80:\n        rank = "Gioi"\n    else:\n        rank = "___"',
    ],
    'idea-else-branches': [
      'Bậc 1: Lệnh print(rank) đặt ở đâu để in được kết quả cuối cùng?',
      'Bậc 2: Đặt print(rank) ở ngoài cùng, không thụt lề.',
      'Bậc 3: print(rank)',
      'Bậc 4: print(___)',
    ],
  },
};

const stages: Stage[] = [
  {
    title: 'Đọc điểm thi',
    goal: 'Đọc điểm số nguyên score',
    question: 'Điểm số hợp lệ nằm trong khoảng nào?',
    codeLines: [1, 1],
    blanks: [{ line: 1, before: 'score = ', answer: 'int(input())', after: '' }],
  },
  {
    title: 'Điều kiện vòng ngoài & vòng trong',
    goal: 'Xây dựng cấu trúc if lồng nhau',
    question: 'Nhánh else ở dòng 7 thuộc về if ở dòng nào?',
    codeLines: [2, 8],
    blanks: [
      { line: 2, before: 'if ', answer: 'score >= 50', after: ':' },
      { line: 3, before: '    if ', answer: 'score >= 80', after: ':' },
      { line: 4, before: '        rank = "', answer: 'Gioi', after: '"' },
      { line: 5, before: '    ', answer: 'else', after: ':' },
      { line: 6, before: '        rank = "', answer: 'Dat', after: '"' },
      { line: 7, before: '', answer: 'else', after: ':' },
      { line: 8, before: '    rank = "', answer: 'Chua dat', after: '"' },
    ],
  },
  {
    title: 'Xuất xếp loại',
    goal: 'In kết quả xếp loại',
    question: 'Lệnh in kết quả cuối cùng',
    codeLines: [9, 9],
    blanks: [{ line: 9, before: 'print(', answer: 'rank', after: ')' }],
  },
];

export const lesson: Lesson = {
  id: 'concept-nested-conditions',
  explanation: [
    {
      type: 'text',
      text: 'Hãy hình dung cổng soát vé khu vui chơi: Cổng 1 (vòng ngoài) kiểm tra bạn có vé vào cổng không. Nếu không có vé -> ra về (else ngoài). Nếu có vé -> đi tiếp vào Cổng 2 (vòng trong) để kiểm tra: nếu là vé VIP -> vào khu trò chơi đặc biệt ("Gioi"), nếu là vé thường -> vào khu tiêu chuẩn ("Dat").',
    },
    {
      type: 'text',
      text: 'Điều kiện lồng nhau (Nested conditions) là việc đặt một cấu trúc if/else bên trong thân của một if/else khác. Nó giúp giải quyết các bài toán có nhiều tầng tiêu chí quyết định một cách khoa học và rõ ràng.',
    },
    {
      type: 'example',
      title: 'Độ sâu thụt lề biểu diễn tầng lồng',
      body: 'Cấp 0 (ngoài cùng): if score >= 50\n  -> Cấp 1 (thụt lề 4 space): if score >= 80\n    -> Cấp 2 (thụt lề 8 space): rank = "Gioi"',
    },
    {
      type: 'callout',
      tone: 'warn',
      text: 'BẪY PYTHON KINH ĐIỂN: LỖI "DANGLING ELSE" DO THỤT LỀ!\nTrong các ngôn ngữ như C/C++, dấu ngoặc nhọn {} quyết định khối lệnh. Nhưng trong Python, "else" thuộc về "if" nào hoàn toàn do THỤT LỀ quyết định!\nNếu bạn vô tình thụt dòng "else:" vào 4 dấu cách, nó sẽ gắn vào "if score >= 80" bên trong thay vì "if score >= 50" bên ngoài, làm đảo lộn toàn bộ logic mà trình thông dịch KHÔNG HỀ BÁO LỖI!',
    },
  ],
  sample: {
    statement:
      'Nhập điểm thi score (0-100). Quan sát luồng thực thi lồng nhau: vòng ngoài kiểm tra >= 50, nếu đạt mới đi tiếp vào vòng trong kiểm tra >= 80.',
    constraints: '0 <= score <= 100',
    maxSimSize: 'Điều kiện 2 tầng',
    fields: [
      {
        key: 'score',
        label: 'Điểm thi (score)',
        placeholder: 'Ví dụ: 85',
        kind: 'int',
      },
    ],
    defaultInput: {
      score: '85',
    },
    presets: [
      {
        name: 'Điểm giỏi: 85 ("Gioi")',
        input: { score: '85' },
      },
      {
        name: 'Điểm đạt: 65 ("Dat")',
        input: { score: '65' },
      },
      {
        name: 'Chưa đạt: 40 ("Chua dat")',
        input: { score: '40' },
      },
      {
        name: 'Biên điểm tuyệt đối: 100',
        input: { score: '100' },
      },
    ],
    parse: (raw: Record<string, string>): ParseResult<NestedInput> => {
      const score = Number(raw.score);
      if (raw.score === undefined || raw.score === '' || isNaN(score) || !Number.isInteger(score)) {
        return { ok: false, error: 'Điểm thi score phải là một số nguyên hợp lệ.' };
      }
      if (score < 0 || score > 100) {
        return { ok: false, error: 'Điểm thi phải nằm trong thang điểm từ 0 đến 100.' };
      }
      return { ok: true, value: { score } };
    },
    toStdin: (val: unknown): string => {
      const { score } = val as NestedInput;
      return `${score}`;
    },
  },
  code: sampleCode,
  lineNotes: [
    'Đọc điểm thi score từ bàn phím',
    'Kiểm tra vòng ngoài: score >= 50 ? (Ngưỡng đỗ tiêu chuẩn)',
    'Kiểm tra vòng trong: score >= 80 ? (Tiêu chí đạt loại Giỏi)',
    'Thực hiện khi score >= 80: xếp loại rank = "Gioi"',
    'Nhánh else vòng trong: khi score >= 50 nhưng score < 80',
    'Thực hiện khi điểm đạt mức trung bình khá: rank = "Dat"',
    'Nhánh else vòng ngoài: khi score < 50',
    'Thực hiện khi trượt: rank = "Chua dat"',
    'In kết quả xếp loại cuối cùng ra màn hình',
  ],
  generateSteps: (input: unknown): Step[] => {
    const { score } = input as NestedInput;
    const steps: Step[] = [];
    let ops = 0;

    // Bước 1: score = int(input())
    ops += 1;
    steps.push({
      line: 1,
      vars: { score },
      highlights: [{ target: 'var:score', indices: [], role: 'active' }],
      explain: `Đọc điểm thi score = ${score}.`,
      snapshot: {},
      ops,
    });

    if (score >= 50) {
      // Dòng 2: if score >= 50 (True)
      ops += 1;
      steps.push({
        line: 2,
        vars: { score, 'score >= 50': true },
        highlights: [{ target: 'var:score', indices: [], role: 'compare' }],
        explain: `Kiểm tra vòng ngoài: ${score} >= 50 là ĐÚNG (True) -> Qua cửa 1, đi vào điều kiện lồng bên trong!`,
        snapshot: {},
        ops,
        key: true,
      });

      if (score >= 80) {
        // Dòng 3: if score >= 80 (True)
        ops += 1;
        steps.push({
          line: 3,
          vars: { score, 'score >= 80': true },
          highlights: [{ target: 'var:score', indices: [], role: 'compare' }],
          explain: `Kiểm tra vòng trong: ${score} >= 80 là ĐÚNG (True) -> Thỏa mãn tiêu chí Giỏi!`,
          snapshot: {},
          ops,
          key: true,
        });

        // Dòng 4: rank = "Gioi"
        ops += 1;
        steps.push({
          line: 4,
          vars: { score, rank: 'Gioi' },
          highlights: [{ target: 'var:rank', indices: [], role: 'swap' }],
          explain: `Gán rank = "Gioi". Bỏ qua các nhánh else còn lại.`,
          snapshot: {},
          ops,
          key: true,
        });
      } else {
        // Dòng 3: if score >= 80 (False)
        ops += 1;
        steps.push({
          line: 3,
          vars: { score, 'score >= 80': false },
          highlights: [{ target: 'var:score', indices: [], role: 'compare' }],
          explain: `Kiểm tra vòng trong: ${score} >= 80 là SAI (False) -> Rơi vào else bên trong.`,
          snapshot: {},
          ops,
        });

        // Dòng 6: rank = "Dat"
        ops += 1;
        steps.push({
          line: 6,
          vars: { score, rank: 'Dat' },
          highlights: [{ target: 'var:rank', indices: [], role: 'swap' }],
          explain: `Gán rank = "Dat" (điểm từ 50 đến dưới 80).`,
          snapshot: {},
          ops,
          key: true,
        });
      }
    } else {
      // Dòng 2: if score >= 50 (False)
      ops += 1;
      steps.push({
        line: 2,
        vars: { score, 'score >= 50': false },
        highlights: [{ target: 'var:score', indices: [], role: 'compare' }],
        explain: `Kiểm tra vòng ngoài: ${score} >= 50 là SAI (False) -> Bỏ qua toàn bộ khối lồng bên trong, nhảy thẳng xuống else ngoài!`,
        snapshot: {},
        ops,
      });

      // Dòng 8: rank = "Chua dat"
      ops += 1;
      steps.push({
        line: 8,
        vars: { score, rank: 'Chua dat' },
        highlights: [{ target: 'var:rank', indices: [], role: 'swap' }],
        explain: `Gán rank = "Chua dat" (điểm dưới 50).`,
        snapshot: {},
        ops,
        key: true,
      });
    }

    // Dòng 9: print(rank)
    const finalRank = score >= 80 ? 'Gioi' : score >= 50 ? 'Dat' : 'Chua dat';
    ops += 1;
    steps.push({
      line: 9,
      vars: { score, rank: finalRank },
      highlights: [{ target: 'var:rank', indices: [], role: 'done' }],
      explain: `In kết quả xếp loại cuối cùng: "${finalRank}".`,
      snapshot: {},
      ops,
      output: finalRank,
    });

    return steps;
  },
  reference: (input: unknown): string => {
    const { score } = input as NestedInput;
    if (score >= 50) {
      if (score >= 80) return 'Gioi';
      return 'Dat';
    }
    return 'Chua dat';
  },
  selfTest: (assert) => {
    // 1. Giỏi
    const s1 = lesson.generateSteps({ score: 85 });
    assert(s1[s1.length - 1]?.output === 'Gioi', 'Test 85 phải ra Gioi');

    // 2. Đạt
    const s2 = lesson.generateSteps({ score: 65 });
    assert(s2[s2.length - 1]?.output === 'Dat', 'Test 65 phải ra Dat');

    // 3. Chưa đạt
    const s3 = lesson.generateSteps({ score: 40 });
    assert(s3[s3.length - 1]?.output === 'Chua dat', 'Test 40 phải ra Chua dat');
  },
  rubric,
  task,
  stages,
};

export default lesson;
