import { Lesson, Step, ParseResult, Task, Rubric, Stage, ArraySnapshot } from '../core/types.ts';

interface MinMaxInput {
  arr: number[];
  mode: 'max' | 'min';
}

const sampleCode = [
  'mode = input().strip()',
  'arr = list(map(int, input().split()))',
  'best = arr[0]',
  'for i in range(1, len(arr)):',
  '    if (mode == "max" and arr[i] > best) or (mode == "min" and arr[i] < best):',
  '        best = arr[i]',
  'print(best)',
];

const task: Task = {
  kind: 'code',
  statement:
    'Cho một dòng chứa chế độ ("max" hoặc "min") và một dòng chứa danh sách số nguyên. Hãy tìm giá trị lớn nhất (nếu mode là "max") hoặc nhỏ nhất (nếu mode là "min") trong danh sách và in ra màn hình.',
  inputFormat:
    'Dòng 1: Xâu ký tự "max" hoặc "min".\nDòng 2: Danh sách các số nguyên cách nhau bởi khoảng trắng (-10^9 <= ai <= 10^9, số phần tử 1 <= n <= 10^5).',
  outputFormat: 'In ra một số nguyên duy nhất là giá trị tốt nhất tìm được.',
  constraints: '1 <= n <= 10^5; |ai| <= 10^9; Thời gian chạy: 1.0s',
  glossary: [
    { term: 'Lính canh (Sentinel)', meaning: 'Giá trị khởi tạo tạm thời (arr[0]) để so sánh với các phần tử còn lại' },
    { term: 'Cực trị', meaning: 'Giá trị lớn nhất (maximum) hoặc nhỏ nhất (minimum)' },
  ],
  examples: [
    { input: 'max\n5 3 9 1', output: '9', note: 'Chế độ max: số lớn nhất trong [5, 3, 9, 1] là 9' },
    { input: 'min\n5 3 9 1', output: '1', note: 'Chế độ min: số nhỏ nhất trong [5, 3, 9, 1] là 1' },
  ],
  ioMode: { kind: 'stdio' },
  referenceSolution:
    'mode = input().strip()\narr = list(map(int, input().split()))\nif mode == "max":\n    print(max(arr))\nelse:\n    print(min(arr))',
  tests: [
    { input: 'max\n5 3 9 1', output: '9', label: 'Ví dụ 1 (max)', isPublic: true },
    { input: 'min\n5 3 9 1', output: '1', label: 'Ví dụ 2 (min)', isPublic: true },
    { input: 'max\n-8 -3 -15 -2', output: '-2', label: 'Biên: Toàn số âm (max)', isPublic: false },
    { input: 'min\n-8 -3 -15 -2', output: '-15', label: 'Biên: Toàn số âm (min)', isPublic: false },
    { input: 'max\n42', output: '42', label: 'Biên: 1 phần tử (max)', isPublic: false },
    { input: 'min\n7 7 7', output: '7', label: 'Biên: Các phần tử bằng nhau', isPublic: false },
    { input: 'max\n10 20 30 40 50', output: '50', label: 'Ngẫu nhiên 1: Dãy tăng', isPublic: false },
    { input: 'min\n50 40 30 20 10', output: '10', label: 'Ngẫu nhiên 2: Dãy giảm', isPublic: false },
    { input: 'max\n-1000000000 0 1000000000', output: '1000000000', label: 'Ngẫu nhiên 3: Cực đại cực tiểu', isPublic: false },
  ],
  analysis: {
    maxN: 'n <= 10^5',
    expectedComplexities: ['O(n) thời gian', 'O(1) bộ nhớ'],
    note: 'Thuật toán duyệt tuần tự 1 lượt từ trái sang phải với kỹ thuật lính canh.',
  },
  starterCode:
    '# Đọc chế độ và mảng số nguyên\nmode = input().strip()\narr = list(map(int, input().split()))\n# Cài đặt thuật toán tìm lính canh best tại đây\n',
  timeLimitSec: 3,
};

const rubric: Rubric = {
  keyIdeas: [
    {
      id: 'idea-sentinel-init',
      description: 'Khởi tạo lính canh best bằng phần tử đầu tiên arr[0]',
      keywords: ['best = arr[0]', 'lính canh', 'khởi tạo'],
    },
    {
      id: 'idea-loop-condition',
      description: 'Duyệt tuần tự từ phần tử thứ 2 (chỉ số 1) và so sánh theo đúng chế độ max/min',
      keywords: ['for i in range(1', 'arr[i] > best', 'arr[i] < best', 'so sánh'],
    },
    {
      id: 'idea-update-best',
      description: 'Cập nhật lại kỷ lục best = arr[i] khi tìm thấy phần tử tốt hơn',
      keywords: ['best = arr[i]', 'cập nhật', 'kỷ lục'],
    },
  ],
  commonMistakes: [
    'Khởi tạo best = 0 khi tìm max trên mảng toàn số âm (dẫn đến kết quả sai)',
    'Duyệt từ chỉ số 0 và so sánh thừa một lần với chính arr[0]',
    'Quên kiểm tra chế độ mode dẫn đến luôn tìm max hoặc luôn tìm min',
  ],
  hintsByIdea: {
    'idea-sentinel-init': [
      'Bậc 1: Phần tử nào trong danh sách là ứng viên tốt nhất khi chưa xét các phần tử khác?',
      'Bậc 2: Khởi tạo biến kỷ lục best bằng phần tử đầu tiên arr[0].',
      'Bậc 3: Viết best = arr[0].',
      'Bậc 4: best = ___',
    ],
    'idea-loop-condition': [
      'Bậc 1: Sau khi đã lấy arr[0], ta cần duyệt tiếp từ vị trí nào?',
      'Bậc 2: Dùng range(1, len(arr)) để duyệt các phần tử từ chỉ số 1.',
      'Bậc 3: So sánh arr[i] > best nếu mode=="max" hoặc arr[i] < best nếu mode=="min".',
      'Bậc 4: if (mode == "max" and arr[i] > best) or (mode == "min" and arr[i] < best):',
    ],
    'idea-update-best': [
      'Bậc 1: Khi phát hiện phần tử arr[i] vượt kỷ lục hiện tại, ta cần làm gì?',
      'Bậc 2: Gán giá trị mới của phần tử đó cho biến kỷ lục best.',
      'Bậc 3: Viết best = arr[i].',
      'Bậc 4: best = ___',
    ],
  },
};

const stages: Stage[] = [
  {
    title: 'Đọc dữ liệu & Khởi tạo',
    goal: 'Đọc chế độ, danh sách và khởi tạo lính canh',
    question: 'Tại sao cần gán best = arr[0] thay vì gán số 0?',
    codeLines: [1, 3],
    blanks: [
      { line: 1, before: 'mode = ', answer: 'input().strip()', after: '' },
      { line: 2, before: 'arr = list(map(int, ', answer: 'input().split()', after: '))' },
      { line: 3, before: 'best = ', answer: 'arr[0]', after: '' },
    ],
  },
  {
    title: 'Duyệt & Cập nhật',
    goal: 'Duyệt mảng và cập nhật kỷ lục khi phát hiện giá trị tốt hơn',
    question: 'Điều kiện cập nhật khi tìm giá trị lớn nhất là gì?',
    codeLines: [4, 6],
    blanks: [
      { line: 4, before: 'for i in range(', answer: '1, len(arr)', after: '):' },
      { line: 5, before: '    if ', answer: '(mode == "max" and arr[i] > best) or (mode == "min" and arr[i] < best)', after: ':' },
      { line: 6, before: '        best = ', answer: 'arr[i]', after: '' },
    ],
  },
  {
    title: 'In kết quả',
    goal: 'Xuất giá trị tốt nhất ra màn hình',
    question: 'Lệnh in kết quả cuối cùng',
    codeLines: [7, 7],
    blanks: [{ line: 7, before: 'print(', answer: 'best', after: ')' }],
  },
];

export const lesson: Lesson = {
  id: 'algo-min-max',
  explanation: [
    {
      type: 'text',
      text: 'Tìm max/min là thuật toán cơ bản áp dụng kỹ thuật "lính canh": khởi tạo phần tử đầu tiên arr[0] làm mốc chuẩn (best), sau đó lần lượt duyệt các phần tử tiếp theo để so sánh và thay thế nếu tìm được giá trị tốt hơn.',
    },
    {
      type: 'callout',
      tone: 'warn',
      text: 'BẪY PYTHON: Tuyệt đối không gán best = 0 khi tìm max hay best = 99999 khi tìm min. Nếu danh sách toàn số âm như [-8, -3, -15], việc khởi tạo best = 0 sẽ cho kết quả sai hoàn toàn vì 0 lớn hơn mọi số âm!',
    },
    {
      type: 'example',
      title: 'Ứng dụng trong các kỳ thi HSG',
      body: 'Kỹ thuật lính canh là nền tảng cho hàng loạt thuật toán nâng cao: tìm đoạn con lớn nhất (Kadane), tìm đường đi ngắn nhất (Dijkstra), và bài toán cái túi (Knapsack).',
    },
  ],
  sample: {
    statement:
      'Cho danh sách số nguyên và chế độ ("max" hoặc "min"). Hãy tìm phần tử lớn nhất hoặc nhỏ nhất bằng kỹ thuật lính canh.',
    constraints: 'Tối đa 12 phần tử để mô phỏng trực quan rõ ràng nhất',
    maxSimSize: 'N <= 12 phần tử',
    fields: [
      {
        key: 'arr',
        label: 'Danh sách số nguyên',
        placeholder: 'Ví dụ: 5, 3, 9, 1',
        help: 'Nhập các số nguyên cách nhau bởi dấu cách hoặc phẩy (tối đa 12 số)',
        kind: 'intList',
      },
      {
        key: 'mode',
        label: 'Chế độ tìm kiếm',
        placeholder: 'Chọn max hoặc min',
        help: 'Tìm số lớn nhất (max) hoặc nhỏ nhất (min)',
        kind: 'choice',
        options: ['max', 'min'],
      },
    ],
    defaultInput: {
      arr: '5, 3, 9, 1',
      mode: 'max',
    },
    presets: [
      {
        name: 'Tìm max: 5 3 9 1',
        input: { arr: '5, 3, 9, 1', mode: 'max' },
      },
      {
        name: 'Tìm min: 5 3 9 1',
        input: { arr: '5, 3, 9, 1', mode: 'min' },
      },
      {
        name: 'Biên: Toàn số âm (-8, -3, -15, -2)',
        input: { arr: '-8, -3, -15, -2', mode: 'max' },
      },
      {
        name: 'Biên: 1 phần tử (42)',
        input: { arr: '42', mode: 'max' },
      },
      {
        name: 'Biên: Các phần tử bằng nhau (7, 7, 7)',
        input: { arr: '7, 7, 7', mode: 'min' },
      },
    ],
    parse: (raw: Record<string, string>): ParseResult<MinMaxInput> => {
      const mode = raw.mode === 'min' ? 'min' : 'max';
      const str = raw.arr ?? '';
      const parts = str.split(/[\s,]+/).filter((s) => s.length > 0);

      if (parts.length === 0) {
        return { ok: false, error: 'Vui lòng nhập ít nhất một số nguyên cho danh sách.' };
      }
      if (parts.length > 12) {
        return { ok: false, error: 'Giới hạn mô phỏng tối đa 12 phần tử để quan sát rõ nhất.' };
      }

      const arr: number[] = [];
      for (const p of parts) {
        const num = Number(p);
        if (isNaN(num) || !Number.isInteger(num)) {
          return { ok: false, error: `Phần tử "${p}" không phải là số nguyên hợp lệ.` };
        }
        arr.push(num);
      }

      return { ok: true, value: { arr, mode } };
    },
    toStdin: (val: unknown): string => {
      const { arr, mode } = val as MinMaxInput;
      return `${mode}\n${arr.join(' ')}`;
    },
  },
  code: sampleCode,
  lineNotes: [
    'Đọc chế độ tìm kiếm: "max" (lớn nhất) hoặc "min" (nhỏ nhất)',
    'Đọc danh sách các số nguyên từ bàn phím',
    'Khởi tạo lính canh best bằng phần tử đầu tiên arr[0]',
    'Duyệt tuần tự từ phần tử thứ 2 (chỉ số 1) đến cuối mảng',
    'Kiểm tra nếu phần tử hiện tại tốt hơn kỷ lục best',
    'Cập nhật giá trị kỷ lục mới best = arr[i]',
    'In ra kết quả giá trị tốt nhất tìm được',
  ],
  generateSteps: (input: unknown): Step[] => {
    const { arr, mode } = input as MinMaxInput;
    const steps: Step[] = [];
    let ops = 0;

    const makeSnapshot = (pointers?: { name: string; index: number }[]): ArraySnapshot => ({
      arrays: [
        {
          name: 'arr',
          values: [...arr],
          pointers: pointers || [],
        },
      ],
    });

    // Bước 1: mode = input().strip()
    ops += 1;
    steps.push({
      line: 1,
      vars: { mode },
      highlights: [],
      explain: `Đọc chế độ tìm kiếm: mode = "${mode}".`,
      snapshot: makeSnapshot(),
      ops,
    });

    // Bước 2: arr = list(map(int, input().split()))
    ops += arr.length;
    steps.push({
      line: 2,
      vars: { mode, 'len(arr)': arr.length },
      highlights: [{ target: 'arr', indices: arr.map((_, idx) => idx), role: 'active' }],
      explain: `Khởi tạo danh sách arr gồm ${arr.length} phần tử: [${arr.join(', ')}].`,
      snapshot: makeSnapshot(),
      ops,
    });

    // Bước 3: best = arr[0]
    let best = arr[0];
    ops += 1;
    steps.push({
      line: 3,
      vars: { mode, best, 'arr[0]': arr[0] },
      highlights: [{ target: 'arr', indices: [0], role: 'found' }],
      explain: `Khởi tạo lính canh best = arr[0] = ${best}. Đây là kỷ lục tạm thời ban đầu.`,
      snapshot: makeSnapshot([{ name: 'best', index: 0 }]),
      ops,
      key: true,
    });

    // Vòng lặp duyệt từ i = 1 đến len(arr) - 1
    for (let i = 1; i < arr.length; i++) {
      // Dòng 4: for i in range(1, len(arr)):
      ops += 1;
      steps.push({
        line: 4,
        vars: { mode, best, i },
        highlights: [{ target: 'arr', indices: [i], role: 'active' }],
        explain: `Xét phần tử tại chỉ số i = ${i} có giá trị arr[${i}] = ${arr[i]}.`,
        snapshot: makeSnapshot([{ name: 'i', index: i }]),
        ops,
      });

      // Dòng 5: Kiểm tra điều kiện
      ops += 1;
      const currentVal = arr[i];
      const isBetter = mode === 'max' ? currentVal > best : currentVal < best;

      steps.push({
        line: 5,
        vars: { mode, best, i, 'arr[i]': currentVal },
        highlights: [{ target: 'arr', indices: [i], role: 'compare' }],
        explain: `So sánh arr[${i}] (${currentVal}) với kỷ lục best (${best}). Kết quả: ${
          isBetter
            ? `${currentVal} tốt hơn ${best} theo chế độ ${mode} → Cần cập nhật!`
            : `${currentVal} không tốt hơn ${best} → Giữ nguyên kỷ lục.`
        }`,
        snapshot: makeSnapshot([{ name: 'i', index: i }]),
        ops,
      });

      // Dòng 6: Cập nhật nếu tốt hơn (KEY STEP)
      if (isBetter) {
        best = currentVal;
        ops += 1;
        steps.push({
          line: 6,
          vars: { mode, best, i },
          highlights: [{ target: 'arr', indices: [i], role: 'found' }],
          explain: `Cập nhật kỷ lục mới: best = arr[${i}] = ${best}!`,
          snapshot: makeSnapshot([{ name: 'best', index: i }]),
          ops,
          key: true,
        });
      }
    }

    // Bước cuối: print(best)
    const bestIndex = arr.indexOf(best);
    ops += 1;
    steps.push({
      line: 7,
      vars: { mode, best },
      highlights: [{ target: 'arr', indices: bestIndex >= 0 ? [bestIndex] : [], role: 'done' }],
      explain: `Kết thúc duyệt mảng! In ra giá trị ${mode} cuối cùng là ${best}.`,
      snapshot: makeSnapshot(bestIndex >= 0 ? [{ name: 'best', index: bestIndex }] : []),
      ops,
      output: String(best),
    });

    return steps;
  },
  reference: (input: unknown): string => {
    const { arr, mode } = input as MinMaxInput;
    return mode === 'max' ? String(Math.max(...arr)) : String(Math.min(...arr));
  },
  selfTest: (assert) => {
    // 1. Test thông thường (max): [5, 3, 9, 1] -> 9
    const s1 = lesson.generateSteps({ arr: [5, 3, 9, 1], mode: 'max' });
    const out1 = s1[s1.length - 1]?.output;
    const ref1 = lesson.reference({ arr: [5, 3, 9, 1], mode: 'max' });
    assert(out1 === '9', `Thông thường max [5, 3, 9, 1]: output = "${out1}", mong đợi "9"`);
    assert(ref1 === '9', `Thông thường max [5, 3, 9, 1]: reference = "${ref1}", mong đợi "9"`);

    // 2. Test biên: 1 phần tử [42] -> 42
    const s2 = lesson.generateSteps({ arr: [42], mode: 'max' });
    const out2 = s2[s2.length - 1]?.output;
    const ref2 = lesson.reference({ arr: [42], mode: 'max' });
    assert(out2 === '42', `Biên 1 phần tử [42]: output = "${out2}", mong đợi "42"`);
    assert(ref2 === '42', `Biên 1 phần tử [42]: reference = "${ref2}", mong đợi "42"`);

    // 3. Test đặc biệt: toàn số âm và mode min: [-8, -3, -15, -2] -> -15
    const s3 = lesson.generateSteps({ arr: [-8, -3, -15, -2], mode: 'min' });
    const out3 = s3[s3.length - 1]?.output;
    const ref3 = lesson.reference({ arr: [-8, -3, -15, -2], mode: 'min' });
    assert(out3 === '-15', `Đặc biệt min [-8, -3, -15, -2]: output = "${out3}", mong đợi "-15"`);
    assert(ref3 === '-15', `Đặc biệt min [-8, -3, -15, -2]: reference = "${ref3}", mong đợi "-15"`);

    // 4. Test biên: các phần tử bằng nhau: [7, 7, 7] -> 7
    const s4 = lesson.generateSteps({ arr: [7, 7, 7], mode: 'min' });
    const out4 = s4[s4.length - 1]?.output;
    const ref4 = lesson.reference({ arr: [7, 7, 7], mode: 'min' });
    assert(out4 === '7', `Biên các phần tử bằng nhau [7, 7, 7]: output = "${out4}", mong đợi "7"`);
    assert(ref4 === '7', `Biên các phần tử bằng nhau [7, 7, 7]: reference = "${ref4}", mong đợi "7"`);
  },
  rubric,
  task,
  stages,
};

export default lesson;
