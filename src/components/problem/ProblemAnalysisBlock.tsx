import React, { useState, useEffect } from 'react';
import { Problem } from '../../core/types.ts';
import { useApp } from '../../context/AppContext.tsx';
import {
  Cpu,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  Sparkles,
  Check,
  RotateCcw,
} from 'lucide-react';

interface ProblemAnalysisBlockProps {
  problem: Problem;
}

const COMPLEXITY_OPTIONS = [
  {
    id: 'O_2N',
    label: 'O(2^N) hoặc O(N!) - Vét cạn quay lui (N <= 20)',
    maxLimit: 'N <= 20',
  },
  {
    id: 'O_N3',
    label: 'O(N^3) - Ba vòng lặp lồng nhau (N <= 500)',
    maxLimit: 'N <= 500',
  },
  {
    id: 'O_N2',
    label: 'O(N^2) - Hai vòng lặp lồng nhau (N <= 5.000)',
    maxLimit: 'N <= 5.000',
  },
  {
    id: 'O_NlogN',
    label: 'O(N log N) hoặc O(N) - Sắp xếp, chia để trị, quy hoạch động (N <= 10^5 - 10^6)',
    maxLimit: 'N <= 10^5 - 10^6',
  },
  {
    id: 'O_sqrtN_logN',
    label: 'O(√N), O(log N) hoặc O(1) - Tìm kiếm nhị phân, số học, mảng cộng dồn (N >= 10^9)',
    maxLimit: 'N >= 10^9',
  },
];

export const ProblemAnalysisBlock: React.FC<ProblemAnalysisBlockProps> = ({ problem }) => {
  const { state, dispatch } = useApp();
  const analysisKey = `${problem.id}|analysis`;
  const savedProgress = state.progress.levels[analysisKey];
  const isCompleted = Boolean(savedProgress?.codeUnlocked);

  const [inputSummary, setInputSummary] = useState('');
  const [outputSummary, setOutputSummary] = useState('');
  const [maxNAnswer, setMaxNAnswer] = useState('');
  const [selectedComplexity, setSelectedComplexity] = useState<string>('');
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    msg: string;
  } | null>(null);

  useEffect(() => {
    setInputSummary('');
    setOutputSummary('');
    setMaxNAnswer('');
    setSelectedComplexity('');
    setSubmitted(false);
    setFeedback(null);
  }, [problem.id]);

  // Xác định lựa chọn độ phức tạp đúng dựa trên expectedComplexities của bài
  const isComplexityMatch = (chosenId: string): boolean => {
    const exp = problem.task.analysis.expectedComplexities.join(' ').toLowerCase();
    if (exp.includes('o(1)') || exp.includes('o(log') || exp.includes('o(r log r') || exp.includes('o(n log n') || exp.includes('o(n)')) {
      if (chosenId === 'O_NlogN' || chosenId === 'O_sqrtN_logN') return true;
    }
    if (exp.includes('o(n^2)') && chosenId === 'O_N2') return true;
    if (exp.includes('o(2^n)') && chosenId === 'O_2N') return true;
    return chosenId === 'O_NlogN' || chosenId === 'O_sqrtN_logN';
  };

  const handleVerifyAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSummary.trim() || !outputSummary.trim() || !maxNAnswer.trim() || !selectedComplexity) {
      setFeedback({
        ok: false,
        msg: 'Vui lòng hoàn thành đủ 4 mục phân tích đề bài trước khi xác nhận.',
      });
      return;
    }

    const complexityOk = isComplexityMatch(selectedComplexity);

    if (complexityOk) {
      setFeedback({
        ok: true,
        msg: `Chính xác! Với giới hạn ${problem.task.analysis.maxN}, Python có thể chạy khoảng 10^6 - 10^7 phép tính/giây. Độ phức tạp kỳ vọng ${problem.task.analysis.expectedComplexities.join(', ')} hoàn toàn đảm bảo chạy trong thời gian cho phép.`,
      });

      dispatch({
        type: 'UPDATE_LEVEL_PROGRESS',
        payload: {
          sourceId: problem.id,
          level: 'analysis' as any,
          data: {
            codeUnlocked: true,
          },
        },
      });
    } else {
      setFeedback({
        ok: false,
        msg: `Độ phức tạp chưa tối ưu cho giới hạn ${problem.task.analysis.maxN}. Hãy xem lại bảng tham chiếu: với N lên tới 10^5 hoặc 10^6, thuật toán O(N^2) hay O(2^N) sẽ bị quá thời gian (TLE).`,
      });
    }

    setSubmitted(true);
  };

  const handleReset = () => {
    setFeedback(null);
    setSubmitted(false);
  };

  return (
    <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm sm:text-base font-bold text-slate-100">
              Phân tích đề bài & Đánh giá độ phức tạp
            </h3>
            {isCompleted ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                ✓ Đã hoàn thành
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                Bắt buộc trước khi viết code
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Học sinh cần nắm rõ quy mô dữ liệu và chọn thuật toán có độ phức tạp nằm trong giới hạn 1.0 - 2.0s của Python.
          </p>
        </div>

        {isCompleted && (
          <button type="button"
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Làm lại
          </button>
        )}
      </div>

      <form onSubmit={handleVerifyAnalysis} className="space-y-4">
        {/* 1. Input là gì */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <span>1. Dữ liệu vào (Input) của bài toán là gì?</span>
          </label>
          <input
            type="text"
            disabled={isCompleted}
            value={inputSummary}
            onChange={(e) => setInputSummary(e.target.value)}
            placeholder="Ví dụ: Đọc Q truy vấn, mỗi truy vấn gồm hai số L và R từ tệp SODB.INP..."
            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 disabled:opacity-70"
          />
        </div>

        {/* 2. Output là gì */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <span>2. Dữ liệu ra (Output) cần xuất là gì?</span>
          </label>
          <input
            type="text"
            disabled={isCompleted}
            value={outputSummary}
            onChange={(e) => setOutputSummary(e.target.value)}
            placeholder="Ví dụ: Xuất ra số lượng số đặc biệt trong đoạn [L, R] trên từng dòng..."
            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 disabled:opacity-70"
          />
        </div>

        {/* 3. N tối đa là bao nhiêu */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <span>3. Giá trị lớn nhất của biến kích thước bài toán (N hoặc R, Q tối đa)?</span>
          </label>
          <input
            type="text"
            disabled={isCompleted}
            value={maxNAnswer}
            onChange={(e) => setMaxNAnswer(e.target.value)}
            placeholder={`Gợi ý theo đề bài: ${problem.task.analysis.maxN}`}
            className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 disabled:opacity-70 font-mono"
          />
        </div>

        {/* 4. Nhóm độ phức tạp cho phép từ bảng tham chiếu Python */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300">
              4. Theo bảng tham chiếu Python (10^6 - 10^7 phép tính/giây), độ phức tạp nào khả thi?
            </label>
            <span className="text-[11px] text-amber-400 font-mono">
              Thời gian chạy: {problem.task.timeLimitSec || 1}.0s
            </span>
          </div>

          <div className="space-y-2">
            {COMPLEXITY_OPTIONS.map((opt) => {
              const isSelected = selectedComplexity === opt.id;
              return (
                <label
                  key={opt.id}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-blue-200'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-900'
                  } ${isCompleted ? 'cursor-default' : ''}`}
                >
                  <div className="flex items-center gap-2.5">
                    <input
                      type="radio"
                      name="complexity"
                      disabled={isCompleted}
                      checked={isSelected}
                      onChange={() => setSelectedComplexity(opt.id)}
                      className="accent-blue-500"
                    />
                    <span className="font-semibold font-mono">{opt.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{opt.maxLimit}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Nút xác nhận */}
        {!isCompleted && (
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs sm:text-sm hover:bg-blue-500 shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Xác nhận phân tích đề</span>
            </button>
          </div>
        )}
      </form>

      {/* Phản hồi đúng/sai */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs leading-relaxed flex items-start gap-3 animate-fadeIn ${
            feedback.ok
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
          }`}
        >
          {feedback.ok ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <div className="font-bold">{feedback.ok ? 'Phân tích đề hoàn tất' : 'Chưa đạt yêu cầu'}</div>
            <p className="text-slate-300">{feedback.msg}</p>
          </div>
        </div>
      )}

      {/* Ghi chú phân tích chi tiết của bài */}
      {isCompleted && problem.task.analysis.note && (
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
          <div className="font-bold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Ghi chú từ chuyên gia:
          </div>
          <p className="leading-relaxed">{problem.task.analysis.note}</p>
        </div>
      )}
    </div>
  );
};
