import { Problem } from '../core/types.ts';

export const problem: Problem = {
  id: 'xeplich',
  title: 'Xếp lịch hoạt động (XEPLICH)',
  topicNo: 5, // Tham lam và vét cạn
  level: 'C',
  source: 'Đề thi HSG Tin học cấp Tỉnh / Olympic 30/4',
  tags: ['Thuật toán tham lam', 'Greedy', 'Sắp xếp thời gian kết thúc', 'Khoảng thời gian'],
  task: {
    kind: 'code',
    statement:
      'Có N cuộc họp cần được tổ chức tại một hội trường duy nhất. Cuộc họp thứ i bắt đầu tại thời điểm S_i và kết thúc tại thời điểm F_i (S_i < F_i).\nHai cuộc họp được coi là không giao nhau nếu cuộc họp sau bắt đầu sau hoặc đúng lúc cuộc họp trước kết thúc (tức là F_a <= S_b).\nHãy chọn ra số lượng cuộc họp nhiều nhất có thể diễn ra mà không có hai cuộc họp nào bị trùng giờ.',
    inputFormat:
      'Dòng đầu tiên chứa số nguyên dương N (1 <= N <= 10^5).\nN dòng tiếp theo, dòng thứ i chứa hai số nguyên không âm S_i và F_i (0 <= S_i < F_i <= 10^9).',
    outputFormat:
      'In ra một số nguyên duy nhất là số lượng cuộc họp tối đa có thể được tổ chức.',
    constraints:
      '1 <= N <= 10^5; 0 <= S_i < F_i <= 10^9; Thời gian chạy: 1.0s',
    ioMode: {
      kind: 'file',
      inputFile: 'XEPLICH.INP',
      outputFile: 'XEPLICH.OUT',
    },
    glossary: [
      {
        term: 'Chiến lược tham lam (Greedy Choice)',
        meaning: 'Luôn ưu tiên chọn cuộc họp kết thúc sớm nhất còn khả dụng để dành nhiều thời gian nhất cho các cuộc họp phía sau',
      },
      {
        term: 'Sắp xếp theo thời gian kết thúc (F_i)',
        meaning: 'Sắp xếp danh sách cuộc họp tăng dần theo F_i bằng hàm sort(key=lambda x: x[1])',
      },
    ],
    examples: [
      {
        input: '4\n1 4\n3 5\n0 6\n5 7',
        output: '2',
        note: 'Có thể chọn 2 cuộc họp: [1, 4] và [5, 7].',
      },
      {
        input: '3\n1 3\n2 5\n4 6',
        output: '2',
        note: 'Chọn [1, 3] và [4, 6] -> được 2 cuộc họp.',
      },
    ],
    tests: [
      { input: '4\n1 4\n3 5\n0 6\n5 7', output: '2', label: 'Ví dụ 1', isPublic: true, subtask: 1 },
      { input: '3\n1 3\n2 5\n4 6', output: '2', label: 'Ví dụ 2', isPublic: true, subtask: 1 },
      { input: '1\n10 20', output: '1', label: 'Biên 1 cuộc họp', isPublic: true, subtask: 1 },
      { input: '4\n1 2\n2 3\n3 4\n4 5', output: '4', label: 'Các cuộc họp nối đuôi nhau', isPublic: false, subtask: 1 },
      { input: '4\n1 10\n2 9\n3 8\n4 7', output: '1', label: 'Các cuộc họp lồng nhau', isPublic: false, subtask: 2 },
      { input: '5\n1 3\n3 4\n2 6\n5 7\n6 8', output: '3', label: '5 cuộc họp xen kẽ', isPublic: false, subtask: 2 },
      { input: '6\n0 2\n1 4\n3 5\n4 6\n5 8\n7 9', output: '3', label: '6 cuộc họp', isPublic: false, subtask: 2 },
    ],
    subtasks: [
      { id: 1, points: 40, description: 'N <= 20 (Vét cạn thử mọi tập hợp con O(2^N))' },
      { id: 2, points: 60, description: 'N <= 10^5 (Tham lam sắp xếp O(N log N))' },
    ],
    analysis: {
      maxN: 'N <= 10^5',
      expectedComplexities: ['O(N log N) thời gian', 'O(N) bộ nhớ'],
      note: 'Bài toán chọn khoảng thời gian (Interval Scheduling) kinh điển. Chiến lược tối ưu là tham lam chọn cuộc họp kết thúc sớm nhất (F_i nhỏ nhất) còn tương thích với cuộc họp trước đó. Sắp xếp danh sách theo F_i tăng dần tốn O(N log N), sau đó duyệt tuyến tính tốn O(N).',
    },
    starterCode:
      '# Đọc từ XEPLICH.INP và xuất ra XEPLICH.OUT\nimport sys\n\n# Đọc N và danh sách cuộc họp [S_i, F_i]\n# Sắp xếp theo F_i tăng dần và tham lam lựa chọn\n',
    referenceSolution: `import sys

def solve():
    try:
        with open('XEPLICH.INP', 'r') as f:
            data = f.read().split()
    except Exception:
        data = sys.stdin.read().split()

    if not data:
        return

    n = int(data[0])
    meetings = []
    idx = 1
    for _ in range(n):
        if idx >= len(data):
            break
        s = int(data[idx])
        f = int(data[idx + 1])
        meetings.append((s, f))
        idx += 2

    # Sắp xếp theo thời gian kết thúc tăng dần
    meetings.sort(key=lambda x: x[1])

    count = 0
    last_end = -1

    for s, f in meetings:
        if s >= last_end:
            count += 1
            last_end = f

    res = str(count)
    try:
        with open('XEPLICH.OUT', 'w') as out_f:
            out_f.write(res + '\\n')
    except Exception:
        print(res)

if __name__ == '__main__':
    solve()`,
    timeLimitSec: 1,
  },
  rubric: {
    keyIdeas: [
      {
        id: 'idea-greedy-finish-time',
        description: 'Chiến lược tham lam: Luôn ưu tiên chọn cuộc họp có thời điểm kết thúc sớm nhất',
        keywords: ['kết thúc sớm nhất', 'tham lam', 'F_i nhỏ nhất', 'greedy'],
      },
      {
        id: 'idea-sort-by-end',
        description: 'Sắp xếp danh sách cuộc họp tăng dần theo thời điểm kết thúc bằng meetings.sort(key=lambda x: x[1]) trong O(N log N)',
        keywords: ['sort', 'key=lambda', 'thời gian kết thúc', 'O(N log N)'],
      },
      {
        id: 'idea-linear-selection',
        description: 'Duyệt tuần tự: nếu s >= last_end thì chọn cuộc họp đó và cập nhật last_end = f trong O(N)',
        keywords: ['s >= last_end', 'last_end = f', 'duyệt tuyến tính', 'không giao nhau'],
      },
    ],
    commonMistakes: [
      'Sắp xếp theo thời gian bắt đầu (S_i) hoặc độ dài cuộc họp (F_i - S_i) là chiến lược tham lam SAI',
      'Điều kiện không giao nhau để s > last_end thay vì s >= last_end (bỏ lỡ các cuộc họp nối đuôi nhau)',
      'Không dùng hàm đọc nhanh khi N = 10^5',
    ],
    hintsByIdea: {
      'idea-greedy-finish-time': [
        'Bậc 1: Để tổ chức được nhiều cuộc họp nhất, ta nên kết thúc cuộc họp sớm để nhường chỗ cho các cuộc họp sau.',
        'Bậc 2: Tiêu chí chọn tối ưu: cuộc họp kết thúc sớm nhất sẽ giải phóng hội trường sớm nhất.',
        'Bậc 3: Chiến lược tham lam theo thời gian kết thúc đã được chứng minh luôn đạt kết quả tối ưu toàn cục.',
        'Bậc 4: # Chiến lược: Sắp xếp theo F_i tăng dần',
      ],
      'idea-sort-by-end': [
        'Bậc 1: Dùng hàm sort() của Python với tham số key để sắp xếp các cặp (S, F).',
        'Bậc 2: Cú pháp: meetings.sort(key=lambda x: x[1]).',
        'Bậc 3: Độ phức tạp của bước sắp xếp này là O(N log N).',
        'Bậc 4: meetings.sort(key=lambda x: x[1])',
      ],
      'idea-linear-selection': [
        'Bậc 1: Duyệt qua từng cuộc họp đã sắp xếp. Giữ một biến last_end ghi nhớ thời gian kết thúc của cuộc họp vừa chọn.',
        'Bậc 2: Nếu cuộc họp tiếp theo có thời gian bắt đầu s >= last_end thì ta có thể nhận cuộc họp này.',
        'Bậc 3: Khi nhận cuộc họp mới, tăng biến đếm lên 1 và cập nhật last_end = f.',
        'Bậc 4: count = 0\nlast_end = -1\nfor s, f in meetings:\n    if s >= last_end:\n        count += 1\n        last_end = f',
      ],
    },
  },
  lessonIds: ['algo-greedy-scheduling'],
  simPresets: [
    {
      lessonId: 'algo-greedy-scheduling',
      label: 'Mô phỏng 4 cuộc họp [1,4], [3,5], [0,6], [5,7]',
      input: { count: '4', intervals: '1 4, 3 5, 0 6, 5 7' },
    },
  ],
};

export default problem;
