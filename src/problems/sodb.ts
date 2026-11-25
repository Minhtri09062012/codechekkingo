import { Problem } from '../core/types.ts';

export const problem: Problem = {
  id: 'sodb',
  title: 'Số đặc biệt (SODB)',
  topicNo: 3, // Số học
  level: 'HSG',
  source: 'Đề thi Tin học trẻ / HSG Tin',
  tags: ['Số học', 'Ước số', 'Sàng nguyên tố', 'Prefix sum'],
  task: {
    kind: 'code',
    statement:
      'Một số nguyên dương được gọi là "Số đặc biệt" nếu số lượng ước số nguyên dương của nó là một số nguyên tố.\nCho Q truy vấn, mỗi truy vấn gồm hai số nguyên dương L và R. Hãy đếm số lượng số đặc biệt trong đoạn [L, R].',
    inputFormat:
      'Dòng đầu tiên chứa số nguyên dương Q (1 <= Q <= 10^5).\nQ dòng tiếp theo, mỗi dòng chứa hai số nguyên dương L, R (1 <= L <= R <= 10^6).',
    outputFormat:
      'Gồm Q dòng, mỗi dòng in ra một số nguyên duy nhất là số lượng số đặc biệt trong đoạn [L, R] tương ứng.',
    constraints:
      '1 <= Q <= 10^5; 1 <= L <= R <= 10^6 (Lưu ý: Giới hạn R <= 10^6, Q <= 10^5 cần đối chiếu đề gốc); Thời gian chạy: 2.0s',
    ioMode: {
      kind: 'file',
      inputFile: 'SODB.INP',
      outputFile: 'SODB.OUT',
    },
    glossary: [
      {
        term: 'Ước số',
        meaning: 'Số nguyên dương d mà N chia hết cho d (1 <= d <= N)',
      },
      {
        term: 'Số đặc biệt',
        meaning: 'Số N có số lượng ước d(N) là một số nguyên tố (2, 3, 5, 7, ...)',
      },
      {
        term: 'Mảng cộng dồn (prefix sum)',
        meaning: 'Mảng lưu số lượng số đặc biệt tích lũy từ 1 đến i, trả lời truy vấn [L, R] trong O(1)',
      },
    ],
    examples: [
      {
        input: '2\n1 5\n7 10',
        output: '4\n2',
        note: 'Trong đoạn [1, 5]: 2(2 ước), 3(2 ước), 4(3 ước), 5(2 ước) là số đặc biệt -> có 4 số. Trong đoạn [7, 10]: 7(2 ước) và 9(3 ước) là số đặc biệt -> có 2 số.',
      },
    ],
    tests: [
      { input: '2\n1 5\n7 10', output: '4\n2', label: 'Ví dụ đề bài', isPublic: true, subtask: 1 },
      { input: '1\n1 1', output: '0', label: 'Biên số 1 (có 1 ước không phải SNT)', isPublic: true, subtask: 1 },
      { input: '1\n2 3', output: '2', label: 'Biên hai số nguyên tố nhỏ', isPublic: false, subtask: 1 },
      { input: '1\n4 4', output: '1', label: 'Biên số chính phương (4 có 3 ước)', isPublic: false, subtask: 1 },
      { input: '3\n1 10\n11 20\n21 30', output: '6\n5\n3', label: 'Ba truy vấn liên tiếp', isPublic: false, subtask: 2 },
      { input: '2\n2 7\n8 12', output: '5\n2', label: 'Truy vấn vừa', isPublic: false, subtask: 2 },
      { input: '1\n1 50', output: '20', label: 'Đoạn [1, 50]', isPublic: false, subtask: 3 },
      { input: '1\n1 100', output: '32', label: 'Đoạn [1, 100]', isPublic: false, subtask: 3 },
    ],
    subtasks: [
      { id: 1, points: 40, description: 'R <= 1000, Q <= 100 (Duyệt trâu đếm ước)' },
      { id: 2, points: 30, description: 'R <= 10^5, Q <= 10^4' },
      { id: 3, points: 30, description: 'R <= 10^6, Q <= 10^5 (Sàng và mảng cộng dồn)' },
    ],
    analysis: {
      maxN: 'R <= 10^6, Q <= 10^5',
      expectedComplexities: ['O(R log R + Q) thời gian', 'O(R) bộ nhớ'],
      note: 'Nếu duyệt đếm ước từng số với mỗi truy vấn sẽ mất O(Q * R * sqrt(R)) gây TLE. Cần tiền xử lý bằng cách sàng số lượng ước cho mọi số đến R trong O(R log R), kiểm tra tính nguyên tố của số lượng ước, rồi xây dựng mảng cộng dồn prefix để trả lời mỗi truy vấn trong O(1).',
    },
    starterCode:
      '# Đọc file SODB.INP và ghi ra SODB.OUT\nimport sys\n\n# Bước 1: Tiền xử lý đếm ước cho toàn bộ số đến R_MAX\n# Bước 2: Dùng mảng cộng dồn để trả lời Q truy vấn\n',
    referenceSolution: `import sys

def solve():
    try:
        with open('SODB.INP', 'r') as f:
            lines = f.read().split()
    except Exception:
        lines = sys.stdin.read().split()

    if not lines:
        return

    Q = int(lines[0])
    queries = []
    max_r = 1
    idx = 1
    for _ in range(Q):
        if idx >= len(lines):
            break
        l = int(lines[idx])
        r = int(lines[idx + 1])
        queries.append((l, r))
        if r > max_r:
            max_r = r
        idx += 2

    # Giới hạn tối đa cần sàng
    limit = max(max_r, 10)

    # Đếm số ước bằng sàng
    div_count = [0] * (limit + 1)
    for i in range(1, limit + 1):
        for j in range(i, limit + 1, i):
            div_count[j] += 1

    # Sàng số nguyên tố nhỏ để kiểm tra số lượng ước (div_count <= 240 với limit <= 10^6)
    is_prime = [True] * 250
    is_prime[0] = is_prime[1] = False
    for i in range(2, 16):
        if is_prime[i]:
            for j in range(i * i, 250, i):
                is_prime[j] = False

    # Mảng cộng dồn
    pref = [0] * (limit + 1)
    for i in range(1, limit + 1):
        c = div_count[i]
        val = 1 if (c < 250 and is_prime[c]) else 0
        pref[i] = pref[i - 1] + val

    out = []
    for l, r in queries:
        ans = pref[r] - pref[l - 1]
        out.append(str(ans))

    res = '\\n'.join(out)
    try:
        with open('SODB.OUT', 'w') as f:
            f.write(res + '\\n')
    except Exception:
        print(res)

if __name__ == '__main__':
    solve()`,
    timeLimitSec: 2,
  },
  rubric: {
    keyIdeas: [
      {
        id: 'idea-sieve-divisors',
        description: 'Sàng đếm số lượng ước của tất cả các số từ 1 đến R tối đa trong O(R log R)',
        keywords: ['đếm ước', 'sàng', 'bội số', 'div_count', 'for j in range'],
      },
      {
        id: 'idea-prime-check-divisors',
        description: 'Kiểm tra số lượng ước d(i) có phải là số nguyên tố hay không để đánh dấu số đặc biệt',
        keywords: ['nguyên tố', 'is_prime', 'số đặc biệt', 'ước là số nguyên tố'],
      },
      {
        id: 'idea-prefix-sum-queries',
        description: 'Xây dựng mảng cộng dồn prefix để trả lời mỗi truy vấn [L, R] trong O(1)',
        keywords: ['cộng dồn', 'prefix', 'pref[r] - pref[l - 1]', 'O(1)'],
      },
    ],
    commonMistakes: [
      'Duyệt từng số từ L đến R rồi đếm ước độc lập với mỗi truy vấn gây TLE (quá thời gian)',
      'Coi số 1 là số nguyên tố (1 chỉ có 1 ước, nhưng 1 không phải số nguyên tố)',
      'Không đọc/ghi file SODB.INP và SODB.OUT theo đúng yêu cầu bài thi HSG',
    ],
    hintsByIdea: {
      'idea-sieve-divisors': [
        'Bậc 1: Với Q = 10^5, em không thể đếm ước từng số cho mỗi truy vấn. Hãy nghĩ đến tiền xử lý một lần cho mọi số.',
        'Bậc 2: Hãy dùng vòng lặp bội số kiểu sàng Eratosthenes: mỗi số i sẽ là ước của i, 2i, 3i, 4i...',
        'Bậc 3: Xem mô phỏng với dữ liệu nhỏ: limit = 10, chạy i từ 1 đến 10 tăng div_count[j] với j chia hết cho i.',
        'Bậc 4: div_count = [0] * (MAX_R + 1)\nfor i in range(1, MAX_R + 1):\n    for j in range(i, MAX_R + 1, i):\n        div_count[j] += 1',
      ],
      'idea-prime-check-divisors': [
        'Bậc 1: Số lượng ước của một số <= 10^6 tối đa chỉ khoảng 240 ước. Em có thể kiểm tra tính nguyên tố của số lượng ước này rất nhanh.',
        'Bậc 2: Tạo một danh sách hoặc hàm kiểm tra xem div_count[i] có thuộc tập số nguyên tố {2, 3, 5, 7, ...} hay không.',
        'Bậc 3: Chú ý: số 1 chỉ có 1 ước duy nhất là 1, mà 1 KHÔNG phải số nguyên tố, nên 1 không phải số đặc biệt.',
        'Bậc 4: is_special[i] = 1 if is_prime(div_count[i]) else 0',
      ],
      'idea-prefix-sum-queries': [
        'Bậc 1: Sau khi biết mỗi số có phải số đặc biệt hay không, làm sao đếm nhanh trong đoạn [L, R]?',
        'Bậc 2: Hãy áp dụng mảng cộng dồn prefix: pref[i] = số lượng số đặc biệt từ 1 đến i.',
        'Bậc 3: Số lượng số đặc biệt trong đoạn [L, R] chính là: pref[R] - pref[L - 1].',
        'Bậc 4: pref = [0] * (MAX_R + 1)\nfor i in range(1, MAX_R + 1):\n    pref[i] = pref[i - 1] + is_special[i]\n# Truy vấn: ans = pref[R] - pref[L - 1]',
      ],
    },
  },
  lessonIds: ['algo-divisor-count', 'algo-sieve-eratosthenes', 'algo-prefix-sum'],
  simPresets: [
    {
      lessonId: 'algo-divisor-count',
      label: 'Mô phỏng đếm ước n=4',
      input: { n: '4' },
    },
    {
      lessonId: 'algo-prefix-sum',
      label: 'Mô phỏng cộng dồn đoạn nhỏ 1..5',
      input: { arr: '0 1 1 1 1', queries: '1 5' },
    },
  ],
};

export default problem;
