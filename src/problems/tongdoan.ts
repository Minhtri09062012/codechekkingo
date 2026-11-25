import { Problem } from '../core/types.ts';

export const problem: Problem = {
  id: 'tongdoan',
  title: 'Tổng đoạn con (TONGDOAN)',
  topicNo: 2, // Đoạn con và cộng dồn
  level: 'A',
  source: 'Đề thi chọn HSG Tin học cấp Huyện/Tỉnh',
  tags: ['Mảng', 'Cộng dồn', 'Prefix sum', 'O(1) truy vấn'],
  task: {
    kind: 'code',
    statement:
      'Cho một dãy số nguyên A gồm N phần tử A_1, A_2, ..., A_N và Q truy vấn.\nMỗi truy vấn cho hai chỉ số l và r (1 <= l <= r <= N). Hãy tính tổng các phần tử từ chỉ số l đến r: S = A_l + A_{l+1} + ... + A_r.',
    inputFormat:
      'Dòng đầu chứa hai số nguyên dương N và Q (1 <= N, Q <= 10^5).\nDòng thứ hai chứa N số nguyên A_1, A_2, ..., A_N (-10^9 <= A_i <= 10^9).\nQ dòng tiếp theo, mỗi dòng chứa hai số nguyên l và r (1 <= l <= r <= N).',
    outputFormat:
      'Gồm Q dòng, mỗi dòng in ra một số nguyên duy nhất là tổng đoạn con tương ứng.',
    constraints:
      '1 <= N, Q <= 10^5; |A_i| <= 10^9; Thời gian chạy: 1.0s',
    ioMode: {
      kind: 'file',
      inputFile: 'TONGDOAN.INP',
      outputFile: 'TONGDOAN.OUT',
    },
    glossary: [
      {
        term: 'Mảng cộng dồn (prefix sum)',
        meaning: 'P[i] = A_1 + A_2 + ... + A_i. Tổng đoạn [l, r] = P[r] - P[l-1]',
      },
      {
        term: 'Chỉ số 1-based',
        meaning: 'Các phần tử được đánh chỉ số từ 1 đến N thay vì từ 0 đến N-1',
      },
    ],
    examples: [
      {
        input: '5 3\n2 4 1 7 3\n1 3\n2 4\n3 5',
        output: '7\n12\n11',
        note: 'Đoạn [1, 3] = 2 + 4 + 1 = 7. Đoạn [2, 4] = 4 + 1 + 7 = 12. Đoạn [3, 5] = 1 + 7 + 3 = 11.',
      },
    ],
    tests: [
      { input: '5 3\n2 4 1 7 3\n1 3\n2 4\n3 5', output: '7\n12\n11', label: 'Ví dụ đề bài', isPublic: true, subtask: 1 },
      { input: '3 2\n5 10 15\n1 1\n3 3', output: '5\n15', label: 'Biên đoạn 1 phần tử', isPublic: true, subtask: 1 },
      { input: '4 1\n-5 10 -2 8\n1 4', output: '11', label: 'Toàn bộ mảng số âm/dương', isPublic: false, subtask: 1 },
      { input: '5 2\n0 0 0 0 0\n1 5\n2 3', output: '0\n0', label: 'Mảng toàn số 0', isPublic: false, subtask: 2 },
      { input: '6 3\n1 2 3 4 5 6\n1 6\n2 5\n3 4', output: '21\n14\n7', label: 'Truy vấn lồng nhau', isPublic: false, subtask: 2 },
      { input: '5 2\n-10 -20 -30 -40 -50\n1 3\n4 5', output: '-60\n-90', label: 'Số âm', isPublic: false, subtask: 2 },
      { input: '4 2\n1000000 2000000 3000000 4000000\n1 4\n2 3', output: '10000000\n5000000', label: 'Số lớn', isPublic: false, subtask: 2 },
    ],
    subtasks: [
      { id: 1, points: 50, description: 'N, Q <= 1000 (Vòng lặp tính trực tiếp O(N*Q))' },
      { id: 2, points: 50, description: 'N, Q <= 10^5 (Mảng cộng dồn O(N + Q))' },
    ],
    analysis: {
      maxN: 'N, Q <= 10^5',
      expectedComplexities: ['O(N + Q) thời gian', 'O(N) bộ nhớ'],
      note: 'Với N, Q lên tới 10^5, thuật toán ngây thơ duyệt vòng lặp từ l đến r cho mỗi truy vấn sẽ tốn O(N * Q) = 10^10 phép tính (chắc chắn TLE). Dùng mảng tiền tố P[i] = P[i-1] + A[i] để trả lời mỗi truy vấn trong O(1).',
    },
    starterCode:
      '# Đọc từ TONGDOAN.INP và xuất ra TONGDOAN.OUT\nimport sys\n\n# Đọc N, Q và dãy A\n# Xây dựng mảng cộng dồn P và trả lời truy vấn\n',
    referenceSolution: `import sys

def solve():
    try:
        with open('TONGDOAN.INP', 'r') as f:
            data = f.read().split()
    except Exception:
        data = sys.stdin.read().split()

    if not data:
        return

    n = int(data[0])
    q = int(data[1])

    arr = [int(x) for x in data[2:2 + n]]

    # Xây dựng mảng cộng dồn 1-based
    pref = [0] * (n + 1)
    for i in range(n):
        pref[i + 1] = pref[i] + arr[i]

    out = []
    idx = 2 + n
    for _ in range(q):
        if idx >= len(data):
            break
        l = int(data[idx])
        r = int(data[idx + 1])
        idx += 2
        ans = pref[r] - pref[l - 1]
        out.append(str(ans))

    res = '\\n'.join(out)
    try:
        with open('TONGDOAN.OUT', 'w') as f:
            f.write(res + '\\n')
    except Exception:
        print(res)

if __name__ == '__main__':
    solve()`,
    timeLimitSec: 1,
  },
  rubric: {
    keyIdeas: [
      {
        id: 'idea-prefix-construction',
        description: 'Tạo mảng cộng dồn pref với pref[i] = pref[i-1] + A[i] trong O(N)',
        keywords: ['cộng dồn', 'pref', 'prefix', 'for i in range', 'pref[i-1] + arr[i]'],
      },
      {
        id: 'idea-o1-range-query',
        description: 'Tính tổng đoạn [l, r] bằng công thức pref[r] - pref[l-1] trong O(1)',
        keywords: ['pref[r] - pref[l - 1]', 'công thức O(1)', 'hiệu hai tiền tố'],
      },
      {
        id: 'idea-fast-io',
        description: 'Đọc/ghi tệp TONGDOAN.INP và TONGDOAN.OUT đúng chuẩn thi HSG',
        keywords: ['TONGDOAN.INP', 'TONGDOAN.OUT', 'open', 'sys.stdin'],
      },
    ],
    commonMistakes: [
      'Chạy vòng lặp tính tổng từ l đến r cho mỗi truy vấn dẫn đến TLE O(N*Q)',
      'Lẫn lộn chỉ số 0-based của mảng Python và 1-based của đề bài',
      'Quên tính trường hợp l = 1 (cần pref[0] = 0 để pref[1] - pref[0] đúng)',
    ],
    hintsByIdea: {
      'idea-prefix-construction': [
        'Bậc 1: Nếu tính tổng từng phần tử trong mỗi truy vấn, chương trình sẽ chạy rất chậm. Em có thể tính trước tổng tích lũy từ đầu mảng không?',
        'Bậc 2: Hãy lập mảng P độ dài N+1, với P[i] là tổng của i phần tử đầu tiên.',
        'Bậc 3: Quan sát: P[i] = P[i-1] + A[i]. Khởi tạo P[0] = 0.',
        'Bậc 4: pref = [0] * (n + 1)\nfor i in range(n):\n    pref[i + 1] = pref[i] + arr[i]',
      ],
      'idea-o1-range-query': [
        'Bậc 1: Tổng từ vị trí l đến r liên hệ như thế nào với tổng từ 1 đến r và tổng từ 1 đến l-1?',
        'Bậc 2: Tổng [l, r] = (Tổng từ 1 đến r) - (Tổng từ 1 đến l-1).',
        'Bậc 3: Áp dụng mảng pref: kết quả là pref[r] - pref[l-1]. Phép trừ này chỉ tốn O(1)!',
        'Bậc 4: ans = pref[r] - pref[l - 1]',
      ],
      'idea-fast-io': [
        'Bậc 1: Chú ý đề bài yêu cầu đọc và ghi tệp tin nào.',
        'Bậc 2: Mở tệp TONGDOAN.INP để đọc và TONGDOAN.OUT để ghi.',
        'Bậc 3: Với Q = 10^5, gom kết quả vào một danh sách rồi ghi một lần: "\\n".join(out).',
        'Bậc 4: with open("TONGDOAN.INP", "r") as f:\n    data = f.read().split()',
      ],
    },
  },
  lessonIds: ['algo-prefix-sum'],
  simPresets: [
    {
      lessonId: 'algo-prefix-sum',
      label: 'Mô phỏng mảng 5 số [2, 4, 1, 7, 3]',
      input: { arr: '2 4 1 7 3', queries: '2 4' },
    },
  ],
};

export default problem;
