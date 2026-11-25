import React, { useState } from 'react';
import { LearningSource } from '../../core/types.ts';
import { useApp } from '../../context/AppContext.tsx';
import { gradePredictSubmission, SubmissionReport } from '../../runner/testSuite.ts';
import {
  Eye,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Sparkles,
  HelpCircle,
  ArrowRight,
  Code2,
} from 'lucide-react';

interface PredictRunnerProps {
  source: LearningSource;
  level: 1 | 2 | 3 | 4;
}

export const PredictRunner: React.FC<PredictRunnerProps> = ({ source, level }) => {
  const { state, dispatch } = useApp();
  const task = source.task;
  const predictCode = task.predictCode || task.starterCode || '# Dự đoán kết quả mã nguồn';

  const [studentInput, setStudentInput] = useState('');
  const [report, setReport] = useState<SubmissionReport | null>(null);

  const handleCheck = () => {
    if (!studentInput.trim()) return;

    const res = gradePredictSubmission(source.id, task, studentInput);
    setReport(res);

    // Cập nhật AppContext solved & errorBook
    dispatch({
      type: 'RECORD_SUBMISSION',
      payload: {
        sourceId: source.id,
        score: res.score,
        errors: res.errorsToRecord,
      },
    });
  };

  const handleReset = () => {
    setStudentInput('');
    setReport(null);
  };

  return (
    <div className="space-y-5 rounded-2xl bg-slate-900/90 border border-slate-800 p-5 sm:p-6 shadow-xl">
      {/* Tiêu đề & Giới thiệu */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              Chế độ Dự đoán đầu ra (Predict Mode)
            </span>
            <span className="text-xs text-slate-500 font-mono">Không cần Pyodide</span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-100">
            Dự đoán kết quả in ra màn hình của đoạn code Python sau
          </h3>
        </div>

        {report && (
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
              report.score === 100
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500 text-rose-300'
            }`}
          >
            {report.score === 100 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>Điểm: {report.score}/100</span>
          </div>
        )}
      </div>

      {/* Hiển thị predictCode */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5 text-blue-400" />
          Đoạn mã Python cần dự đoán:
        </label>
        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs sm:text-sm text-slate-200 overflow-x-auto leading-relaxed shadow-inner">
          <pre>{predictCode}</pre>
        </div>
      </div>

      {/* Ô nhập dự đoán */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            Nhập kết quả em dự đoán màn hình sẽ in ra:
          </span>
          <span className="text-[11px] text-slate-500">
            (Có thể nhập nhiều dòng nếu chương trình in nhiều dòng)
          </span>
        </label>
        <textarea
          rows={3}
          value={studentInput}
          onChange={(e) => setStudentInput(e.target.value)}
          placeholder="Ví dụ: 10 20 hoặc True hoặc giá trị in ra..."
          className="w-full rounded-2xl bg-slate-950 border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 p-3.5 text-xs sm:text-sm text-slate-100 font-mono placeholder:text-slate-600 outline-none transition-all"
        />
      </div>

      {/* Nút hành động */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button type="button"
          onClick={handleReset}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Làm lại</span>
        </button>

        <button type="button"
          onClick={handleCheck}
          disabled={!studentInput.trim()}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
        >
          <span>Kiểm tra dự đoán</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Kết quả phản hồi */}
      {report && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm space-y-3 animate-fadeIn ${
            report.score === 100
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="font-bold flex items-center gap-2">
            {report.score === 100 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{report.summaryMessage}</span>
          </div>

          {report.score < 100 && report.smallestFailedTest && (
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-rose-500/30 space-y-2 font-mono text-xs">
              <div className="text-slate-400">
                Đầu ra thực tế của em:{' '}
                <span className="text-rose-300 font-bold">"{report.smallestFailedTest.actualOutput}"</span>
              </div>
              <div className="text-slate-400">
                Đáp án mong đợi:{' '}
                <span className="text-emerald-400 font-bold">"{report.smallestFailedTest.expectedOutput}"</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
