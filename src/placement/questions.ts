import { TestCase } from '../core/types.ts';

export interface PredictQuestion {
  id: string;
  topicNo: number;
  kind: 'predict';
  title: string;
  promptText: string;
  code: string;
  input: string;
  expectedOutput: string;
  explanation: string;
  sourceId?: string;
}

export interface CodeQuestion {
  id: string;
  topicNo: number;
  kind: 'code';
  title: string;
  statement: string;
  inputFormat: string;
  outputFormat: string;
  starterCode: string;
  referenceSolution: string;
  tests: TestCase[];
  explanation: string;
  sourceId?: string;
}

export type PlacementQuestion = PredictQuestion | CodeQuestion;

export interface TopicQuestions {
  topicNo: number;
  topicName: string;
  predictQuestion: PredictQuestion;
  codeQuestion: CodeQuestion;
}

export const placementQuestions: TopicQuestions[] = [
  // ==========================================
  // CHUYÊN ĐỀ 1: DUYỆT VÀ ĐẾM
  // ==========================================
  {
    topicNo: 1,
    topicName: 'Duyệt và đếm',
    predictQuestion: {
      id: 'placement-t1-predict',
      topicNo: 1,
      kind: 'predict',
      title: 'Dự đoán giá trị lớn nhất trong mảng',
      promptText: 'Đọc đoạn mã Python sau và cho biết màn hình sẽ in ra kết quả gì khi chạy với dữ liệu vào đã cho.',
      code: `arr = [4, 15, 8, 23, 7]
best = arr[0]
for x in arr:
    if x > best:
        best = x
print(best)`,
      input: '',
      expectedOutput: '23',
      explanation: 'Vòng lặp duyệt qua mảng arr, so sánh từng phần tử với biến lính canh best. Phần tử lớn nhất là 23.',
      sourceId: 'algo-min-max',
    },
    codeQuestion: {
      id: 'placement-t1-code',
      topicNo: 1,
      kind: 'code',
      title: 'Đếm số lượng số chẵn trong dãy',
      statement: 'Cho một dãy số nguyên gồm N phần tử. Hãy đếm xem có bao nhiêu số chẵn trong dãy.',
      inputFormat: 'Dòng 1 chứa số nguyên N (1 <= N <= 1000).\\nDòng 2 chứa N số nguyên cách nhau bởi dấu cách.',
      outputFormat: 'In ra một số nguyên duy nhất là số lượng số chẵn tìm được.',
      starterCode: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    arr = [int(x) for x in data[1:1+n]]
    # Viết code đếm số chẵn ở đây
    
if __name__ == '__main__':
    solve()`,
      referenceSolution: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    arr = [int(x) for x in data[1:1+n]]
    ans = sum(1 for x in arr if x % 2 == 0)
    print(ans)

if __name__ == '__main__':
    solve()`,
      tests: [
        { input: '5\n1 2 3 4 6', output: '3', label: 'Ví dụ mẫu', isPublic: true },
        { input: '4\n1 3 5 7', output: '0', label: 'Toàn số lẻ', isPublic: true },
        { input: '4\n2 4 8 10', output: '4', label: 'Toàn số chẵn', isPublic: false },
        { input: '1\n0', output: '1', label: 'Số 0', isPublic: false },
        { input: '6\n-2 -3 4 5 0 8', output: '4', label: 'Số âm và 0', isPublic: false },
      ],
      explanation: 'Duyệt qua danh sách và kiểm tra điều kiện x % 2 == 0, tăng biến đếm nếu thỏa mãn.',
      sourceId: 'demkytu',
    },
  },

  // ==========================================
  // CHUYÊN ĐỀ 2: ĐOẠN CON VÀ CỘNG DỒN
  // ==========================================
  {
    topicNo: 2,
    topicName: 'Đoạn con và cộng dồn',
    predictQuestion: {
      id: 'placement-t2-predict',
      topicNo: 2,
      kind: 'predict',
      title: 'Dự đoán tổng cửa sổ trượt độ dài K',
      promptText: 'Đoạn mã sau tính tổng lớn nhất của 3 phần tử liên tiếp. Hãy dự đoán kết quả in ra màn hình.',
      code: `arr = [2, 1, 5, 1, 3, 2]
k = 3
curr_sum = sum(arr[:k]) # 2 + 1 + 5 = 8
max_sum = curr_sum

for i in range(k, len(arr)):
    curr_sum += arr[i] - arr[i - k]
    if curr_sum > max_sum:
        max_sum = curr_sum

print(max_sum)`,
      input: '',
      expectedOutput: '9',
      explanation: 'Các đoạn 3 phần tử: [2, 1, 5]=8, [1, 5, 1]=7, [5, 1, 3]=9, [1, 3, 2]=6. Giá trị lớn nhất là 9.',
      sourceId: 'cuasotruot',
    },
    codeQuestion: {
      id: 'placement-t2-code',
      topicNo: 2,
      kind: 'code',
      title: 'Tính tổng đoạn con từ L đến R',
      statement: 'Cho một dãy số nguyên A gồm N phần tử (đánh số từ 1 đến N). Hãy tính tổng các phần tử từ chỉ số L đến R (1 <= L <= R <= N).',
      inputFormat: 'Dòng 1: Ba số nguyên N, L, R (1 <= N <= 1000, 1 <= L <= R <= N).\\nDòng 2: N số nguyên A_1, A_2, ..., A_N.',
      outputFormat: 'In ra một số nguyên duy nhất là tổng các phần tử từ L đến R.',
      starterCode: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n, l, r = int(data[0]), int(data[1]), int(data[2])
    arr = [int(x) for x in data[3:3+n]]
    # Tính tổng từ l đến r (chỉ số 1-based)

if __name__ == '__main__':
    solve()`,
      referenceSolution: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n, l, r = int(data[0]), int(data[1]), int(data[2])
    arr = [int(x) for x in data[3:3+n]]
    sub_sum = sum(arr[l-1:r])
    print(sub_sum)

if __name__ == '__main__':
    solve()`,
      tests: [
        { input: '5 2 4\n1 3 5 7 9', output: '15', label: 'Đoạn từ 2 đến 4: 3+5+7=15', isPublic: true },
        { input: '4 1 4\n2 4 6 8', output: '20', label: 'Toàn bộ mảng', isPublic: true },
        { input: '5 3 3\n10 20 30 40 50', output: '30', label: 'Một phần tử L=R', isPublic: false },
        { input: '6 1 3\n-5 10 -2 8 4 1', output: '3', label: 'Chứa số âm', isPublic: false },
      ],
      explanation: 'Sử dụng mảng cộng dồn hoặc cắt lát arr[l-1:r] để tính tổng.',
      sourceId: 'tongdoan',
    },
  },

  // ==========================================
  // CHUYÊN ĐỀ 3: SỐ HỌC
  // ==========================================
  {
    topicNo: 3,
    topicName: 'Số học',
    predictQuestion: {
      id: 'placement-t3-predict',
      topicNo: 3,
      kind: 'predict',
      title: 'Thuật toán Euclid tìm UCLN',
      promptText: 'Đọc hàm tìm ước chung lớn nhất (UCLN) sau và dự đoán giá trị in ra.',
      code: `def gcd(a, b):
    while b != 0:
        a, b = b, a % b
    return a

print(gcd(48, 18))`,
      input: '',
      expectedOutput: '6',
      explanation: '48 % 18 = 12 -> gcd(18, 12); 18 % 12 = 6 -> gcd(12, 6); 12 % 6 = 0 -> gcd(6, 0) = 6.',
      sourceId: 'algo-gcd-lcm',
    },
    codeQuestion: {
      id: 'placement-t3-code',
      topicNo: 3,
      kind: 'code',
      title: 'Kiểm tra số nguyên tố',
      statement: 'Nhập vào một số nguyên dương N. Kiểm tra xem N có phải là số nguyên tố hay không. In ra "YES" nếu là số nguyên tố, ngược lại in "NO".',
      inputFormat: 'Gồm một dòng duy nhất chứa số nguyên dương N (1 <= N <= 10^9).',
      outputFormat: 'In ra "YES" hoặc "NO".',
      starterCode: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    # Viết hàm kiểm tra số nguyên tố

if __name__ == '__main__':
    solve()`,
      referenceSolution: `import sys

def is_prime(n):
    if n < 2:
        return False
    if n in (2, 3):
        return True
    if n % 2 == 0 or n % 3 == 0:
        return False
    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i + 2) == 0:
            return False
        i += 6
    return True

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    if is_prime(n):
        print("YES")
    else:
        print("NO")

if __name__ == '__main__':
    solve()`,
      tests: [
        { input: '7', output: 'YES', label: 'Số 7', isPublic: true },
        { input: '1', output: 'NO', label: 'Số 1 không phải nguyên tố', isPublic: true },
        { input: '4', output: 'NO', label: 'Số hợp số 4', isPublic: false },
        { input: '97', output: 'YES', label: 'Số nguyên tố 97', isPublic: false },
        { input: '1000000007', output: 'YES', label: 'Số nguyên tố lớn', isPublic: false },
      ],
      explanation: 'Duyệt các ước số đến căn bậc 2 của N để kiểm tra tính nguyên tố trong O(√N).',
      sourceId: 'sodb',
    },
  },

  // ==========================================
  // CHUYÊN ĐỀ 4: SẮP XẾP VÀ TÌM KIẾM
  // ==========================================
  {
    topicNo: 4,
    topicName: 'Sắp xếp và tìm kiếm',
    predictQuestion: {
      id: 'placement-t4-predict',
      topicNo: 4,
      kind: 'predict',
      title: 'Tìm kiếm nhị phân trên dãy tăng dần',
      promptText: 'Đoạn mã sau thực hiện tìm kiếm nhị phân để tìm vị trí (chỉ số 0-based) của x = 7.',
      code: `arr = [2, 4, 7, 10, 15, 20]
x = 7
left = 0
right = len(arr) - 1
found_idx = -1

while left <= right:
    mid = (left + right) // 2
    if arr[mid] == x:
        found_idx = mid
        break
    elif arr[mid] < x:
        left = mid + 1
    else:
        right = mid - 1

print(found_idx)`,
      input: '',
      expectedOutput: '2',
      explanation: 'Vòng 1: left=0, right=5, mid=2. arr[2] = 7 == x -> found_idx = 2, dừng vòng lặp.',
      sourceId: 'nhiphan',
    },
    codeQuestion: {
      id: 'placement-t4-code',
      topicNo: 4,
      kind: 'code',
      title: 'Sắp xếp dãy số tăng dần',
      statement: 'Cho một dãy gồm N số nguyên. Hãy sắp xếp dãy số theo thứ tự không giảm và in ra kết quả.',
      inputFormat: 'Dòng 1: Số nguyên N (1 <= N <= 10^5).\\nDòng 2: N số nguyên cách nhau bởi dấu cách.',
      outputFormat: 'In ra N số sau khi sắp xếp trên một dòng, cách nhau bởi dấu cách.',
      starterCode: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    arr = [int(x) for x in data[1:1+n]]
    # Sắp xếp và in kết quả

if __name__ == '__main__':
    solve()`,
      referenceSolution: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    arr = [int(x) for x in data[1:1+n]]
    arr.sort()
    print(' '.join(map(str, arr)))

if __name__ == '__main__':
    solve()`,
      tests: [
        { input: '5\n5 2 9 1 5', output: '1 2 5 5 9', label: 'Ví dụ mẫu', isPublic: true },
        { input: '3\n1 2 3', output: '1 2 3', label: 'Đã sắp xếp', isPublic: true },
        { input: '4\n-3 10 -8 0', output: '-8 -3 0 10', label: 'Có số âm', isPublic: false },
        { input: '1\n42', output: '42', label: 'Một phần tử', isPublic: false },
      ],
      explanation: 'Sử dụng Timsort tích hợp của Python arr.sort() với độ phức tạp O(N log N).',
      sourceId: 'algo-merge-sort',
    },
  },

  // ==========================================
  // CHUYÊN ĐỀ 5: THAM LAM VÀ VÉT CẠN
  // ==========================================
  {
    topicNo: 5,
    topicName: 'Tham lam và vét cạn',
    predictQuestion: {
      id: 'placement-t5-predict',
      topicNo: 5,
      kind: 'predict',
      title: 'Chiến thuật tham lam xếp lịch cuộc họp',
      promptText: 'Thuật toán sắp xếp các cuộc họp theo giờ kết thúc tăng dần và chọn cuộc họp không bị trùng. Hãy dự đoán số cuộc họp chọn được.',
      code: `meetings = [(1, 3), (2, 5), (3, 6), (5, 8)]
meetings.sort(key=lambda x: x[1])

count = 0
last_end = 0

for start, end in meetings:
    if start >= last_end:
        count += 1
        last_end = end

print(count)`,
      input: '',
      expectedOutput: '2',
      explanation: 'Chọn (1, 3) -> last_end=3. Cuộc họp (2, 5) trùng. Chọn (3, 6) -> last_end=6. Cuộc họp (5, 8) trùng. Tổng cộng chọn được 2 cuộc họp: (1, 3) và (3, 6).',
      sourceId: 'xeplich',
    },
    codeQuestion: {
      id: 'placement-t5-code',
      topicNo: 5,
      kind: 'code',
      title: 'Đổi tiền xu tối ưu (Tham lam)',
      statement: 'Có các loại tiền xu mệnh giá 10, 5, 2, 1. Cho số tiền cần đổi S. Hãy tìm số lượng đồng xu ít nhất để đổi được đúng số tiền S.',
      inputFormat: 'Gồm một dòng chứa số nguyên dương S (1 <= S <= 10^9).',
      outputFormat: 'In ra số lượng đồng xu ít nhất.',
      starterCode: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    s = int(data[0])
    # Đổi tiền với các mệnh giá [10, 5, 2, 1]

if __name__ == '__main__':
    solve()`,
      referenceSolution: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    s = int(data[0])
    coins = [10, 5, 2, 1]
    ans = 0
    for c in coins:
        ans += s // c
        s %= c
    print(ans)

if __name__ == '__main__':
    solve()`,
      tests: [
        { input: '28', output: '5', label: '28 = 10*2 + 5*1 + 2*1 + 1*1 (5 xu)', isPublic: true },
        { input: '10', output: '1', label: '10 = 10*1', isPublic: true },
        { input: '7', output: '2', label: '7 = 5 + 2', isPublic: false },
        { input: '100', output: '10', label: '100 = 10*10', isPublic: false },
      ],
      explanation: 'Hệ tiền tệ chuẩn ưu tiên lấy các mệnh giá lớn nhất trước bằng phép chia nguyên và chia dư.',
      sourceId: 'algo-greedy-coin-change',
    },
  },

  // ==========================================
  // CHUYÊN ĐỀ 6: QUY HOẠCH ĐỘNG
  // ==========================================
  {
    topicNo: 6,
    topicName: 'Quy hoạch động',
    predictQuestion: {
      id: 'placement-t6-predict',
      topicNo: 6,
      kind: 'predict',
      title: 'Dãy số Fibonacci bằng mảng nhớ',
      promptText: 'Đoạn mã sau tính số Fibonacci thứ n bằng bảng nhớ. Hãy dự đoán giá trị in ra.',
      code: `n = 6
dp = [0] * (n + 1)
dp[0] = 0
dp[1] = 1

for i in range(2, n + 1):
    dp[i] = dp[i - 1] + dp[i - 2]

print(dp[n])`,
      input: '',
      expectedOutput: '8',
      explanation: 'Dãy Fibonacci: dp[0]=0, dp[1]=1, dp[2]=1, dp[3]=2, dp[4]=3, dp[5]=5, dp[6]=8.',
      sourceId: 'algo-dp-fibonacci-memo',
    },
    codeQuestion: {
      id: 'placement-t6-code',
      topicNo: 6,
      kind: 'code',
      title: 'Bước thang quy hoạch động',
      statement: 'Một cầu thang có N bậc. Mỗi lần em có thể bước 1 bậc hoặc 2 bậc. Hãy tính số cách khác nhau để bước lên bậc thứ N.',
      inputFormat: 'Gồm một dòng chứa số nguyên N (1 <= N <= 40).',
      outputFormat: 'In ra số cách bước lên bậc N.',
      starterCode: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    # Quy hoạch động: f(n) = f(n-1) + f(n-2)

if __name__ == '__main__':
    solve()`,
      referenceSolution: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    if n <= 1:
        print(1)
        return
    dp = [0] * (n + 1)
    dp[0] = 1
    dp[1] = 1
    for i in range(2, n + 1):
        dp[i] = dp[i-1] + dp[i-2]
    print(dp[n])

if __name__ == '__main__':
    solve()`,
      tests: [
        { input: '3', output: '3', label: 'N=3: (1+1+1, 1+2, 2+1)', isPublic: true },
        { input: '1', output: '1', label: 'N=1: (1)', isPublic: true },
        { input: '4', output: '5', label: 'N=4', isPublic: false },
        { input: '10', output: '89', label: 'N=10', isPublic: false },
      ],
      explanation: 'Hệ thức truy hồi quy hoạch động: dp[i] = dp[i-1] + dp[i-2] với dp[0]=1, dp[1]=1.',
      sourceId: 'algo-dp-fibonacci-memo',
    },
  },

  // ==========================================
  // CHUYÊN ĐỀ 7: ĐỒ THỊ
  // ==========================================
  {
    topicNo: 7,
    topicName: 'Đồ thị',
    predictQuestion: {
      id: 'placement-t7-predict',
      topicNo: 7,
      kind: 'predict',
      title: 'Bậc của đỉnh trong đồ thị vô hướng',
      promptText: 'Đoạn mã sau xây dựng danh sách kề cho đồ thị 4 đỉnh và tính bậc (số đỉnh kề) của đỉnh 1.',
      code: `n = 4
adj = {i: [] for i in range(1, n + 1)}
edges = [(1, 2), (1, 3), (2, 3), (3, 4)]

for u, v in edges:
    adj[u].append(v)
    adj[v].append(u)

print(len(adj[1]))`,
      input: '',
      expectedOutput: '2',
      explanation: 'Các cạnh nối với đỉnh 1 là (1, 2) và (1, 3). Do đó bậc của đỉnh 1 là 2.',
      sourceId: 'concept-graph-representations',
    },
    codeQuestion: {
      id: 'placement-t7-code',
      topicNo: 7,
      kind: 'code',
      title: 'Đếm số cạnh nối với đỉnh K',
      statement: 'Cho đồ thị vô hướng gồm N đỉnh và M cạnh. Đếm xem có bao nhiêu cạnh nối trực tiếp với đỉnh K.',
      inputFormat: 'Dòng 1: Ba số nguyên N, M, K (1 <= N <= 1000, 0 <= M <= 5000, 1 <= K <= N).\\nM dòng tiếp theo, mỗi dòng chứa hai số u, v là một cạnh.',
      outputFormat: 'In ra số lượng cạnh nối trực tiếp với đỉnh K.',
      starterCode: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n, m, k = int(data[0]), int(data[1]), int(data[2])
    # Đếm số cạnh nối với đỉnh k

if __name__ == '__main__':
    solve()`,
      referenceSolution: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n, m, k = int(data[0]), int(data[1]), int(data[2])
    idx = 3
    deg = 0
    for _ in range(m):
        u = int(data[idx])
        v = int(data[idx+1])
        idx += 2
        if u == k or v == k:
            deg += 1
    print(deg)

if __name__ == '__main__':
    solve()`,
      tests: [
        { input: '4 4 1\n1 2\n1 3\n2 3\n3 4', output: '2', label: 'Đỉnh 1 có 2 cạnh kề', isPublic: true },
        { input: '3 2 3\n1 2\n2 3', output: '1', label: 'Đỉnh 3 có 1 cạnh kề', isPublic: true },
        { input: '4 1 4\n1 2', output: '0', label: 'Đỉnh 4 không có cạnh nào', isPublic: false },
      ],
      explanation: 'Duyệt qua danh sách cạnh và tăng biến đếm nếu u == k hoặc v == k.',
      sourceId: 'concept-graph-representations',
    },
  },

  // ==========================================
  // CHUYÊN ĐỀ 8: CẤU TRÚC DỮ LIỆU
  // ==========================================
  {
    topicNo: 8,
    topicName: 'Cấu trúc dữ liệu',
    predictQuestion: {
      id: 'placement-t8-predict',
      topicNo: 8,
      kind: 'predict',
      title: 'Hoạt động vào sau ra trước (LIFO) của Ngăn xếp',
      promptText: 'Đọc chuỗi thao tác push và pop trên ngăn xếp stack sau và dự đoán giá trị trên đỉnh ngăn xếp.',
      code: `stack = []
stack.append(10)
stack.append(20)
stack.pop()
stack.append(30)
stack.append(40)
stack.pop()

print(stack[-1])`,
      input: '',
      expectedOutput: '30',
      explanation: 'Push 10 -> [10]; Push 20 -> [10, 20]; Pop -> [10]; Push 30 -> [10, 30]; Push 40 -> [10, 30, 40]; Pop -> [10, 30]. Đỉnh stack là 30.',
      sourceId: 'concept-stack-data-structure',
    },
    codeQuestion: {
      id: 'placement-t8-code',
      topicNo: 8,
      kind: 'code',
      title: 'Kiểm tra dãy ngoặc tròn hợp lệ',
      statement: 'Cho một chuỗi S chỉ gồm các ký tự mở ngoặc "(" và đóng ngoặc ")". Kiểm tra xem chuỗi có phải là dãy ngoặc đúng hay không. In ra "YES" nếu đúng, ngược lại in "NO".',
      inputFormat: 'Gồm một dòng chứa chuỗi S (1 <= độ dài S <= 10^5).',
      outputFormat: 'In ra "YES" hoặc "NO".',
      starterCode: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    s = data[0]
    # Kiểm tra dãy ngoặc đúng

if __name__ == '__main__':
    solve()`,
      referenceSolution: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    s = data[0]
    balance = 0
    for ch in s:
        if ch == '(':
            balance += 1
        elif ch == ')':
            balance -= 1
            if balance < 0:
                print("NO")
                return
    if balance == 0:
        print("YES")
    else:
        print("NO")

if __name__ == '__main__':
    solve()`,
      tests: [
        { input: '(())()', output: 'YES', label: 'Ngoặc đúng', isPublic: true },
        { input: ')(', output: 'NO', label: 'Đóng trước mở', isPublic: true },
        { input: '(()', output: 'NO', label: 'Thừa mở', isPublic: false },
        { input: '((()()))', output: 'YES', label: 'Lồng nhau', isPublic: false },
      ],
      explanation: 'Sử dụng biến đếm độ mở balance (hoặc stack): mở thì cộng 1, đóng thì trừ 1; nếu âm hoặc kết thúc khác 0 thì sai.',
      sourceId: 'concept-stack-data-structure',
    },
  },

  // ==========================================
  // CHUYÊN ĐỀ 9: ĐỆ QUY VÀ QUAY LUI
  // ==========================================
  {
    topicNo: 9,
    topicName: 'Đệ quy và Quay lui',
    predictQuestion: {
      id: 'placement-t9-predict',
      topicNo: 9,
      kind: 'predict',
      title: 'Lời gọi hàm đệ quy tính tổng',
      promptText: 'Đoạn mã sau tính tổng các số từ 1 đến n bằng đệ quy. Hãy dự đoán giá trị in ra.',
      code: `def sum_rec(n):
    if n <= 1:
        return 1
    return n + sum_rec(n - 1)

print(sum_rec(5))`,
      input: '',
      expectedOutput: '15',
      explanation: '5 + 4 + 3 + 2 + 1 = 15.',
      sourceId: 'concept-recursion',
    },
    codeQuestion: {
      id: 'placement-t9-code',
      topicNo: 9,
      kind: 'code',
      title: 'Tính giai thừa N! bằng đệ quy',
      statement: 'Nhập vào số nguyên không âm N (0 <= N <= 12). Hãy tính giá trị của N! = 1 * 2 * ... * N (quy ước 0! = 1).',
      inputFormat: 'Gồm một dòng chứa số nguyên N (0 <= N <= 12).',
      outputFormat: 'In ra một số nguyên là N!.',
      starterCode: `import sys

def fact(n):
    # Viết hàm đệ quy tính giai thừa
    pass

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    print(fact(n))

if __name__ == '__main__':
    solve()`,
      referenceSolution: `import sys

def fact(n):
    if n <= 1:
        return 1
    return n * fact(n - 1)

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    print(fact(n))

if __name__ == '__main__':
    solve()`,
      tests: [
        { input: '5', output: '120', label: '5! = 120', isPublic: true },
        { input: '0', output: '1', label: '0! = 1', isPublic: true },
        { input: '1', output: '1', label: '1! = 1', isPublic: false },
        { input: '6', output: '720', label: '6! = 720', isPublic: false },
      ],
      explanation: 'Cơ sở đệ quy: if n <= 1 return 1. Bước đệ quy: return n * fact(n - 1).',
      sourceId: 'concept-recursion',
    },
  },

  // ==========================================
  // CHUYÊN ĐỀ 10: XÂU KÝ TỰ VÀ BẢNG BĂM
  // ==========================================
  {
    topicNo: 10,
    topicName: 'Xâu ký tự và Bảng băm',
    predictQuestion: {
      id: 'placement-t10-predict',
      topicNo: 10,
      kind: 'predict',
      title: 'Đếm ký tự phân biệt bằng tập hợp set',
      promptText: 'Đọc đoạn mã xử lý chuỗi sau và dự đoán số lượng ký tự phân biệt in ra.',
      code: `s = "laptrinhpython"
unique_chars = set(s)
print(len(unique_chars))`,
      input: '',
      expectedOutput: '10',
      explanation: 'Các ký tự trong "laptrinhpython" gồm 10 ký tự phân biệt: l, a, p, t, r, i, n, h, y, o (p, t, h, n lặp lại).',
      sourceId: 'concept-dict-frequencies',
    },
    codeQuestion: {
      id: 'placement-t10-code',
      topicNo: 10,
      kind: 'code',
      title: 'Đếm tần suất ký tự trong xâu',
      statement: 'Cho một xâu ký tự S chỉ gồm chữ cái thường và một ký tự C. Hãy đếm số lần ký tự C xuất hiện trong xâu S.',
      inputFormat: 'Dòng 1: Xâu ký tự S (1 <= độ dài S <= 10^5).\\nDòng 2: Ký tự C.',
      outputFormat: 'In ra số lần xuất hiện của C trong S.',
      starterCode: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    s = data[0]
    c = data[1]
    # Đếm số lần c xuất hiện trong s

if __name__ == '__main__':
    solve()`,
      referenceSolution: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    s = data[0]
    c = data[1]
    print(s.count(c))

if __name__ == '__main__':
    solve()`,
      tests: [
        { input: 'codetrek c', output: '1', label: 'Ký tự c trong codetrek', isPublic: true },
        { input: 'banana a', output: '3', label: '3 chữ a trong banana', isPublic: true },
        { input: 'tin_hoc_tre z', output: '0', label: 'Không xuất hiện', isPublic: false },
      ],
      explanation: 'Sử dụng phương thức s.count(c) hoặc duyệt chuỗi so sánh ký tự.',
      sourceId: 'concept-strings-ascii',
    },
  },

  // ==========================================
  // CHUYÊN ĐỀ 11: KỸ THUẬT NÂNG CAO & BITMASK
  // ==========================================
  {
    topicNo: 11,
    topicName: 'Kỹ thuật nâng cao & Bitmask',
    predictQuestion: {
      id: 'placement-t11-predict',
      topicNo: 11,
      kind: 'predict',
      title: 'Phép toán bit AND và dịch bit',
      promptText: 'Đoạn mã sau thực hiện phép toán bit AND. Hãy dự đoán giá trị in ra màn hình.',
      code: `a = 12 # 1100 nhị phân
b = 10 # 1010 nhị phân
result = a & b
print(result)`,
      input: '',
      expectedOutput: '8',
      explanation: '1100 & 1010 = 1000 nhị phân = 8 trong hệ thập phân.',
      sourceId: 'concept-number-bases-bitwise',
    },
    codeQuestion: {
      id: 'placement-t11-code',
      topicNo: 11,
      kind: 'code',
      title: 'Đếm số lượng bit 1 trong biểu diễn nhị phân',
      statement: 'Cho một số nguyên dương N. Hãy đếm xem có bao nhiêu chữ số 1 trong biểu diễn nhị phân của N.',
      inputFormat: 'Gồm một dòng chứa số nguyên dương N (1 <= N <= 10^9).',
      outputFormat: 'In ra số lượng bit 1.',
      starterCode: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    # Đếm số lượng bit 1

if __name__ == '__main__':
    solve()`,
      referenceSolution: `import sys

def solve():
    data = sys.stdin.read().split()
    if not data:
        return
    n = int(data[0])
    print(bin(n).count('1'))

if __name__ == '__main__':
    solve()`,
      tests: [
        { input: '7', output: '3', label: '7 = 111 (3 bit 1)', isPublic: true },
        { input: '16', output: '1', label: '16 = 10000 (1 bit 1)', isPublic: true },
        { input: '1', output: '1', label: '1 = 1', isPublic: false },
        { input: '255', output: '8', label: '255 = 11111111 (8 bit 1)', isPublic: false },
      ],
      explanation: 'Sử dụng bin(n).count("1") hoặc vòng lặp n = n & (n - 1) Brian Kernighan.',
      sourceId: 'concept-number-bases-bitwise',
    },
  },
];

export function getTopicQuestions(topicNo: number): TopicQuestions | undefined {
  return placementQuestions.find((t) => t.topicNo === topicNo);
}
