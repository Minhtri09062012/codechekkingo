import { Rubric } from '../core/types.ts';
import { AiRubricEvaluation } from './aiPrompts.ts';

/**
 * Chuẩn hóa chuỗi tiếng Việt để so khớp từ khóa không phân biệt hoa thường và dấu
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Đánh giá không dùng AI (Offline / Fallback Keyword Matcher)
 * Dùng khi mất mạng, không có API key, hoặc AI bị timeout sau 20s
 */
export function evaluateWithRubricFallback(params: {
  rubric: Rubric;
  studentText: string;
  attemptNo: number;
}): AiRubricEvaluation {
  const { rubric, studentText, attemptNo } = params;
  const normalizedText = normalizeString(studentText);

  const matchedIdeaIds: string[] = [];
  const missingIdeaIds: string[] = [];

  for (const idea of rubric.keyIdeas) {
    let hasMatch = false;
    for (const kw of idea.keywords) {
      const normKw = normalizeString(kw);
      if (normKw && normalizedText.includes(normKw)) {
        hasMatch = true;
        break;
      }
    }

    if (hasMatch) {
      matchedIdeaIds.push(idea.id);
    } else {
      missingIdeaIds.push(idea.id);
    }
  }

  // Phát hiện lỗi sai phổ biến
  const detectedMistakes: string[] = [];
  for (const mistake of rubric.commonMistakes) {
    const normMistake = normalizeString(mistake);
    const words = normMistake.split(' ').filter((w) => w.length > 2);
    const matchedCount = words.filter((w) => normalizedText.includes(w)).length;
    if (words.length > 0 && matchedCount >= Math.min(3, words.length)) {
      detectedMistakes.push(mistake);
    }
  }

  // Bậc gợi ý: tăng dần theo số lần thử, tối đa bậc 4
  const hintLevel = Math.min(4, Math.max(1, attemptNo)) as 1 | 2 | 3 | 4;

  let praise = '';
  if (matchedIdeaIds.length === rubric.keyIdeas.length) {
    praise = 'Xuất sắc! Em đã trình bày đầy đủ tất cả các ý tưởng cốt lõi để giải quyết bài toán.';
  } else if (matchedIdeaIds.length > 0) {
    praise = `Rất tốt! Em đã chỉ ra được ${matchedIdeaIds.length}/${rubric.keyIdeas.length} ý cốt lõi quan trọng.`;
  } else {
    praise = 'Thầy/cô ghi nhận nỗ lực suy nghĩ của em. Hãy tiếp tục phân tích từng bước nhé!';
  }

  let nextQuestion = '';
  if (missingIdeaIds.length > 0) {
    const firstMissing = missingIdeaIds[0];
    const hints = rubric.hintsByIdea[firstMissing];
    if (hints && hints[hintLevel - 1]) {
      nextQuestion = hints[hintLevel - 1];
    } else {
      nextQuestion = 'Em hãy suy nghĩ xem cần bổ sung thêm bước xử lý nào tiếp theo để hoàn thành bài toán?';
    }
  } else {
    nextQuestion = 'Ý tưởng của em đã rất rõ ràng. Em hãy bắt đầu chuyển hóa thành code Python nhé!';
  }

  return {
    matchedIdeaIds,
    missingIdeaIds,
    misconceptions: detectedMistakes.slice(0, 2),
    praise,
    nextQuestion,
    hintLevel,
    complexityOk: normalizedText.includes('o(') || normalizedText.includes('do phuc tap'),
  };
}

/**
 * Trả lời giải thích dòng code ở chế độ Không AI (Offline Fallback)
 */
export function explainCodeLineFallback(
  codeLine: string,
  lineNote: string,
  lineNumber: number
): string {
  const trimmed = codeLine.trim();

  if (trimmed.startsWith('#')) {
    return `Dòng ${lineNumber} là chú thích (comment): Python sẽ bỏ qua dòng này khi chạy, dòng này chỉ để người đọc hiểu ý đồ của chương trình.`;
  }

  if (trimmed.includes('input()')) {
    return `Dòng ${lineNumber} (${codeLine}): Máy tính tạm dừng chương trình và đợi người dùng nhập dữ liệu từ bàn phím. Dữ liệu đọc vào sẽ được chuyển thành giá trị tương ứng.`;
  }

  if (trimmed.startsWith('print(')) {
    return `Dòng ${lineNumber} (${codeLine}): Máy tính xuất giá trị trong ngoặc ra màn hình cho người dùng xem kết quả.`;
  }

  if (trimmed.includes(' = ')) {
    return `Dòng ${lineNumber} (${codeLine}): Đây là lệnh gán giá trị. Máy tính tính toán biểu thức bên phải dấu bằng trước, sau đó lưu kết quả vào ô nhớ của biến bên trái. ${lineNote}`;
  }

  if (trimmed.startsWith('if ') || trimmed.startsWith('elif ')) {
    return `Dòng ${lineNumber} (${codeLine}): Lệnh rẽ nhánh kiểm tra điều kiện. Nếu điều kiện đúng (True), máy tính sẽ nhảy vào thực thi các lệnh thụt lề bên trong; nếu sai (False), máy tính sẽ bỏ qua.`;
  }

  if (trimmed.startsWith('else:')) {
    return `Dòng ${lineNumber}: Nhánh mặc định. Lệnh này chỉ chạy khi tất cả các điều kiện if/elif phía trên đều sai.`;
  }

  return `Dòng ${lineNumber}: ${lineNote || 'Lệnh thực thi trong chương trình Python.'}`;
}

/**
 * Phân tích lỗi test ở chế độ Không AI (Offline Fallback)
 */
export function diagnoseFailingTestFallback(params: {
  input: string;
  expectedOutput: string;
  actualOutput: string;
  commonMistakes: string[];
}): import('./aiPrompts.ts').FailingTestDiagnostic {
  const { input, expectedOutput, actualOutput, commonMistakes } = params;

  const normAct = actualOutput.trim();
  const normExp = expectedOutput.trim();

  // Kiểm tra sai định dạng
  if (normAct.toLowerCase() === normExp.toLowerCase()) {
    return {
      trapType: 'format_error',
      trapTitle: 'Sai định dạng chữ hoa / chữ thường',
      analysis: `Kết quả tính toán của em đã đúng giá trị nhưng khác biệt về chữ hoa/thường (em in ra "${normAct}" trong khi đề yêu cầu "${normExp}").`,
      pedagogicalQuestion: `Em hãy kiểm tra lại câu lệnh print xem đã in đúng định dạng hoa/thường mà đề bài quy định chưa?`,
    };
  }

  if (normAct.replace(/\s+/g, '') === normExp.replace(/\s+/g, '')) {
    return {
      trapType: 'format_error',
      trapTitle: 'Sai định dạng khoảng trắng hoặc xuống dòng',
      analysis: `Các số hoặc chữ trong kết quả của em khớp với đáp án, nhưng cách nhau bởi số lượng khoảng trắng hoặc dấu xuống dòng khác với yêu cầu.`,
      pedagogicalQuestion: `Đề bài yêu cầu in các phần tử cách nhau bởi dấu cách hay mỗi phần tử một dòng?`,
    };
  }

  // Kiểm tra trường hợp biên
  const inputTrim = input.trim();
  if (inputTrim === '0' || inputTrim === '1' || inputTrim === '-1' || inputTrim.length <= 2) {
    return {
      trapType: 'edge_case',
      trapTitle: 'Chưa xử lý trường hợp biên (Edge case)',
      analysis: `Bộ test này có dữ liệu đầu vào đặc biệt nhỏ hoặc ở biên (${inputTrim}). Code của em ra kết quả "${normAct}" nhưng đáp án là "${normExp}".`,
      pedagogicalQuestion: `Khi dữ liệu đầu vào là ${inputTrim}, thuật toán của em có bị rơi vào trường hợp chưa khởi tạo giá trị ban đầu không?`,
    };
  }

  // Kiểm tra các lỗi trong Rubric
  if (commonMistakes.length > 0) {
    const firstMistake = commonMistakes[0];
    return {
      trapType: 'logic_branch',
      trapTitle: 'Bẫy thuật toán tiềm ẩn',
      analysis: `Chương trình của em cho kết quả "${normAct}" khác với mong đợi "${normExp}". Lưu ý bẫy thường gặp của bài này: "${firstMistake}".`,
      pedagogicalQuestion: `Em hãy lần theo từng bước tính toán với đầu vào "${inputTrim}" xem kết quả bị lệch ở phép tính nào?`,
    };
  }

  return {
    trapType: 'logic_branch',
    trapTitle: 'Kết quả tính toán chưa chính xác',
    analysis: `Với đầu vào "${inputTrim}", đầu ra thực tế "${normAct}" không khớp với đầu ra mong đợi "${normExp}".`,
    pedagogicalQuestion: `Em có thể dùng tính năng "Mô phỏng code của em trên test này" ở dưới để xem từng biến thay đổi ra sao nhé!`,
  };
}
