import { Lesson, Step, ParseResult, Task, Rubric, Stage } from '../core/types.ts';

interface ArithmeticInput {
  a: number;
  b: number;
}

const sampleCode = [
  'a = int(input())',
  'b = int(input())',
  'div_float = a / b',
  'div_int = a // b',
  'mod_rem = a % b',
  'power_val = a ** b',
  'print(div_float, div_int, mod_rem, power_val)',
];

const task: Task = {
  kind: 'code',
  statement:
    'Cho hai số nguyên a và b (với b != 0 và 0 <= b <= 10). Hãy tính: chia thực a / b, chia nguyên a // b, chia dư a % b và lũy thừa a ** b. In 4 giá trị trên một dòng cách nhau bởi dấu cách.',
  inputFormat: 'Gồm 2 dòng: dòng 1 chứa số nguyên a, dòng 2 chứa số nguyên b (b != 0, 0 <= b <= 10).',
  outputFormat: 'In ra 4 giá trị cách nhau bởi khoảng trắng: div_float, div_int, mod_rem, power_val.',
  constraints: '-1000 <= a <= 1000; 1 <= b <= 10; Thời gian chạy: 1.0s',
  glossary: [
    { term: 'Chia thực ( / )', meaning: 'Luôn trả về số thực float kể cả khi chia hết (ví dụ 4 / 2 = 2.0)' },
    { term: 'Chia nguyên ( // )', meaning: 'Phép chia lấy phần nguyên làm tròn xuống (floor division), ví dụ 7 // 2 = 3, -7 // 2 = -4' },
    { term: 'Chia dư ( % )', meaning: 'Phép chia lấy phần dư modulo (luôn cùng dấu với số chia b trong Python)' },
    { term: 'Lũy thừa ( ** )', meaning: 'Phép nâng lên lũy thừa a mũ b, ví dụ 2 ** 3 = 8' },
  ],
  examples: [
    { input: '7\n2', output: '3.5 3 1 49', note: '7/2=3.5, 7//2=3, 7%2=1, 7**2=49' },
    { input: '-7\n2', output: '-3.5 -4 1 49', note: '-7/2=-3.5, -7//2=-4 (làm tròn xuống -inf), -7%2=1, (-7)**2=49' },
  ],
  ioMode: { kind: 'stdio' },
  referenceSolution:
    'a = int(input())\nb = int(input())\nprint(a / b, a // b, a % b, a ** b)',
  tests: [
    { input: '7\n2', output: '3.5 3 1 49', label: 'Ví dụ 1', isPublic: true },
    { input: '-7\n2', output: '-3.5 -4 1 49', label: 'Ví dụ 2 (số âm)', isPublic: true },
    { input: '10\n5', output: '2.0 2 0 100000', label: 'Chia hết', isPublic: false },
    { input: '1\n1', output: '1.0 1 0 1', label: 'Biên 1 và 1', isPublic: false },
    { input: '0\n5', output: '0.0 0 0 0', label: 'Biên a = 0', isPublic: false },
    { input: '-10\n3', output: `${-10 / 3} -4 2 -1000`, label: 'Chia dư số âm', isPublic: false },
    { input: '9\n3', output: '3.0 3 0 729', label: 'Ngẫu nhiên 1', isPublic: false },
    { input: '5\n4', output: '1.25 1 1 625', label: 'Ngẫu nhiên 2', isPublic: false },
    { input: '2\n10', output: '0.2 0 2 1024', label: 'Ngẫu nhiên 3 (lũy thừa 10)', isPublic: false },
  ],
  analysis: {
    maxN: '|a| <= 1000, 1 <= b <= 10',
    expectedComplexities: ['O(1) thời gian', 'O(1) bộ nhớ'],
    note: 'Nắm vững hành vi toán tử số học trong Python, đặc biệt là chia nguyên với số âm.',
  },
  starterCode: '# Nhập a và b, tính toán các phép toán số học\na = int(input())\nb = int(input())\n# In div_float, div_int, mod_rem, power_val\n',
  timeLimitSec: 3,
};

const rubric: Rubric = {
  keyIdeas: [
    {
      id: 'idea-div-operators',
      description: 'Phân biệt phép chia thực / (ra float) và phép chia nguyên // (ra int)',
      keywords: ['/', '//', 'chia thực', 'chia nguyên'],
    },
    {
      id: 'idea-modulo-power',
      description: 'Sử dụng toán tử modulo % và toán tử lũy thừa **',
      keywords: ['%', '**', 'chia dư', 'lũy thừa'],
    },
    {
      id: 'idea-print-all-ops',
      description: 'In đầy đủ 4 kết quả trên 1 dòng theo đúng thứ tự',
      keywords: ['print', 'div_float', 'div_int', 'mod_rem', 'power_val'],
    },
  ],
  commonMistakes: [
    'Nhầm lẫn ký hiệu lũy thừa: dùng dấu mũ ^ (trong Python là phép XOR bit) thay vì **',
    'Nhầm tưởng phép chia / trả về số nguyên khi chia hết (4 / 2 ra 2.0 chứ không phải 2)',
    'Nhầm -7 // 2 = -3 (thực tế Python làm tròn xuống sàn nên ra -4)',
  ],
  hintsByIdea: {
    'idea-div-operators': [
      'Bậc 1: Ký hiệu chia thực và chia nguyên trong Python là gì?',
      'Bậc 2: Chia thực là a / b, chia nguyên là a // b.',
      'Bậc 3: div_float = a / b\ndiv_int = a // b',
      'Bậc 4: div_float = a / b\ndiv_int = a // ___',
    ],
    'idea-modulo-power': [
      'Bậc 1: Ký hiệu chia dư và lũy thừa trong Python là gì?',
      'Bậc 2: Dùng % cho chia dư và ** cho lũy thừa.',
      'Bậc 3: mod_rem = a % b\npower_val = a ** b',
      'Bậc 4: mod_rem = a % b\npower_val = a ** ___',
    ],
    'idea-print-all-ops': [
      'Bậc 1: Dùng lệnh print() để in 4 biến ra màn hình.',
      'Bậc 2: print(div_float, div_int, mod_rem, power_val).',
      'Bậc 3: print(div_float, div_int, mod_rem, power_val)',
      'Bậc 4: print(___, ___, ___, ___)',
    ],
  },
};

const stages: Stage[] = [
  {
    title: 'Nhập hai số nguyên',
    goal: 'Đọc a và b từ bàn phím',
    question: 'Tại sao cần điều kiện b khác 0 trong phép chia?',
    codeLines: [1, 2],
    blanks: [
      { line: 1, before: 'a = ', answer: 'int(input())', after: '' },
      { line: 2, before: 'b = ', answer: 'int(input())', after: '' },
    ],
  },
  {
    title: 'Tính toán 4 phép toán',
    goal: 'Tính chia thực, chia nguyên, chia dư và lũy thừa',
    question: 'Toán tử nào dùng để tính lũy thừa a mũ b trong Python?',
    codeLines: [3, 6],
    blanks: [
      { line: 3, before: 'div_float = ', answer: 'a / b', after: '' },
      { line: 4, before: 'div_int = ', answer: 'a // b', after: '' },
      { line: 5, before: 'mod_rem = ', answer: 'a % b', after: '' },
      { line: 6, before: 'power_val = ', answer: 'a ** b', after: '' },
    ],
  },
  {
    title: 'In kết quả',
    goal: 'Xuất 4 kết quả trên một dòng',
    question: 'Kết quả của a / b có đuôi thập phân không?',
    codeLines: [7, 7],
    blanks: [
      {
        line: 7,
        before: 'print(',
        answer: 'div_float, div_int, mod_rem, power_val',
        after: ')',
      },
    ],
  },
];

export const lesson: Lesson = {
  id: 'concept-arithmetic-ops',
  explanation: [
    {
      type: 'text',
      text: 'Hãy hình dung chia bánh: 7 cái bánh chia cho 2 bạn. Nếu cắt đôi cái bánh còn lại, mỗi bạn được 3.5 cái (phép chia thực /). Nếu chỉ chia bánh nguyên vẹn thì mỗi bạn được 3 cái (chia nguyên //) và dư lại 1 cái (chia dư %). Còn lũy thừa ** giống như sự sinh sôi nảy nở gấp bội qua từng thế hệ.',
    },
    {
      type: 'text',
      text: 'Python cung cấp đầy đủ các toán tử số học:\n• + , - , * : Cộng, trừ, nhân thông thường\n• / : Chia thực (luôn trả về float)\n• // : Chia lấy phần nguyên làm tròn xuống (floor division)\n• % : Chia lấy phần dư (modulo)\n• ** : Phép lũy thừa (ví dụ 2 ** 3 = 8)',
    },
    {
      type: 'example',
      title: 'Chia nguyên và chia dư với số âm',
      body: 'Trong Python, -7 // 2 = -4 (vì làm tròn xuống sàn -inf). Do công thức a = (a // b) * b + (a % b), ta có -7 = (-4)*2 + 1, nên -7 % 2 = 1 (phần dư luôn cùng dấu với b).',
    },
    {
      type: 'callout',
      tone: 'warn',
      text: 'BẪY PYTHON CỰC KỲ NGUY HIỂM:\n1. Phép chia "/" luôn sinh số thực float: "4 / 2" ra 2.0 chứ không ra số nguyên 2!\n2. Cú pháp lũy thừa là "**", tuyệt đối không dùng "^" (dấu ^ trong Python là phép toán XOR thao tác bit).\n3. BẪY LÀM TRÒN CHẴN (Banker\'s rounding): Hàm round() trong Python làm tròn về số chẵn gần nhất: round(2.5) == 2 và round(3.5) == 4! Đây là bẫy kinh điển khiến hàng ngàn thí sinh mất điểm khi tính trung bình cộng trong các kỳ thi HSG!',
    },
  ],
  sample: {
    statement:
      'Nhập vào số nguyên a và số nguyên b (1 <= b <= 10). Tính toán và quan sát ô nhớ của 4 phép toán: a / b, a // b, a % b, a ** b.',
    constraints: '-1000 <= a <= 1000; 1 <= b <= 10',
    maxSimSize: '4 phép toán số học',
    fields: [
      {
        key: 'a',
        label: 'Số nguyên a',
        placeholder: 'Ví dụ: 7',
        kind: 'int',
      },
      {
        key: 'b',
        label: 'Số nguyên b (số chia > 0)',
        placeholder: 'Ví dụ: 2',
        kind: 'int',
        help: 'Nhập số nguyên b từ 1 đến 10 (không được bằng 0)',
      },
    ],
    defaultInput: {
      a: '7',
      b: '2',
    },
    presets: [
      {
        name: 'Ví dụ 1: 7 và 2',
        input: { a: '7', b: '2' },
      },
      {
        name: 'Số âm: -7 và 2',
        input: { a: '-7', b: '2' },
      },
      {
        name: 'Chia hết: 10 và 5',
        input: { a: '10', b: '5' },
      },
      {
        name: 'Biên 1 và 1',
        input: { a: '1', b: '1' },
      },
    ],
    parse: (raw: Record<string, string>): ParseResult<ArithmeticInput> => {
      const a = Number(raw.a);
      const b = Number(raw.b);
      if (raw.a === undefined || raw.a === '' || isNaN(a) || !Number.isInteger(a)) {
        return { ok: false, error: 'Giá trị a phải là một số nguyên hợp lệ.' };
      }
      if (raw.b === undefined || raw.b === '' || isNaN(b) || !Number.isInteger(b)) {
        return { ok: false, error: 'Giá trị b phải là một số nguyên hợp lệ.' };
      }
      if (b === 0) {
        return { ok: false, error: 'Số chia b phải khác 0 (lỗi ZeroDivisionError trong Python).' };
      }
      if (b < 1 || b > 10) {
        return { ok: false, error: 'Vui lòng nhập 1 <= b <= 10 để số mũ không bị tràn màn hình.' };
      }
      return { ok: true, value: { a, b } };
    },
    toStdin: (val: unknown): string => {
      const { a, b } = val as ArithmeticInput;
      return `${a}\n${b}`;
    },
  },
  code: sampleCode,
  lineNotes: [
    'Đọc số nguyên a từ bàn phím',
    'Đọc số nguyên b từ bàn phím (b != 0)',
    'Thực hiện phép chia thực a / b (kết quả luôn là float)',
    'Thực hiện phép chia nguyên a // b (làm tròn xuống)',
    'Thực hiện phép chia lấy phần dư a % b',
    'Thực hiện phép nâng lên lũy thừa a ** b',
    'In cả 4 kết quả trên một dòng cách nhau bởi khoảng trắng',
  ],
  generateSteps: (input: unknown): Step[] => {
    const { a, b } = input as ArithmeticInput;
    const steps: Step[] = [];
    let ops = 0;

    // Bước 1: a = int(input())
    ops += 1;
    steps.push({
      line: 1,
      vars: { a },
      highlights: [{ target: 'var:a', indices: [], role: 'active' }],
      explain: `Đọc giá trị a = ${a}.`,
      snapshot: {},
      ops,
    });

    // Bước 2: b = int(input())
    ops += 1;
    steps.push({
      line: 2,
      vars: { a, b },
      highlights: [{ target: 'var:b', indices: [], role: 'active' }],
      explain: `Đọc giá trị b = ${b}.`,
      snapshot: {},
      ops,
    });

    // Bước 3: div_float = a / b
    ops += 1;
    const rawDiv = a / b;
    const div_float = Number.isInteger(rawDiv) ? rawDiv.toFixed(1) : String(rawDiv);
    steps.push({
      line: 3,
      vars: { a, b, div_float },
      highlights: [{ target: 'var:div_float', indices: [], role: 'swap' }],
      explain: `Phép chia thực: ${a} / ${b} = ${div_float} (kết quả kiểu float).`,
      snapshot: {},
      ops,
    });

    // Bước 4: div_int = a // b (KEY STEP)
    ops += 1;
    const div_int = Math.floor(a / b);
    steps.push({
      line: 4,
      vars: { a, b, div_float, div_int },
      highlights: [{ target: 'var:div_int', indices: [], role: 'swap' }],
      explain: `Phép chia nguyên: ${a} // ${b} = ${div_int} (làm tròn xuống sàn -inf).`,
      snapshot: {},
      ops,
      key: true,
    });

    // Bước 5: mod_rem = a % b
    ops += 1;
    // Python modulo: a - (a // b) * b
    const mod_rem = a - Math.floor(a / b) * b;
    steps.push({
      line: 5,
      vars: { a, b, div_float, div_int, mod_rem },
      highlights: [{ target: 'var:mod_rem', indices: [], role: 'swap' }],
      explain: `Phép chia dư: ${a} % ${b} = ${mod_rem}.`,
      snapshot: {},
      ops,
    });

    // Bước 6: power_val = a ** b (KEY STEP)
    ops += 1;
    const power_val = Math.pow(a, b);
    steps.push({
      line: 6,
      vars: { a, b, div_float, div_int, mod_rem, power_val },
      highlights: [{ target: 'var:power_val', indices: [], role: 'swap' }],
      explain: `Phép lũy thừa: ${a} ** ${b} = ${power_val}.`,
      snapshot: {},
      ops,
      key: true,
    });

    // Bước 7: print
    ops += 1;
    const outStr = `${div_float} ${div_int} ${mod_rem} ${power_val}`;
    steps.push({
      line: 7,
      vars: { a, b, div_float, div_int, mod_rem, power_val },
      highlights: [
        { target: 'var:div_float', indices: [], role: 'done' },
        { target: 'var:div_int', indices: [], role: 'done' },
        { target: 'var:mod_rem', indices: [], role: 'done' },
        { target: 'var:power_val', indices: [], role: 'done' },
      ],
      explain: `In 4 kết quả ra màn hình: ${outStr}.`,
      snapshot: {},
      ops,
      output: outStr,
    });

    return steps;
  },
  reference: (input: unknown): string => {
    const { a, b } = input as ArithmeticInput;
    const rawDiv = a / b;
    const div_float = Number.isInteger(rawDiv) ? rawDiv.toFixed(1) : String(rawDiv);
    const div_int = Math.floor(a / b);
    const mod_rem = a - Math.floor(a / b) * b;
    const power_val = Math.pow(a, b);
    return `${div_float} ${div_int} ${mod_rem} ${power_val}`;
  },
  selfTest: (assert) => {
    // 1. Dương
    const s1 = lesson.generateSteps({ a: 7, b: 2 });
    const out1 = s1[s1.length - 1]?.output;
    assert(out1 === '3.5 3 1 49', `Test 1 ra: "${out1}"`);

    // 2. Số âm (floor division)
    const s2 = lesson.generateSteps({ a: -7, b: 2 });
    const out2 = s2[s2.length - 1]?.output;
    assert(out2 === '-3.5 -4 1 49', `Test 2 ra: "${out2}"`);

    // 3. Chia hết ra .0
    const s3 = lesson.generateSteps({ a: 10, b: 5 });
    const out3 = s3[s3.length - 1]?.output;
    assert(out3 === '2.0 2 0 100000', `Test 3 ra: "${out3}"`);
  },
  rubric,
  task,
  stages,
};

export default lesson;
