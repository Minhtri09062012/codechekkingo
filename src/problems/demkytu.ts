import { Problem } from '../core/types.ts';

export const problem: Problem = {
  id: 'demkytu',
  title: 'Đếm ký tự trong xâu (DEMKYTU)',
  topicNo: 1, // Duyệt và đếm
  level: 'A',
  source: 'Đề thi Tin học trẻ Bảng B',
  tags: ['Xâu ký tự', 'Mảng đếm tần suất', 'Bảng mã ASCII'],
  task: {
    kind: 'code',
    statement:
      'Cho một xâu ký tự S chỉ chứa các chữ cái tiếng Anh in thường (\'a\' đến \'z\').\nHãy đếm số lần xuất hiện của mỗi ký tự có trong xâu và in ra theo thứ tự từ điển (bảng chữ cái), mỗi ký tự cùng số lần xuất hiện trên một dòng, cách nhau bởi dấu cách.',
    inputFormat:
      'Gồm một dòng duy nhất chứa xâu ký tự S (1 <= độ dài S <= 10^5).',
    outputFormat:
      'In ra các dòng, mỗi dòng gồm một chữ cái và tần suất xuất hiện tương ứng, theo thứ tự bảng chữ cái tăng dần.',
    constraints:
      '1 <= len(S) <= 10^5; S chỉ gồm các chữ cái thường a-z; Thời gian chạy: 1.0s',
    ioMode: {
      kind: 'file',
      inputFile: 'DEMKYTU.INP',
      outputFile: 'DEMKYTU.OUT',
    },
    glossary: [
      {
        term: 'Mảng đếm tần suất (Frequency Array)',
        meaning: 'Mảng 26 phần tử ứng với 26 chữ cái \'a\'-\'z\', vị trí i lưu số lần xuất hiện của ký tự chr(ord(\'a\') + i)',
      },
      {
        term: 'ord() và chr()',
        meaning: 'Hàm ord(c) trả về mã ASCII của ký tự c; chr(code) chuyển mã số thành ký tự tương ứng',
      },
    ],
    examples: [
      {
        input: 'codetrekkingpython',
        output: 'c 1\nd 1\ne 2\ng 1\nh 1\ni 1\nk 2\nn 2\no 2\np 1\nr 1\nt 2\ny 1',
        note: 'Các ký tự xuất hiện được liệt kê theo thứ tự a-z kèm số lần đếm.',
      },
    ],
    tests: [
      {
        input: 'codetrekkingpython',
        output: 'c 1\nd 1\ne 2\ng 1\nh 1\ni 1\nk 2\nn 2\no 2\np 1\nr 1\nt 2\ny 1',
        label: 'Ví dụ đề bài',
        isPublic: true,
        subtask: 1,
      },
      { input: 'a', output: 'a 1', label: 'Biên 1 ký tự', isPublic: true, subtask: 1 },
      { input: 'zzzzz', output: 'z 5', label: 'Một loại ký tự lặp', isPublic: false, subtask: 1 },
      {
        input: 'abcdefghijklmnopqrstuvwxyz',
        output:
          'a 1\nb 1\nc 1\nd 1\ne 1\nf 1\ng 1\nh 1\ni 1\nj 1\nk 1\nl 1\nm 1\nn 1\no 1\np 1\nq 1\nr 1\ns 1\nt 1\nu 1\nv 1\nw 1\nx 1\ny 1\nz 1',
        label: 'Đầy đủ 26 chữ cái',
        isPublic: false,
        subtask: 2,
      },
      { input: 'tinhtinh', output: 'h 2\ni 2\nn 2\nt 2', label: 'Xâu có từ trùng lặp', isPublic: false, subtask: 2 },
      { input: 'banana', output: 'a 3\nb 1\nn 2', label: 'Từ banana', isPublic: false, subtask: 2 },
      { input: 'mississippi', output: 'i 4\nm 1\np 2\ns 4', label: 'Từ mississippi', isPublic: false, subtask: 2 },
    ],
    subtasks: [
      { id: 1, points: 50, description: 'Độ dài S <= 1000' },
      { id: 2, points: 50, description: 'Độ dài S <= 10^5' },
    ],
    analysis: {
      maxN: 'len(S) <= 10^5',
      expectedComplexities: ['O(N) thời gian', 'O(26) = O(1) bộ nhớ phụ'],
      note: 'Duyệt xâu S một lần duy nhất với O(N). Dùng mảng đếm count = [0] * 26 hoặc từ điển dict đếm tần suất. Sau đó duyệt từ a đến z in kết quả, tổng thời gian O(N + 26) = O(N).',
    },
    starterCode:
      '# Đọc từ DEMKYTU.INP và xuất ra DEMKYTU.OUT\nimport sys\n\n# Đọc xâu S\n# Khởi tạo mảng đếm 26 phần tử và duyệt xâu\n',
    referenceSolution: `import sys

def solve():
    try:
        with open('DEMKYTU.INP', 'r') as f:
            s = f.read().strip()
    except Exception:
        s = sys.stdin.read().strip()

    if not s:
        return

    # Mảng đếm tần suất cho 26 chữ cái a-z
    cnt = [0] * 26
    for ch in s:
        if 'a' <= ch <= 'z':
            cnt[ord(ch) - ord('a')] += 1

    out = []
    for i in range(26):
        if cnt[i] > 0:
            char = chr(ord('a') + i)
            out.append(f"{char} {cnt[i]}")

    res = '\\n'.join(out)
    try:
        with open('DEMKYTU.OUT', 'w') as f:
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
        id: 'idea-frequency-array',
        description: 'Khởi tạo mảng đếm 26 phần tử đại diện cho các chữ cái từ a đến z',
        keywords: ['mảng đếm', 'cnt = [0] * 26', 'tần suất', '26 chữ cái'],
      },
      {
        id: 'idea-ascii-mapping',
        description: 'Chuyển đổi ký tự sang chỉ số mảng bằng công thức ord(ch) - ord(\'a\')',
        keywords: ['ord(ch) - ord(\'a\')', 'ASCII', 'ánh xạ chỉ số'],
      },
      {
        id: 'idea-sorted-output',
        description: 'Duyệt qua 26 ký tự theo thứ tự bảng chữ cái và in các ký tự có tần suất > 0',
        keywords: ['thứ tự từ điển', 'cnt[i] > 0', 'chr(ord(\'a\') + i)'],
      },
    ],
    commonMistakes: [
      'Dùng s.count(ch) trong vòng lặp gây độ phức tạp O(N^2) dẫn đến quá thời gian',
      'In ra cả các ký tự không có mặt trong xâu (tần suất = 0)',
      'Không sắp xếp theo đúng thứ tự bảng chữ cái tiếng Anh',
    ],
    hintsByIdea: {
      'idea-frequency-array': [
        'Bậc 1: Vì chỉ có 26 chữ cái in thường \'a\' đến \'z\', em có thể dùng một mảng kích thước cố định 26 để đếm.',
        'Bậc 2: Khởi tạo cnt = [0] * 26, trong đó cnt[0] đếm chữ \'a\', cnt[1] đếm \'b\', ..., cnt[25] đếm \'z\'.',
        'Bậc 3: Khi duyệt qua mỗi ký tự, chỉ cần tăng phần tử tương ứng lên 1.',
        'Bậc 4: cnt = [0] * 26\nfor ch in s:\n    cnt[ord(ch) - ord(\'a\')] += 1',
      ],
      'idea-ascii-mapping': [
        'Bậc 1: Làm sao biến chữ \'a\' thành số 0, \'b\' thành số 1, ..., \'z\' thành số 25?',
        'Bậc 2: Dùng hàm ord() trong Python để lấy mã ASCII: ord(\'a\') = 97, ord(\'b\') = 98...',
        'Bậc 3: Lấy ord(ch) - ord(\'a\') ta sẽ được chỉ số chính xác từ 0 đến 25.',
        'Bậc 4: idx = ord(ch) - ord(\'a\')',
      ],
      'idea-sorted-output': [
        'Bậc 1: Sau khi đếm xong, làm sao in theo đúng thứ tự từ điển?',
        'Bậc 2: Duyệt vòng lặp i từ 0 đến 25, nếu cnt[i] > 0 thì in ra.',
        'Bậc 3: Chuyển lại chỉ số i thành ký tự bằng hàm chr(ord(\'a\') + i).',
        'Bậc 4: for i in range(26):\n    if cnt[i] > 0:\n        print(chr(ord(\'a\') + i), cnt[i])',
      ],
    },
  },
  lessonIds: ['algo-frequency-array', 'concept-strings-ascii'],
  simPresets: [
    {
      lessonId: 'algo-frequency-array',
      label: 'Mô phỏng mảng đếm tần suất',
      input: { arr: '2 1 2 3 1' },
    },
  ],
};

export default problem;
