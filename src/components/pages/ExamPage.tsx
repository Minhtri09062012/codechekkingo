import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { useApp } from '../../context/AppContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { routes } from '../../core/routes.ts';
import { getExamSets, getExamSet } from '../../problems/sets/index.ts';
import { getProblem, getLessonsOfProblem } from '../../core/registry.ts';
import { Problem, ExamSet, TestCase } from '../../core/types.ts';
import { gradeSubmission, SubmissionReport, SubtaskResult } from '../../runner/testSuite.ts';
import { runPythonTest } from '../../runner/pyRunner.ts';
import {
  Trophy,
  Clock,
  Timer,
  AlertTriangle,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileCode,
  Layers,
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  Send,
  Eye,
  Lock,
  Flame,
} from 'lucide-react';

interface ProblemExamState {
  code: string;
  report?: SubmissionReport;
  score: number;
}

export const ExamPage: React.FC = () => {
  const { setId } = useParams<{ setId?: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useApp();
  const { awardXp } = useAuth();

  const allSets = useMemo(() => getExamSets(), []);
  const currentSet: ExamSet = useMemo(() => {
    if (setId) {
      const found = getExamSet(setId);
      if (found) return found;
    }
    return allSets[0];
  }, [setId, allSets]);

  // Lấy danh sách 4 bài tập trong bộ đề
  const problems: Problem[] = useMemo(() => {
    return currentSet.problemIds
      .map((id) => getProblem(id))
      .filter((p): p is Problem => p !== undefined);
  }, [currentSet]);

  const [examStatus, setExamStatus] = useState<'idle' | 'running' | 'submitted'>('idle');
  const [activeProblemIdx, setActiveProblemIdx] = useState<number>(0);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(currentSet.durationMin * 60);

  // Lưu code và kết quả chấm của từng bài
  const [problemStates, setProblemStates] = useState<Record<string, ProblemExamState>>({});

  // Khởi tạo code mẫu khi bắt đầu thi
  const initializeExamStates = () => {
    const initial: Record<string, ProblemExamState> = {};
    for (const prob of problems) {
      initial[prob.id] = {
        code: prob.task.starterCode || '# Viết code giải bài toán ở đây\nimport sys\n',
        score: 0,
      };
    }
    setProblemStates(initial);
  };

  // Trạng thái chạy thử đơn lẻ
  const [customInput, setCustomInput] = useState<string>('');
  const [customOutput, setCustomOutput] = useState<string>('');
  const [isRunningCustom, setIsRunningCustom] = useState<boolean>(false);

  // Trạng thái nộp chấm bài hiện tại
  const [isGrading, setIsGrading] = useState<boolean>(false);
  const [gradingProgress, setGradingProgress] = useState<string>('');
  const [confirmSubmit, setConfirmSubmit] = useState<boolean>(false);

  const problemStatesRef = useRef<Record<string, ProblemExamState>>(problemStates);
  problemStatesRef.current = problemStates;
  const handleSubmitAllRef = useRef<() => Promise<void>>(async () => {});

  const activeProblem = problems[activeProblemIdx] || problems[0];

  // Reset phòng thi khi đổi bộ đề (setId)
  useEffect(() => {
    setExamStatus('idle');
    setActiveProblemIdx(0);
    setSecondsRemaining(currentSet.durationMin * 60);
    setProblemStates({});
    setCustomInput('');
    setCustomOutput('');
    setConfirmSubmit(false);
  }, [currentSet.id, currentSet.durationMin]);

  // Bắt đầu làm bài thi
  const handleStartExam = () => {
    initializeExamStates();
    setActiveProblemIdx(0);
    setConfirmSubmit(false);
    setCustomInput('');
    setCustomOutput('');
    setSecondsRemaining(currentSet.durationMin * 60);
    setExamStatus('running');
  };

  // Tự động đếm ngược ổn định (chỉ phụ thuộc examStatus)
  useEffect(() => {
    if (examStatus !== 'running') return;

    const timer = window.setInterval(() => {
      setSecondsRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [examStatus]);

  // Tự động nộp bài khi đồng hồ về 0
  useEffect(() => {
    if (examStatus === 'running' && secondsRemaining === 0) {
      handleSubmitAllRef.current();
    }
  }, [examStatus, secondsRemaining]);

  // Định dạng thời gian MM:SS hoặc HH:MM:SS
  const formatTime = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Cập nhật code của bài hiện tại
  const handleCodeChange = (val: string) => {
    if (!activeProblem) return;
    setProblemStates((prev) => ({
      ...prev,
      [activeProblem.id]: {
        ...prev[activeProblem.id],
        code: val,
      },
    }));
  };

  // Chạy thử với test công khai hoặc input tự nhập
  const handleRunCustomTest = async () => {
    if (!activeProblem) return;
    setIsRunningCustom(true);
    setCustomOutput('Đang chạy code bằng Pyodide...');

    try {
      const code = problemStates[activeProblem.id]?.code || '';
      const inputToRun =
        customInput.trim() ||
        activeProblem.task.examples[0]?.input ||
        '';

      const res = await runPythonTest(
        code,
        inputToRun,
        activeProblem.task.ioMode,
        activeProblem.task.timeLimitSec || 3
      );

      if (res.status === 'ok') {
        setCustomOutput(res.output || '(Không có output ra stdout)');
      } else {
        setCustomOutput(res.error?.message || `Lỗi: ${res.status}`);
      }
    } catch (e: any) {
      setCustomOutput(`Lỗi thực thi: ${e?.message || e}`);
    } finally {
      setIsRunningCustom(false);
    }
  };

  // Nộp chấm bài hiện tại
  const handleGradeCurrentProblem = async () => {
    if (!activeProblem) return;
    setIsGrading(true);
    setGradingProgress('Đang chấm testcase...');

    try {
      const code = problemStates[activeProblem.id]?.code || '';
      const report = await gradeSubmission(
        activeProblem.id,
        activeProblem.task,
        [],
        code,
        (current, total) => {
          setGradingProgress(`Đang chấm test ${current}/${total}...`);
        }
      );

      setProblemStates((prev) => ({
        ...prev,
        [activeProblem.id]: {
          ...prev[activeProblem.id],
          report,
          score: report.score,
        },
      }));

      // Ghi nhận vào state hệ thống
      dispatch({
        type: 'RECORD_SUBMISSION',
        payload: {
          sourceId: activeProblem.id,
          score: report.score,
          errors: report.errorsToRecord,
        },
      });

      // Trao XP cho tài khoản thật
      awardXp('problem_solved', activeProblem.id, { score: report.score });
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsGrading(false);
      setGradingProgress('');
    }
  };

  // Nộp toàn bộ bài thi
  const handleSubmitAll = async () => {
    setConfirmSubmit(false);
    setIsGrading(true);
    setGradingProgress('Đang chấm toàn bộ bài thi...');

    try {
      const updatedStates = { ...problemStatesRef.current };

      for (const prob of problems) {
        const curr = updatedStates[prob.id];
        if (!curr?.report) {
          const codeToGrade = curr?.code || prob.task.starterCode || '';
          const report = await gradeSubmission(
            prob.id,
            prob.task,
            [],
            codeToGrade
          );
          updatedStates[prob.id] = {
            ...curr,
            code: codeToGrade,
            report,
            score: report.score,
          };

          dispatch({
            type: 'RECORD_SUBMISSION',
            payload: {
              sourceId: prob.id,
              score: report.score,
              errors: report.errorsToRecord,
            },
          });

          awardXp('problem_solved', prob.id, { score: report.score });
        }
      }

      setProblemStates(updatedStates);
      setExamStatus('submitted');
      awardXp('exam_submitted', currentSet.id);
    } catch (e: any) {
      console.error(e);
      setExamStatus('submitted');
    } finally {
      setIsGrading(false);
      setGradingProgress('');
    }
  };
  handleSubmitAllRef.current = handleSubmitAll;

  // Tổng điểm đạt được
  const totalScore = useMemo(() => {
    return Object.values(problemStates).reduce((acc, curr) => acc + (curr.score || 0), 0);
  }, [problemStates]);

  const maxTotalScore = problems.length * 100;

  return (
    <div className={`flex-1 flex flex-col ${state.classroomMode ? 'text-lg' : ''}`}>
      {/* Khi đang thi: Header phòng thi chuyên biệt */}
      {examStatus === 'running' && (
        <header className="sticky top-0 z-40 w-full h-14 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="font-extrabold text-sm sm:text-base text-slate-100 truncate max-w-xs sm:max-w-md">
              {currentSet.title}
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 hidden sm:inline">
              Chế độ thi thật (Tắt mô phỏng & Gợi ý)
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Đồng hồ đếm ngược */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono font-bold text-sm sm:text-base ${
                secondsRemaining < 300
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500 animate-pulse shadow-md shadow-rose-500/30'
                  : secondsRemaining < 600
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-900 text-slate-200 border-slate-700'
              }`}
            >
              <Timer className="w-4 h-4" />
              <span>{formatTime(secondsRemaining)}</span>
            </div>

            {/* Nút nộp toàn bộ bài thi (xác nhận nội tuyến không dùng window.confirm) */}
            {confirmSubmit ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSubmitAll}
                  disabled={isGrading}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Xác nhận nộp
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmSubmit(false)}
                  disabled={isGrading}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmSubmit(true)}
                disabled={isGrading}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Nộp bài thi</span>
              </button>
            )}
          </div>
        </header>
      )}

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* ============================================================ */}
        {/* MÀN HÌNH 1: TRƯỚC KHI BẮT ĐẦU (IDLE) */}
        {/* ============================================================ */}
        {examStatus === 'idle' && (
          <div className="max-w-3xl mx-auto space-y-6 py-6">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-bold">
                <Trophy className="w-4 h-4" />
                Chế độ luyện thi Tin học trẻ & HSG Tin
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-100">
                {currentSet.title}
              </h1>
              <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                {currentSet.description || currentSet.note}
              </p>
            </div>

            {/* Thẻ quy chế phòng thi */}
            <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
              <h3 className="font-bold text-base text-slate-200 flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <span>Quy chế & Đặc điểm phòng thi</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-300">
                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
                  <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-200">Thời gian làm bài: </span>
                    <span>{currentSet.durationMin} phút (tự động nộp khi hết giờ)</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-200">Khóa trợ giúp: </span>
                    <span>Tắt toàn bộ mô phỏng từng bước và gợi ý rubric.</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
                  <Award className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-200">Chấm theo subtask: </span>
                    <span>Hệ thống chấm điểm phân tách theo từng subtask như kỳ thi thật.</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5">
                  <BookOpen className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-200">Xem lại sau thi: </span>
                    <span>Mở khóa toàn bộ mô phỏng & giải thích chi tiết sau khi nộp bài.</span>
                  </div>
                </div>
              </div>

              {/* Danh sách 4 bài trong bộ đề */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Cấu trúc đề thi ({problems.length} bài toán):
                </div>
                <div className="space-y-2">
                  {problems.map((p, idx) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 font-mono font-bold flex items-center justify-center text-xs">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-200">{p.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                          {p.level}
                        </span>
                        <span className="text-slate-400 font-mono">100 điểm</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 text-center">
                <button type="button"
                  onClick={handleStartExam}
                  className="px-8 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 mx-auto cursor-pointer"
                >
                  <Play className="w-5 h-5" />
                  <span>Bắt đầu tính giờ thi</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MÀN HÌNH 2: TRONG KHI THI (RUNNING) */}
        {/* ============================================================ */}
        {examStatus === 'running' && activeProblem && (
          <div className="space-y-4">
            {/* Tabs chọn bài thi */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {problems.map((prob, idx) => {
                const pState = problemStates[prob.id];
                const isSelected = idx === activeProblemIdx;

                return (
                  <button type="button"
                    key={prob.id}
                    onClick={() => setActiveProblemIdx(idx)}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    <span>Bài {idx + 1}: {prob.id.toUpperCase()}</span>
                    {pState?.report && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-950/60 text-[10px] font-mono text-emerald-300">
                        {pState.score}đ
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Khung làm bài: 2 cột (Đề bài & CodeRunner) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* CỘT TRÁI: ĐỀ BÀI VÀ SUBTASKS */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                      <span>Bài {activeProblemIdx + 1}</span>
                      <span>·</span>
                      <span className="px-2 py-0.2 rounded bg-slate-800 text-slate-300">
                        Level {activeProblem.level}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-100 pt-1">
                      {activeProblem.title}
                    </h2>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line font-serif">
                    {activeProblem.task.statement}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800 text-xs text-slate-300">
                    <div>
                      <span className="font-bold text-slate-100">Đầu vào: </span>
                      {activeProblem.task.inputFormat}
                    </div>
                    <div>
                      <span className="font-bold text-slate-100">Đầu ra: </span>
                      {activeProblem.task.outputFormat}
                    </div>
                    <div>
                      <span className="font-bold text-slate-100">Giới hạn: </span>
                      {activeProblem.task.constraints}
                    </div>
                  </div>

                  {/* Bảng phân tích Subtasks */}
                  {activeProblem.task.subtasks && activeProblem.task.subtasks.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Phân bố điểm theo Subtask:
                      </div>
                      <div className="space-y-1.5">
                        {activeProblem.task.subtasks.map((st) => (
                          <div
                            key={st.id}
                            className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs flex items-center justify-between"
                          >
                            <span className="text-slate-300">{st.description}</span>
                            <span className="font-mono font-bold text-amber-400 shrink-0 ml-2">
                              {st.points} điểm
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ví dụ mẫu */}
                  {activeProblem.task.examples.length > 0 && (
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Ví dụ mẫu:
                      </div>
                      {activeProblem.task.examples.map((ex, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-1 font-mono"
                        >
                          <div>
                            <span className="text-slate-500">Input:</span> {ex.input}
                          </div>
                          <div>
                            <span className="text-emerald-400">Output:</span> {ex.output}
                          </div>
                          {ex.note && (
                            <div className="text-slate-400 text-[11px] font-sans">
                              Giải thích: {ex.note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* CỘT PHẢI: TRÌNH CHẠY CODE & CHẤM ĐIỂM */}
              <div className="lg:col-span-7 space-y-4">
                <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-mono font-bold text-slate-200">
                        solution_{activeProblem.id}.py
                      </span>
                    </div>
                    {problemStates[activeProblem.id]?.report && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Điểm bài này: {problemStates[activeProblem.id].score}/100
                      </span>
                    )}
                  </div>

                  {/* Editor CodeMirror */}
                  <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
                    <CodeMirror
                      value={problemStates[activeProblem.id]?.code || ''}
                      height="280px"
                      theme={oneDark}
                      extensions={[python()]}
                      onChange={handleCodeChange}
                    />
                  </div>

                  {/* Thao tác Chạy thử & Nộp bài này */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button type="button"
                      onClick={handleRunCustomTest}
                      disabled={isRunningCustom || isGrading}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 text-blue-400" />
                      <span>{isRunningCustom ? 'Đang chạy...' : 'Chạy thử ví dụ'}</span>
                    </button>

                    <button type="button"
                      onClick={handleGradeCurrentProblem}
                      disabled={isGrading || isRunningCustom}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isGrading ? gradingProgress || 'Đang chấm...' : 'Chấm bài này'}</span>
                    </button>
                  </div>

                  {/* Kết quả chạy thử */}
                  {customOutput && (
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                      <div className="text-[11px] font-mono text-slate-400">Kết quả chạy thử:</div>
                      <pre className="text-xs font-mono text-slate-200 whitespace-pre-wrap">
                        {customOutput}
                      </pre>
                    </div>
                  )}

                  {/* Kết quả chấm Subtask của bài này */}
                  {problemStates[activeProblem.id]?.report && (
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">
                          Bảng điểm Subtask (Bài {activeProblemIdx + 1})
                        </span>
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {problemStates[activeProblem.id].report?.score}/100 điểm
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {problemStates[activeProblem.id].report?.subtaskResults.map((st) => (
                          <div
                            key={st.id}
                            className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs flex items-center justify-between"
                          >
                            <span className="text-slate-400">
                              Subtask {st.id} ({st.passedCount}/{st.testsCount} test)
                            </span>
                            <span
                              className={`font-mono font-bold ${
                                st.earnedPoints === st.points ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {st.earnedPoints}/{st.points} đ
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MÀN HÌNH 3: BẢNG ĐIỂM SAU KHI NỘP BÀI THI (SUBMITTED) */}
        {/* ============================================================ */}
        {examStatus === 'submitted' && (
          <div className="space-y-8 py-4">
            {/* Header kết quả bảng điểm */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4 shadow-2xl relative overflow-hidden">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4" />
                Hoàn thành buổi luyện thi
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-slate-100">
                Bảng điểm tổng kết: {totalScore} / {maxTotalScore}
              </h1>

              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
                Chúc mừng em đã hoàn thành bài thi! Dưới đây là kết quả chi tiết từng bài và từng subtask.
                Toàn bộ mô phỏng trực quan và hướng dẫn giải đã được mở khóa để em đối chiếu.
              </p>

              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button type="button"
                  onClick={() => setExamStatus('idle')}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                >
                  Luyện thi lại
                </button>
                <Link
                  to="/errors"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Xem sổ tay lỗi</span>
                </Link>
              </div>
            </div>

            {/* BẢNG CHI TIẾT TỪNG BÀI TOÁN & SUBTASK */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>Chi tiết điểm thi theo từng bài toán</span>
              </h2>

              <div className="space-y-4">
                {problems.map((prob, idx) => {
                  const pState = problemStates[prob.id];
                  const rep = pState?.report;
                  const lessons = getLessonsOfProblem(prob.id);

                  return (
                    <div
                      key={prob.id}
                      className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-lg"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 font-mono font-bold flex items-center justify-center text-xs">
                              {idx + 1}
                            </span>
                            <h3 className="font-bold text-base text-slate-100">
                              {prob.title}
                            </h3>
                            <span className="text-xs px-2 py-0.2 rounded bg-slate-800 text-slate-300">
                              {prob.level}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-base sm:text-lg font-mono font-black text-emerald-400">
                              {pState?.score || 0} / 100 đ
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Đạt {rep?.passedCount || 0}/{rep?.totalTests || prob.task.tests.length} test
                            </div>
                          </div>

                          {/* NÚT MỞ KHÓA MÔ PHỎNG / GIẢI THÍCH CHI TIẾT */}
                          <Link
                            to={`/problem/${prob.id}`}
                            className="px-4 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem mô phỏng & Lời giải</span>
                          </Link>
                        </div>
                      </div>

                      {/* Chi tiết từng subtask */}
                      {rep && rep.subtaskResults.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80">
                          {rep.subtaskResults.map((st) => (
                            <div
                              key={st.id}
                              className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                                st.earnedPoints === st.points
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                  : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold">Subtask {st.id}</span>
                                <div className="text-[11px] opacity-80">
                                  {st.passedCount}/{st.testsCount} test hợp lệ
                                </div>
                              </div>
                              <span className="font-mono font-black text-sm">
                                {st.earnedPoints}/{st.points} đ
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ExamPage;
