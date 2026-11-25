import React, { useState, useMemo } from 'react';
import { Problem } from '../../core/types.ts';
import { getSmallestTests, matchAnswerNormalized } from '../../core/predictionGenerator.ts';
import { evaluateWithRubricFallback } from '../../ai/rubricCheck.ts';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  X,
  Sparkles,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface DiagnosticQuizModalProps {
  problem: Problem;
  onSelectLevel: (level: 1 | 2 | 3 | 4) => void;
  onClose: () => void;
}

export const DiagnosticQuizModal: React.FC<DiagnosticQuizModalProps> = ({
  problem,
  onSelectLevel,
  onClose,
}) => {
  // Q1: Lấy test nhỏ nhất
  const sampleTest = useMemo(() => {
    const list = getSmallestTests(problem.task, 1);
    return list[0] || problem.task.examples[0] || { input: '', output: '' };
  }, [problem.task]);

  const [q1Answer, setQ1Answer] = useState('');
  const [q2Answer, setQ2Answer] = useState<string>('');
  const [q3Answer, setQ3Answer] = useState('');
  const [diagnosedLevel, setDiagnosedLevel] = useState<1 | 2 | 3 | 4 | null>(null);
  const [diagnosisDetails, setDiagnosisDetails] = useState<{
    q1Ok: boolean;
    q2Ok: boolean;
    q3MatchedCount: number;
    reason: string;
  } | null>(null);

  // Q2 options
  const q2Options = [
    { id: 'opt_linear', label: 'O(N) hoặc O(N log N) - Tuyến tính hoặc logarit' },
    { id: 'opt_quad', label: 'O(N^2) hoặc O(N^3) - Duyệt đa thức lồng nhau' },
    { id: 'opt_exp', label: 'O(2^N) - Vét cạn toàn bộ tập con' },
    { id: 'opt_sqrt', label: 'O(√N) hoặc O(log N) - Rất nhanh' },
  ];

  const handleDiagnose = () => {
    if (!q1Answer.trim() || !q2Answer || !q3Answer.trim()) return;

    // 1. Chấm Q1
    const q1Ok = matchAnswerNormalized(q1Answer, sampleTest.output);

    // 2. Chấm Q2
    const expStr = problem.task.analysis.expectedComplexities.join(' ').toLowerCase();
    let q2Ok = false;
    if (q2Answer === 'opt_linear' && (expStr.includes('o(n') || expStr.includes('o(r log r'))) q2Ok = true;
    else if (q2Answer === 'opt_sqrt' && (expStr.includes('o(log') || expStr.includes('o(sqrt') || expStr.includes('o(1)'))) q2Ok = true;
    else if (q2Answer === 'opt_quad' && expStr.includes('o(n^2)')) q2Ok = true;
    else if (q2Answer === 'opt_exp' && expStr.includes('o(2^n)')) q2Ok = true;
    else {
      // Nếu đề bài có N <= 10^5 mà chọn linear hoặc sqrt thì coi là đúng
      if (problem.task.analysis.maxN.includes('10^5') && (q2Answer === 'opt_linear' || q2Answer === 'opt_sqrt')) {
        q2Ok = true;
      }
    }

    // 3. Chấm Q3: so khớp từ khóa rubric
    const q3Eval = evaluateWithRubricFallback({
      rubric: problem.rubric,
      studentText: q3Answer,
      attemptNo: 1,
    });
    const q3MatchedCount = q3Eval.matchedIdeaIds.length;

    // QUY TẮC ĐỀ XUẤT CẤP ĐỘ THEO HỢP ĐỒNG:
    // - Sai Q1 và sai Q2 -> Cấp 4
    // - Sai Q1 (đúng Q2) -> Cấp 3
    // - Đúng Q1 và Q3 khớp >= 1 ý -> Cấp 1
    // - Đúng Q1 nhưng Q3 không khớp ý nào -> Cấp 2
    let recommended: 1 | 2 | 3 | 4 = 1;
    let reasonText = '';

    if (!q1Ok && !q2Ok) {
      recommended = 4;
      reasonText =
        'Em chưa tính đúng kết quả ví dụ đơn giản và chưa ước lượng được độ phức tạp. Cấp độ 4 sẽ giúp em chạy từng dòng code mẫu và xem giải thích đời thường từ đầu!';
    } else if (!q1Ok && q2Ok) {
      recommended = 3;
      reasonText =
        'Em đã có nhận thức tốt về quy mô dữ liệu nhưng chưa hiểu rõ quy tắc tính toán của đề bài. Cấp độ 3 sẽ dẫn dắt em đi từng bước giải quyết.';
    } else if (q1Ok && q3MatchedCount >= 1) {
      recommended = 1;
      reasonText =
        'Rất tuyệt vời! Em đã hiểu chính xác đề bài và đã có sẵn ít nhất một ý tưởng thuật toán cốt lõi. Hãy bắt đầu ngay ở Cấp độ 1 để hoàn thiện giả mã.';
    } else {
      // đúng Q1 nhưng Q3 không khớp ý nào
      recommended = 2;
      reasonText =
        'Em đã hiểu đúng đề bài nhưng chưa hình dung rõ thuật toán cài đặt. Hãy học ở Cấp độ 2 để quan sát ô nhớ và dự đoán các bước chạy then chốt.';
    }

    setDiagnosedLevel(recommended);
    setDiagnosisDetails({
      q1Ok,
      q2Ok,
      q3MatchedCount,
      reason: reasonText,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-2xl relative my-8">
        <button type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Bài chẩn đoán cấp độ năng lực (3 câu)
          </div>
          <h3 className="text-lg font-bold text-slate-100">{problem.title}</h3>
          <p className="text-xs text-slate-400">
            Trả lời nhanh 3 câu hỏi dưới đây để hệ thống tự động gợi ý cấp độ phù hợp nhất cho em.
          </p>
        </div>

        {!diagnosedLevel ? (
          <div className="space-y-5 text-xs">
            {/* Câu 1 */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="font-bold text-slate-200">
                Câu 1: Với dữ liệu thử nghiệm nhỏ dưới đây, kết quả của bài toán là gì?
              </span>
              <pre className="p-2 rounded-lg bg-slate-900 text-blue-300 font-mono text-xs overflow-x-auto">
                {sampleTest.input}
              </pre>
              <input
                type="text"
                value={q1Answer}
                onChange={(e) => setQ1Answer(e.target.value)}
                placeholder="Nhập đáp án của em..."
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            {/* Câu 2 */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="font-bold text-slate-200">
                Câu 2: Với kích thước bài toán {problem.task.analysis.maxN}, theo em thuật toán cần đạt độ phức tạp nào để chạy dưới {problem.task.timeLimitSec || 1}.0s?
              </span>
              <div className="space-y-1.5 pt-1">
                {q2Options.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                      q2Answer === opt.id
                        ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <input
                      type="radio"
                      name="diag_q2"
                      checked={q2Answer === opt.id}
                      onChange={() => setQ2Answer(opt.id)}
                      className="accent-blue-500"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Câu 3 */}
            <div className="space-y-2 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
              <span className="font-bold text-slate-200">
                Câu 3: Em hãy viết ngắn gọn 1-2 câu nêu hướng tiếp cận hoặc từ khóa thuật toán em sẽ dùng?
              </span>
              <textarea
                rows={2}
                value={q3Answer}
                onChange={(e) => setQ3Answer(e.target.value)}
                placeholder="Ví dụ: Dùng mảng cộng dồn để truy vấn, hoặc dùng sàng đếm ước..."
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Hủy bỏ
              </button>
              <button type="button"
                onClick={handleDiagnose}
                disabled={!q1Answer.trim() || !q2Answer || !q3Answer.trim()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 shadow-md shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
              >
                Xem chẩn đoán cấp độ
              </button>
            </div>
          </div>
        ) : (
          /* Kết quả chẩn đoán */
          <div className="space-y-5 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                <span className="font-bold text-slate-400">Kết quả bài làm:</span>
                <span className="text-slate-500">
                  Q1: {diagnosisDetails?.q1Ok ? '✓ Đúng' : '✗ Sai'} | Q2: {diagnosisDetails?.q2Ok ? '✓ Đúng' : '✗ Sai'} | Q3: khớp {diagnosisDetails?.q3MatchedCount} ý
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/40 space-y-2">
                <div className="text-xs text-blue-300 font-bold uppercase tracking-wider">
                  Cấp độ đề xuất cho em:
                </div>
                <div className="text-lg font-black text-slate-100">
                  Cấp độ {diagnosedLevel}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {diagnosisDetails?.reason}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button type="button"
                onClick={() => setDiagnosedLevel(null)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Làm lại chẩn đoán
              </button>

              <button type="button"
                onClick={() => {
                  onSelectLevel(diagnosedLevel);
                  onClose();
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                <span>Vào học Cấp độ {diagnosedLevel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
