/**
 * Trình biên dịch lỗi Python sang giải thích tiếng Việt thân thiện với học sinh
 * Không in traceback dài phức tạp mà chỉ trích xuất loại lỗi, dòng lỗi và hướng dẫn khắc phục.
 */

export interface FriendlyError {
  errorType: string;
  line?: number;
  message: string;
  original: string;
}

/**
 * Trích xuất số dòng từ mã nguồn của học sinh (bỏ qua các frame nội bộ của Pyodide như _pyodide/_base.py hoặc <exec>).
 */
function extractUserLineNumber(raw: string): number | undefined {
  // 1. Ưu tiên frame khớp tên tệp mã người dùng
  const userFrameRegex = /File\s+"(?:solution\.py|<stdin>|<user_code>|main\.py|<string>)",\s+line\s+(\d+)/gi;
  let lastUserLine: number | undefined;
  let m: RegExpExecArray | null;
  while ((m = userFrameRegex.exec(raw)) !== null) {
    lastUserLine = parseInt(m[1], 10);
  }
  if (lastUserLine !== undefined) return lastUserLine;

  // 2. Định dạng SyntaxError dạng (<user_code>, line X)
  const inlineSyntaxRegex = /\((?:solution\.py|<stdin>|<user_code>|main\.py|<string>),\s+line\s+(\d+)\)/i;
  const inlineMatch = raw.match(inlineSyntaxRegex);
  if (inlineMatch) return parseInt(inlineMatch[1], 10);

  // 3. Fallback: lọc bỏ các dòng frame nội bộ Pyodide/eval rồi lấy số dòng cuối cùng
  const filtered = raw
    .split('\n')
    .filter((l) => !/_pyodide|File\s+"<exec>"|eval_code/i.test(l))
    .join('\n');
  const genericRegex = /line\s+(\d+)/gi;
  let lastLine: number | undefined;
  while ((m = genericRegex.exec(filtered)) !== null) {
    lastLine = parseInt(m[1], 10);
  }
  return lastLine;
}

/**
 * Trích xuất đoạn mã nguồn bị lỗi (kèm dấu ^ nếu có) từ traceback để chỉ rõ "sai ở đâu".
 */
function extractCodeSnippet(raw: string): string | undefined {
  const lines = raw.split('\n');
  // Tìm từ cuối lên dòng File "..." của người dùng (hoặc File cuối cùng không phải Pyodide)
  let fileIdx = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^\s*File\s+"/.test(lines[i]) && !/_pyodide|File\s+"<exec>"/i.test(lines[i])) {
      fileIdx = i;
      break;
    }
  }
  if (fileIdx === -1) return undefined;

  const snippetLines: string[] = [];
  for (let j = fileIdx + 1; j < lines.length - 1; j++) {
    const l = lines[j];
    if (!l.trim()) continue;
    if (/^[A-Za-z_]\w*(Error|Exception|Warning)\s*:/.test(l.trim())) break;
    snippetLines.push(l.replace(/^ {4}/, ''));
  }

  return snippetLines.length > 0 ? snippetLines.join('\n') : undefined;
}

function explainSyntaxDetail(detail: string): string {
  const d = detail.toLowerCase();
  if (d.includes("expected ':'")) {
    return "Thiếu dấu hai chấm ':' ở cuối câu lệnh (if, elif, else, for, while, def, class...).";
  }
  if (d.includes('was never closed') || d.includes('unexpected eof') || d.includes('unmatched')) {
    return `Cặp dấu ngoặc (), [] hoặc {} chưa khớp hoặc chưa được đóng (${detail}).`;
  }
  if (d.includes('unterminated string') || d.includes('eol while scanning string')) {
    return `Chuỗi ký tự chưa được đóng dấu nháy ' hoặc " (${detail}).`;
  }
  if (d.includes('cannot assign to') || d.includes("maybe you meant '=='")) {
    return `Phép gán/so sánh chưa hợp lệ: dùng '=' để gán biến và '==' để so sánh bằng (${detail}).`;
  }
  if (d.includes('invalid decimal literal') || d.includes('leading zeros')) {
    return `Cách viết số hoặc tên biến chưa hợp lệ — tên biến không được bắt đầu bằng chữ số (${detail}).`;
  }
  return `Cấu trúc câu lệnh chưa đúng ngữ pháp Python (${detail || "hãy kiểm tra dấu ':', cặp ngoặc '()' hoặc dấu nháy chuỗi"}).`;
}

export function translatePythonError(rawError: string): FriendlyError {
  const original = rawError.trim();

  const line = extractUserLineNumber(original);
  const snippet = extractCodeSnippet(original);

  // Lấy dòng lỗi cuối cùng (thường là Type: Message)
  const lines = original.split('\n').filter((l) => l.trim().length > 0);
  const lastLine = lines[lines.length - 1] || original;

  let errorType = 'RuntimeError';
  let detail = lastLine;

  const colonIdx = lastLine.indexOf(':');
  if (colonIdx !== -1) {
    errorType = lastLine.substring(0, colonIdx).trim();
    detail = lastLine.substring(colonIdx + 1).trim();
  }

  let message = '';
  switch (errorType) {
    case 'SyntaxError':
      message = `Lỗi cú pháp (SyntaxError): ${explainSyntaxDetail(detail)}`;
      break;
    case 'IndentationError':
    case 'TabError':
      message = `Lỗi thụt lề (${errorType}): Các câu lệnh trong cùng khối (if, for, while, def) phải thụt lề đều nhau bằng dấu cách (${detail || 'thường là 4 dấu cách'}).`;
      break;
    case 'IndexError':
      message = `Lỗi chỉ số (IndexError): Đang truy cập phần tử ngoài phạm vi độ dài mảng/chuỗi (mảng n phần tử có chỉ số từ 0 đến n-1).`;
      break;
    case 'KeyError':
      message = `Lỗi khóa từ điển (KeyError): Khóa ${detail || ''} không tồn tại trong dictionary.`;
      break;
    case 'ZeroDivisionError':
      message = `Lỗi chia cho 0 (ZeroDivisionError): Phép toán chia (/ hoặc // hoặc %) có mẫu số bằng 0.`;
      break;
    case 'ValueError':
      message = `Lỗi giá trị (ValueError): Giá trị đưa vào hàm không hợp lệ (ví dụ ép kiểu int('abc')). Chi tiết: ${detail}`;
      break;
    case 'TypeError':
      message = `Lỗi kiểu dữ liệu (TypeError): Phép toán hoặc hàm thực hiện trên kiểu dữ liệu không phù hợp (ví dụ cộng chuỗi với số mà chưa đổi kiểu). Chi tiết: ${detail}`;
      break;
    case 'NameError':
      message = `Lỗi biến chưa khai báo (NameError): Tên biến hoặc hàm chưa được định nghĩa trước khi dùng. Chi tiết: ${detail}`;
      break;
    case 'RecursionError':
      message = `Lỗi tràn đệ quy (RecursionError): Hàm đệ quy gọi lại chính nó quá nhiều lần mà chưa chạm tới điều kiện dừng.`;
      break;
    case 'MemoryError':
      message = `Lỗi tràn bộ nhớ (MemoryError): Bộ nhớ bị vượt giới hạn do tạo danh sách hoặc dữ liệu quá lớn.`;
      break;
    case 'FileNotFoundError':
      message = `Lỗi tệp tin (FileNotFoundError): ${detail || 'Không tìm thấy tệp đầu vào/đầu ra quy định.'}`;
      break;
    case 'EOFError':
      message = `Lỗi hết dữ liệu (EOFError): Lệnh input() cố đọc thêm nhưng dữ liệu đầu vào của bài kiểm tra đã kết thúc.`;
      break;
    case 'Timeout':
      message = `Quá thời gian (Time Limit Exceeded): Chương trình chạy quá thời gian cho phép (có thể do vòng lặp vô hạn while True hoặc thuật toán chưa tối ưu).`;
      break;
    default:
      message = `Lỗi thực thi (${errorType}): ${detail || 'Chương trình gặp lỗi khi chạy.'}`;
      break;
  }

  if (line !== undefined) {
    message = `[Dòng ${line}] ${message}`;
  }

  if (snippet) {
    message += `\n↳ Đoạn code lỗi:\n${snippet}`;
  }

  return {
    errorType,
    line,
    message,
    original,
  };
}
