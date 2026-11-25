import { Problem } from '../core/types.ts';

export const problem: Problem = {
  id: 'cuasotruot',
  title: 'Cửa sổ trượt lớn nhất (CUASOTRUOT)',
  topicNo: 2, // Đoạn con và cộng dồn
  level: 'B',
  source: 'Đề thi chọn HSG Tin học',
  tags: ['Mảng', 'Cửa sổ trượt', 'Sliding window', 'Tối ưu O(N)'],
  task: {
    kind: 'code',
    statement:
      'Cho một dãy số nguyên A gồm N phần tử và một số nguyên dương K (1 <= K <= N).\nHãy tìm tổng lớn nhất của một đoạn gồm K phần tử liên tiếp trong dãy A: max(A_i + A_{i+1} + ... + A_{i+K-1}) với 1 <= i <= N - K + 1.',
    inputFormat:
      'Dòng đầu tiên chứa hai số nguyên dương N và K (1 <= K <= N <= 10^5).\nDòng thứ hai chứa N số nguyên A_1, A_2, ..., A_N (-10^9 <= A_i <= 10^9).',
    outputFormat:
      'In ra một số nguyên duy nhất là tổng lớn nhất của đoạn K phần tử liên tiếp tìm được.',
    constraints:
      '1 <= K <= N <= 10^5; |A_i| <= 10^9; Thời gian chạy: 1.0s',
    ioMode: {
      kind: 'file',
      inputFile: 'CUASOTRUOT.INP',
      outputFile: 'CUASOTRUOT.OUT',
    },
    glossary: [
      {
        term: 'Cửa sổ trượt (Sliding Window)',
        meaning: 'Kỹ thuật duy trì kết quả trên khung độ dài K cố định; khi trượt sang phải, cộng phần tử mới vào và trừ phần tử cũ đi',
      },
    ],
    examples: [
      {
        input: '6 3\n2 1 5 1 3 2',
        output: '9',
        note: 'Các đoạn 3 phần tử: [2, 1, 5] tổng 8; [1, 5, 1] tổng 7; [5, 1, 3] tổng 9; [1, 3, 2] tổng 6 -> Max là 9.',
      },
    ],
    tests: [
      { input: '6 3\n2 1 5 1 3 2', output: '9', label: 'Ví dụ đề bài', isPublic: true, subtask: 1 },
      { input: '4 4\n1 2 3 4', output: '10', label: 'Biên K = N', isPublic: true, subtask: 1 },
      { input: '5 1\n-3 7 2 -5 8', output: '8', label: 'Biên K = 1', isPublic: false, subtask: 1 },
      { input: '5 2\n-10 -20 -5 -30 -1', output: '-25', label: 'Mảng toàn số âm', isPublic: false, subtask: 2 },
      { input: '6 2\n100 0 100 0 100 0', output: '100', label: 'Đan xen', isPublic: false, subtask: 2 },
      { input: '7 3\n4 2 1 7 8 1 2', output: '16', label: 'Cực đại ở giữa [7, 8, 1]', isPublic: false, subtask: 2 },
      { input: '5 3\n0 0 0 0 0', output: '0', label: 'Mảng toàn số 0', isPublic: false, subtask: 2 },
    ],
    subtasks: [
      { id: 1, points: 50, description: 'N <= 1000 (Duyệt trâu O(N * K))' },
      { id: 2, points: 50, description: 'N <= 10^5 (Kỹ thuật cửa sổ trượt O(N))' },
    ],
    analysis: {
      maxN: 'N <= 10^5',
      expectedComplexities: ['O(N) thời gian', 'O(1) bộ nhớ phụ'],
      note: 'Duyệt tính lại tổng K số từ đầu ở mỗi vị trí tốn O(N * K) = 10^10 phép tính khi K = N/2 (gây TLE). Với kỹ thuật cửa sổ trượt, khi dịch chuyển cửa sổ sang phải 1 vị trí, ta chỉ cần: current_sum = current_sum - A[i-K] + A[i] trong O(1).',
    },
    starterCode:
      '# Đọc từ CUASOTRUOT.INP và xuất ra CUASOTRUOT.OUT\nimport sys\n\n# Đọc N, K và mảng A\n# Tính tổng K phần tử đầu tiên, sau đó trượt cửa sổ\n',
    referenceSolution: `import sys

def solve():
    try:
        with open('CUASOTRUOT.INP', 'r') as f:
            data = f.read().split()
    except Exception:
        data = sys.stdin.read().split()

    if not data:
        return

    n = int(data[0])
    k = int(data[1])
    arr = [int(x) for x in data[2:2 + n]]

    # Tính tổng cửa sổ đầu tiên
    curr_sum = sum(arr[:k])
    max_sum = curr_sum

    # Trượt cửa sổ từ vị trí k đến n - 1
    for i in range(k, n):
        curr_sum += arr[i] - arr[i - k]
        if curr_sum > max_sum:
            max_sum = curr_sum

    res = str(max_sum)
    try:
        with open('CUASOTRUOT.OUT', 'w') as f:
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
        id: 'idea-init-first-window',
        description: 'Tính tổng của K phần tử đầu tiên arr[:k] để khởi tạo cửa sổ ban đầu',
        keywords: ['cửa sổ đầu', 'sum(arr[:k])', 'curr_sum'],
      },
      {
        id: 'idea-slide-window-update',
        description: 'Khi dịch cửa sổ sang phải, cập nhật curr_sum += arr[i] - arr[i-k] trong O(1)',
        keywords: ['trượt cửa sổ', 'cộng thêm', 'trừ bớt', 'arr[i] - arr[i-k]', 'O(1)'],
      },
      {
        id: 'idea-track-max-sum',
        description: 'Cập nhật giá trị tổng lớn nhất max_sum qua mỗi bước trượt',
        keywords: ['max_sum', 'cập nhật lớn nhất', 'max(max_sum, curr_sum)'],
      },
    ],
    commonMistakes: [
      'Dùng vòng lặp lồng nhau tính lại tổng K phần tử từ đầu tốn O(N*K) gây TLE',
      'Khởi tạo max_sum = 0 khiến kết quả bị sai khi dãy chứa toàn số âm',
      'Nhầm lẫn chỉ số phần tử bị loại ra khỏi cửa sổ arr[i - k]',
    ],
    hintsByIdea: {
      'idea-init-first-window': [
        'Bậc 1: Bắt đầu bằng việc tính tổng K phần tử đầu tiên từ chỉ số 0 đến K-1.',
        'Bậc 2: Lưu tổng này vào biến curr_sum và đặt max_sum = curr_sum.',
        'Bậc 3: Chú ý: Đừng đặt max_sum = 0 vì các phần tử có thể đều là số âm!',
        'Bậc 4: curr_sum = sum(arr[:k])\nmax_sum = curr_sum',
      ],
      'idea-slide-window-update': [
        'Bậc 1: Khi cửa sổ dịch sang phải 1 bước, nó thêm phần tử nào và mất đi phần tử nào?',
        'Bậc 2: Cửa sổ nhận thêm arr[i] ở bên phải và mất đi phần tử arr[i-k] ở bên trái.',
        'Bậc 3: Thay vì cộng lại K số, chỉ cần lấy tổng cũ: curr_sum += arr[i] - arr[i - k].',
        'Bậc 4: for i in range(k, n):\n    curr_sum += arr[i] - arr[i - k]',
      ],
      'idea-track-max-sum': [
        'Bậc 1: Sau mỗi lần cập nhật tổng cửa sổ, so sánh với max_sum hiện tại.',
        'Bậc 2: Nếu curr_sum > max_sum thì gán max_sum = curr_sum.',
        'Bậc 3: Sau khi duyệt hết mảng, max_sum chính là đáp án cần tìm.',
        'Bậc 4: if curr_sum > max_sum:\n    max_sum = curr_sum',
      ],
    },
  },
  lessonIds: ['algo-sliding-window'],
  simPresets: [
    {
      lessonId: 'algo-sliding-window',
      label: 'Mô phỏng mảng 6 số với k=3',
      input: { arr: '2 1 5 1 3 2', k: '3' },
    },
  ],
};

export default problem;
