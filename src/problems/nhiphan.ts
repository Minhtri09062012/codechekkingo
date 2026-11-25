import { Problem } from '../core/types.ts';

export const problem: Problem = {
  id: 'nhiphan',
  title: 'Tìm kiếm nhị phân (NHIPHAN)',
  topicNo: 4, // Sắp xếp và tìm kiếm
  level: 'B',
  source: 'Đề thi HSG Tin học',
  tags: ['Mảng đã sắp xếp', 'Tìm kiếm nhị phân', 'Chia để trị', 'O(log N)'],
  task: {
    kind: 'code',
    statement:
      'Cho một dãy số nguyên A gồm N phần tử đã được sắp xếp theo thứ tự không giảm (A_1 <= A_2 <= ... <= A_N) và một số nguyên X.\nHãy tìm vị trí xuất hiện đầu tiên của số X trong dãy A (theo chỉ số từ 1 đến N). Nếu số X không xuất hiện trong dãy A, in ra -1.',
    inputFormat:
      'Dòng đầu tiên chứa hai số nguyên dương N và X (1 <= N <= 10^5, -10^9 <= X <= 10^9).\nDòng thứ hai chứa N số nguyên A_1, A_2, ..., A_N (-10^9 <= A_i <= 10^9).',
    outputFormat:
      'In ra một số nguyên duy nhất là chỉ số (1-based) của phần tử đầu tiên bằng X, hoặc -1 nếu không tìm thấy.',
    constraints:
      '1 <= N <= 10^5; |A_i|, |X| <= 10^9; Dãy A đã sắp xếp tăng dần; Thời gian chạy: 1.0s',
    ioMode: {
      kind: 'file',
      inputFile: 'NHIPHAN.INP',
      outputFile: 'NHIPHAN.OUT',
    },
    glossary: [
      {
        term: 'Tìm kiếm nhị phân (Binary Search)',
        meaning: 'Thuật toán chia đôi phạm vi tìm kiếm [left, right] tại trung điểm mid = (left + right) // 2 để đạt thời gian O(log N)',
      },
    ],
    examples: [
      {
        input: '6 7\n1 3 5 7 9 11',
        output: '4',
        note: 'Số 7 nằm ở vị trí thứ 4 trong dãy.',
      },
      {
        input: '5 6\n1 3 5 7 9',
        output: '-1',
        note: 'Số 6 không có trong dãy A -> in -1.',
      },
    ],
    tests: [
      { input: '6 7\n1 3 5 7 9 11', output: '4', label: 'Ví dụ 1', isPublic: true, subtask: 1 },
      { input: '5 6\n1 3 5 7 9', output: '-1', label: 'Ví dụ 2 (không tìm thấy)', isPublic: true, subtask: 1 },
      { input: '5 1\n1 2 3 4 5', output: '1', label: 'Biên phần tử đầu tiên', isPublic: false, subtask: 1 },
      { input: '5 5\n1 2 3 4 5', output: '5', label: 'Biên phần tử cuối cùng', isPublic: false, subtask: 1 },
      { input: '1 10\n10', output: '1', label: 'Mảng 1 phần tử tìm thấy', isPublic: false, subtask: 2 },
      { input: '1 10\n5', output: '-1', label: 'Mảng 1 phần tử không tìm thấy', isPublic: false, subtask: 2 },
      { input: '6 4\n2 4 4 4 8 10', output: '2', label: 'Nhiều số 4 trùng nhau (lấy vị trí đầu)', isPublic: false, subtask: 2 },
      { input: '5 -5\n-20 -15 -10 -5 0', output: '4', label: 'Số âm', isPublic: false, subtask: 2 },
    ],
    subtasks: [
      { id: 1, points: 50, description: 'N <= 1000 (Tìm kiếm tuyến tính O(N))' },
      { id: 2, points: 50, description: 'N <= 10^5 (Tìm kiếm nhị phân O(log N))' },
    ],
    analysis: {
      maxN: 'N <= 10^5',
      expectedComplexities: ['O(log N) thời gian', 'O(1) bộ nhớ phụ'],
      note: 'Dãy đã được sắp xếp tăng dần, do đó ta áp dụng tìm kiếm nhị phân để thu hẹp không gian tìm kiếm sau mỗi bước còn một nửa. Để lấy vị trí đầu tiên khi có nhiều phần tử bằng X, khi A[mid] == X ta lưu lại kết quả và tiếp tục tìm về phía bên trái (right = mid - 1).',
    },
    starterCode:
      '# Đọc từ NHIPHAN.INP và xuất ra NHIPHAN.OUT\nimport sys\n\n# Đọc N, X và dãy A\n# Cài đặt hàm tìm kiếm nhị phân\n',
    referenceSolution: `import sys

def solve():
    try:
        with open('NHIPHAN.INP', 'r') as f:
            data = f.read().split()
    except Exception:
        data = sys.stdin.read().split()

    if not data:
        return

    n = int(data[0])
    x = int(data[1])
    arr = [int(v) for v in data[2:2 + n]]

    left = 0
    right = n - 1
    ans = -1

    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == x:
            ans = mid + 1  # 1-based index
            right = mid - 1 # Tìm vị trí đầu tiên bên trái
        elif arr[mid] < x:
            left = mid + 1
        else:
            right = mid - 1

    res = str(ans)
    try:
        with open('NHIPHAN.OUT', 'w') as f:
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
        id: 'idea-binary-search-bounds',
        description: 'Khởi tạo hai biên left = 0 và right = n - 1 cho khoảng tìm kiếm',
        keywords: ['left = 0', 'right = n - 1', 'khoảng tìm kiếm', 'hai con trỏ biên'],
      },
      {
        id: 'idea-mid-split-condition',
        description: 'Tính trung điểm mid = (left + right) // 2 và so sánh A[mid] với X',
        keywords: ['mid = (left + right) // 2', 'chia đôi', 'so sánh A[mid]'],
      },
      {
        id: 'idea-first-occurrence',
        description: 'Khi tìm thấy A[mid] == X, ghi nhận vị trí và tiếp tục thu hẹp về bên trái (right = mid - 1)',
        keywords: ['right = mid - 1', 'vị trí đầu tiên', 'ans = mid + 1'],
      },
    ],
    commonMistakes: [
      'Điều kiện vòng lặp while để sai (left < right thay vì left <= right)',
      'Không tìm vị trí đầu tiên khi mảng có nhiều phần tử bằng X',
      'In chỉ số 0-based thay vì 1-based theo yêu cầu đề bài',
    ],
    hintsByIdea: {
      'idea-binary-search-bounds': [
        'Bậc 1: Dãy đã sắp xếp cho phép ta loại bỏ một nửa số phần tử sau mỗi lần so sánh.',
        'Bậc 2: Đặt con trỏ left = 0 ở đầu dãy và right = n - 1 ở cuối dãy.',
        'Bậc 3: Vòng lặp dừng khi left > right.',
        'Bậc 4: left = 0\nright = n - 1\nans = -1\nwhile left <= right:',
      ],
      'idea-mid-split-condition': [
        'Bậc 1: Ở mỗi bước, kiểm tra phần tử ở chính giữa khoảng hiện tại.',
        'Bậc 2: Tính mid = (left + right) // 2.',
        'Bậc 3: Nếu A[mid] < X, X chắc chắn nằm bên phải -> dịch left = mid + 1. Nếu A[mid] > X -> dịch right = mid - 1.',
        'Bậc 4: mid = (left + right) // 2\nif arr[mid] < x:\n    left = mid + 1\nelif arr[mid] > x:\n    right = mid - 1',
      ],
      'idea-first-occurrence': [
        'Bậc 1: Nếu A[mid] == X thì đã xong chưa? Đề bài yêu cầu vị trí xuất hiện đầu tiên!',
        'Bậc 2: Khi A[mid] == X, lưu lại kết quả ans = mid + 1, rồi tiếp tục tìm kiếm ở nửa bên trái.',
        'Bậc 3: Để tìm bên trái, ta gán right = mid - 1.',
        'Bậc 4: if arr[mid] == x:\n    ans = mid + 1\n    right = mid - 1',
      ],
    },
  },
  lessonIds: ['algo-binary-search'],
  simPresets: [
    {
      lessonId: 'algo-binary-search',
      label: 'Mô phỏng tìm x=7 trong mảng [1, 3, 5, 7, 9, 11]',
      input: { arr: '1 3 5 7 9 11', target: '7' },
    },
  ],
};

export default problem;
