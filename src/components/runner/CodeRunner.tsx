import React, { useState, useEffect, useMemo, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { LearningSource, Step } from '../../core/types.ts';
import { useApp } from '../../context/AppContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useGate } from '../../hooks/useGate.ts';
import { PredictRunner } from './PredictRunner.tsx';
import { StudentTraceModal } from './StudentTraceModal.tsx';
import { gradeSubmission, SubmissionReport, JudgedTestResult } from '../../runner/testSuite.ts';
import { runPythonTrace } from '../../runner/pyRunner.ts';
import { diagnoseFailingTestWithGemini } from '../../ai/gemini.ts';
import { FailingTestDiagnostic } from '../../ai/aiPrompts.ts';
import {
  Code2,
  Play,
  RotateCcw,
  Sparkles,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Cpu,
  HelpCircle,
  Layers,
  FileCode,
  Type,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface CodeRunnerProps {
  source: LearningSource;
  level: 1 | 2 | 3 | 4;
}

export const CodeRunner: React.FC<CodeRunnerProps> = ({ source, level }) => {
  const { state, dispatch } = useApp();
  const { awardXp } = useAuth();
  const task = source.task;

  // Kiểm tra khóa theo Cổng useGate
  const gate = useGate(source.id, level, source);

  // Khởi tạo starter code (Cấp 3: khung code từ các chặng đã hoàn thành hoặc starterCode)
  const initialCode = useMemo(() => {
    if (level === 3 && source.lessons[0]?.code && source.lessons[0]?.stages) {
      const lesson = source.lessons[0];
      const key = `${source.id}|3`;
      const stagesDone = state.progress.levels[key]?.stagesDone || 0;
      if (stagesDone > 0) {
        return lesson.code.join('\n');
      }
    }
    return task.starterCode || '# Viết mã nguồn Python của em tại đây\n';
  }, [source, level, state.progress.levels]);

  const [code, setCode] = useState<string>(initialCode);
  const [fontSize, setFontSize] = useState<number>(14);
  const [isGrading, setIsGrading] = useState<boolean>(false);
  const [gradingProgress, setGradingProgress] = useState<{ current: number; total: number } | null>(null);
  const [report, setReport] = useState<SubmissionReport | null>(null);

  // AI Diagnostic State (Requirement 8)
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [diagnostic, setDiagnostic] = useState<FailingTestDiagnostic | null>(null);

  // Trace Simulation Modal State (Requirement 9)
  const [isTracing, setIsTracing] = useState<boolean>(false);
  const [traceError, setTraceError] = useState<string | null>(null);
  const [traceData, setTraceData] = useState<{
    testInput: string;
    steps: Step[];
    finalOutput: string;
    expectedOutput: string;
    runtimeError?: string;
  } | null>(null);

  // Tự động reset code khi đổi bài
  useEffect(() => {
    setCode(initialCode);
    setReport(null);
    setDiagnostic(null);
    setTraceData(null);
    setTraceError(null);
  }, [source.id, initialCode]);

  // Hành động Chấm bài
  const handleGrade = async (testOnlyPublic: boolean = false) => {
    setIsGrading(true);
    setDiagnostic(null);
    setGradingProgress({ current: 0, total: 1 });

    try {
      const targetTask = testOnlyPublic
        ? {
            ...task,
            tests: task.tests.filter((t, i) => t.isPublic !== false || i === 0),
          }
        : task;

      const subReport = await gradeSubmission(
        source.id,
        targetTask,
        source.lessons,
        code,
        (current, total) => setGradingProgress({ current, total })
      );

      setReport(subReport);

      // Cập nhật AppContext: ProgressState.solved & errorBook (Quy tắc 10)
      if (!testOnlyPublic) {
        dispatch({
          type: 'RECORD_SUBMISSION',
          payload: {
            sourceId: source.id,
            score: subReport.score,
            errors: subReport.errorsToRecord,
          },
        });

        // Tích lũy XP lên máy chủ cho tài khoản người dùng
        awardXp('problem_solved', source.id, { score: subReport.score });
      }

      // Nếu có test sai, tự động gọi phân tích AI hoặc chuẩn bị sẵn
      if (subReport.smallestFailedTest) {
        triggerAiDiagnostic(subReport.smallestFailedTest);
      }
    } catch (err) {
      console.error('Lỗi khi chấm code:', err);
    } finally {
      setIsGrading(false);
      setGradingProgress(null);
    }
  };

  // Kích hoạt AI phân tích test sai nhỏ nhất (Requirement 8)
  const triggerAiDiagnostic = async (failedTest: JudgedTestResult) => {
    setIsDiagnosing(true);
    try {
      const res = await diagnoseFailingTestWithGemini({
        statement: task.statement,
        constraints: task.constraints,
        studentCode: code,
        input: failedTest.test.input,
        expectedOutput: failedTest.expectedOutput,
        actualOutput: failedTest.actualOutput,
        commonMistakes: source.rubric.commonMistakes || [],
      });
      setDiagnostic(res.diagnostic);
    } catch (err) {
      console.warn('Lỗi khi gọi AI chẩn đoán:', err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Kích hoạt mô phỏng code học sinh trên test bị sai (Requirement 9)
  const handleSimulateOnTest = async (testResult: JudgedTestResult) => {
    setIsTracing(true);
    setTraceError(null);
    try {
      const traceRes = await runPythonTrace(code, testResult.test.input, 500, 4);
      setTraceData({
        testInput: testResult.test.input,
        steps: traceRes.steps,
        finalOutput: traceRes.finalOutput,
        expectedOutput: testResult.expectedOutput,
        runtimeError: traceRes.error?.message,
      });
    } catch (err: any) {
      console.error('Lỗi khi chạy mô phỏng code:', err);
      setTraceError(err?.message || 'Không thể chạy mô phỏng trên test này.');
    } finally {
      setIsTracing(false);
    }
  };

  // 1. Nếu là task.kind === 'predict', chuyển sang PredictRunner
  if (task.kind === 'predict') {
    return <PredictRunner source={source} level={level} />;
  }

  // 2. NẾU BỊ KHÓA THEO USEGATE: HIỂN THỊ LÝ DO VÀ HƯỚNG DẪN MỞ KHÓA
  if (!gate.codeUnlocked) {
    return (
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-amber-500/30 shadow-xl space-y-4 text-center">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-base sm:text-lg font-bold text-slate-100">
            Chức năng Viết code đang tạm khóa ở Cấp độ {level}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {gate.reason}
          </p>
        </div>
        <div className="pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            Hãy hoàn thành nhiệm vụ ở phần trên để mở khóa viết code
          </span>
        </div>
      </div>
    );
  }

  // 3. NẾU ĐÃ MỞ KHÓA: HIỂN THỊ TRÌNH SOẠN THẢO VÀ CHẤM CODE HOÀN CHỈNH
  return (
    <div className="space-y-6 rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-6 shadow-2xl animate-fadeIn">
      {/* Thanh công cụ: Tiêu đề + Chỉnh cỡ chữ + Trạng thái mở khóa */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
            <Unlock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <span>Trình biên soạn & Chấm mã nguồn Python</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Đã mở khóa
              </span>
            </h3>
            <span className="text-xs text-slate-400">
              Chế độ vào/ra: {task.ioMode.kind === 'file' ? `Tệp (${task.ioMode.inputFile} ➔ ${task.ioMode.outputFile})` : 'Chuẩn (stdio / input() & print())'}
            </span>
          </div>
        </div>

        {/* Chỉnh cỡ chữ */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Type className="w-3.5 h-3.5 text-slate-500" />
            Cỡ chữ:
          </span>
          <div className="flex items-center rounded-xl bg-slate-950 border border-slate-800 p-0.5">
            {[12, 14, 16, 18].map((size) => (
              <button type="button"
                key={size}
                onClick={() => setFontSize(size)}
                className={`px-2 py-0.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  fontSize === size
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {size}
              </button>
            ))}
          </div>

          <button type="button"
            onClick={() => setCode(initialCode)}
            title="Nạp lại mã nguồn ban đầu"
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Trình soạn thảo CodeMirror */}
      <div className="rounded-2xl border border-slate-800 overflow-hidden bg-[#282c34] shadow-inner">
        <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono flex items-center gap-1.5">
            <Code2 className="w-3.5 h-3.5 text-blue-400" />
            solution.py
          </span>
          <span className="text-[11px] text-slate-500">
            Giới hạn thời gian: {task.timeLimitSec || 3} giây / test
          </span>
        </div>

        <div style={{ fontSize: `${fontSize}px` }} className="font-mono">
          <CodeMirror
            value={code}
            height="320px"
            theme={oneDark}
            extensions={[python()]}
            onChange={(val) => setCode(val)}
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightSpecialChars: true,
              foldGutter: true,
              autocompletion: true,
            }}
          />
        </div>
      </div>

      {/* Nút hành động Chạy thử & Chấm bài */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          {gradingProgress && (
            <span className="flex items-center gap-2 text-blue-400 animate-pulse font-medium">
              <Clock className="w-3.5 h-3.5" />
              Đang chấm test #{gradingProgress.current}/{gradingProgress.total}...
            </span>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button type="button"
            onClick={() => handleGrade(true)}
            disabled={isGrading}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-blue-400" />
            <span>Chạy thử (Ví dụ)</span>
          </button>

          <button type="button"
            onClick={() => handleGrade(false)}
            disabled={isGrading}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Chấm bài (Toàn bộ test)</span>
          </button>
        </div>
      </div>

      {/* BẢNG KẾT QUẢ CHẤM */}
      {report && (
        <div className="space-y-4 pt-2">
          {/* Header Báo cáo điểm */}
          <div
            className={`p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
              report.score === report.totalPoints
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                : 'bg-slate-900 border-slate-700 text-slate-200'
            }`}
          >
            <div className="space-y-1">
              <div className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                {report.score === report.totalPoints ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                )}
                <span>Kết quả: {report.score} / {report.totalPoints} điểm</span>
              </div>
              <p className="text-xs text-slate-300">{report.summaryMessage}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-950/80 border border-slate-800">
                Đúng {report.passedCount}/{report.totalTests} test
              </span>
            </div>
          </div>

          {/* Chi tiết từng Test Case dạng lưới thẻ */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {report.testResults.map((tr) => {
              const isOk = tr.status === 'passed';
              return (
                <div
                  key={tr.index}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isOk
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                      : tr.status === 'timeout'
                      ? 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                      : tr.status === 'runtime'
                      ? 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                      : 'bg-rose-950/20 border-rose-500/20 text-rose-400'
                  }`}
                >
                  <div className="text-[11px] font-semibold truncate">{tr.test.label || `Test #${tr.index}`}</div>
                  <div className="text-xs font-bold mt-0.5">
                    {isOk
                      ? 'Đúng'
                      : tr.status === 'timeout'
                      ? 'Quá giờ'
                      : tr.status === 'runtime'
                      ? 'Lỗi chạy'
                      : tr.status === 'format_error'
                      ? 'Sai định dạng'
                      : 'Sai kết quả'}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{tr.elapsedMs}ms</div>
                </div>
              );
            })}
          </div>

          {/* TEST SAI NHỎ NHẤT & CHẨN ĐOÁN AI (Requirement 8 & 9) */}
          {report.smallestFailedTest && (
            <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/30 space-y-4 animate-fadeIn">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-rose-500/20">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span className="text-xs sm:text-sm font-bold text-rose-200">
                    Test sai nhỏ nhất cần quan sát: {report.smallestFailedTest.test.label || `#${report.smallestFailedTest.index}`}
                  </span>
                </div>

                {/* NÚT MÔ PHỎNG CODE CỦA EM TRÊN TEST NÀY (Requirement 9) */}
                <button type="button"
                  onClick={() => handleSimulateOnTest(report.smallestFailedTest!)}
                  disabled={isTracing}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>{isTracing ? 'Đang nạp mô phỏng...' : 'Mô phỏng code của em trên test này'}</span>
                </button>
              </div>

              {traceError && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{traceError}</span>
                </div>
              )}

              {/* Chi tiết Input - Expected - Actual */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-500 mb-1 text-[11px] font-sans">Đầu vào (Input):</div>
                  <pre className="text-slate-200 whitespace-pre-wrap">{report.smallestFailedTest.test.input || '(rỗng)'}</pre>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-emerald-400 mb-1 text-[11px] font-sans">Đáp án mong đợi (Expected):</div>
                  <pre className="text-emerald-300 whitespace-pre-wrap">{report.smallestFailedTest.expectedOutput}</pre>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-rose-400 mb-1 text-[11px] font-sans">Đầu ra thực tế (Actual):</div>
                  <pre className="text-rose-300 whitespace-pre-wrap">
                    {report.smallestFailedTest.actualOutput || (report.smallestFailedTest.error?.message ?? '(rỗng)')}
                  </pre>
                </div>
              </div>

              {/* KHUNG GỢI Ý & PHÂN TÍCH AI (Requirement 8) */}
              <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-blue-300">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                    Chẩn đoán lỗi & Hướng gỡ lỗi:
                  </span>
                  {isDiagnosing && <span className="text-[11px] text-blue-400 animate-pulse">Đang phân tích...</span>}
                </div>

                {diagnostic ? (
                  <div className="space-y-2 text-xs text-blue-200 leading-relaxed font-sans">
                    <div className="font-semibold text-blue-100 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      Loại bẫy: {diagnostic.trapTitle}
                    </div>
                    <p>{diagnostic.analysis}</p>
                    <div className="p-2.5 rounded-lg bg-blue-900/30 border border-blue-500/30 text-blue-100 font-medium italic">
                      ❓ Gợi mở: {diagnostic.pedagogicalQuestion}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    Hãy kiểm tra lại điều kiện biên hoặc vòng lặp của em.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL MÔ PHỎNG CODE HỌC SINH (Requirement 9) */}
      {traceData && (
        <StudentTraceModal
          studentCode={code}
          testInput={traceData.testInput}
          steps={traceData.steps}
          finalOutput={traceData.finalOutput}
          expectedOutput={traceData.expectedOutput}
          runtimeError={traceData.runtimeError}
          standardLesson={source.lessons[0]}
          onClose={() => setTraceData(null)}
        />
      )}
    </div>
  );
};
