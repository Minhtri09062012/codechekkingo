import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { useApp } from '../../context/AppContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { routes } from '../../core/routes.ts';
import {
  placementQuestions,
  getTopicQuestions,
  TopicQuestions,
  PredictQuestion,
  CodeQuestion,
} from '../../placement/questions.ts';
import { TOPIC_NAMES, PlacementResult, RegisteredLesson } from '../../core/types.ts';
import { allRegisteredLessons, getMissingPrerequisites } from '../../core/registry.ts';
import { gradeSubmission, normalizeOutput } from '../../runner/testSuite.ts';
import {
  Compass,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Sliders,
  Award,
  BookOpen,
  Code2,
  HelpCircle,
  Save,
  Check,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

type StepPhase = 'intro' | 'testing' | 'result';

export const PlacementPage: React.FC = () => {
  const { state, dispatch } = useApp();
  const { awardXp } = useAuth();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<StepPhase>(
    state.progress.placement ? 'result' : 'intro'
  );

  // Trạng thái kiểm tra thích ứng
  const [currentTopicNo, setCurrentTopicNo] = useState<number>(3); // Bắt đầu từ chuyên đề 3
  const [currentSubQuestion, setCurrentSubQuestion] = useState<'a' | 'b'>('a');
  const [consecutiveWrong, setConsecutiveWrong] = useState<number>(0);
  const [testedTopics, setTestedTopics] = useState<number[]>([]);

  // Lưu câu trả lời từng câu
  const [answers, setAnswers] = useState<
    Record<string, { answer: string; isCorrect: boolean }>
  >(state.progress.placement?.answers || {});

  // Dữ liệu nhập cho câu dự đoán hiện tại
  const [predictInput, setPredictInput] = useState<string>('');
  const [predictFeedback, setPredictFeedback] = useState<{
    submitted: boolean;
    isCorrect: boolean;
    msg: string;
  } | null>(null);

  // Dữ liệu code cho câu code hiện tại
  const [userCode, setUserCode] = useState<string>('');
  const [isRunningCode, setIsRunningCode] = useState<boolean>(false);
  const [codeGradeFeedback, setCodeGradeFeedback] = useState<{
    submitted: boolean;
    isCorrect: boolean;
    msg: string;
  } | null>(null);

  // Kết quả đánh giá (có thể chỉnh sửa tay)
  const [editableMastery, setEditableMastery] = useState<
    Record<number, 'mastered' | 'review' | 'not-started'>
  >(
    state.progress.placement?.topicMastery || {
      1: 'mastered',
      2: 'mastered',
      3: 'review',
      4: 'not-started',
      5: 'not-started',
      6: 'not-started',
      7: 'not-started',
      8: 'not-started',
      9: 'not-started',
      10: 'not-started',
      11: 'not-started',
    }
  );

  const [editableLevels, setEditableLevels] = useState<
    Record<number, 1 | 2 | 3 | 4>
  >(
    state.progress.placement?.recommendedLevels || {
      1: 4,
      2: 4,
      3: 3,
      4: 2,
      5: 2,
      6: 1,
      7: 1,
      8: 1,
      9: 1,
      10: 1,
      11: 1,
    }
  );

  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const advanceTimerRef = useRef<number | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  const clearAdvanceTimer = () => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearAdvanceTimer();
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, []);

  // Lấy câu hỏi hiện tại
  const currentTopicData = useMemo(() => {
    return getTopicQuestions(currentTopicNo) || placementQuestions[0];
  }, [currentTopicNo]);

  // Cập nhật starter code khi chuyển câu
  useEffect(() => {
    if (currentSubQuestion === 'b') {
      setUserCode(currentTopicData.codeQuestion.starterCode);
      setCodeGradeFeedback(null);
    } else {
      setPredictInput('');
      setPredictFeedback(null);
    }
  }, [currentTopicNo, currentSubQuestion, currentTopicData]);

  // Bắt đầu làm bài test
  const handleStartTest = () => {
    clearAdvanceTimer();
    setCurrentTopicNo(3);
    setCurrentSubQuestion('a');
    setConsecutiveWrong(0);
    setTestedTopics([3]);
    setAnswers({});
    setPredictInput('');
    setPredictFeedback(null);
    setCodeGradeFeedback(null);
    setPhase('testing');
  };

  // Hoàn thành và tính toán kết quả tự động
  const finalizePlacement = (finalAnswers: Record<string, { answer: string; isCorrect: boolean }>, lastWrongCount: number) => {
    clearAdvanceTimer();
    const mastery: Record<number, 'mastered' | 'review' | 'not-started'> = {};
    const levels: Record<number, 1 | 2 | 3 | 4> = {};

    // Đánh giá từng chuyên đề
    for (let t = 1; t <= 11; t++) {
      const qAKey = `placement-t${t}-predict`;
      const qBKey = `placement-t${t}-code`;

      const hasA = qAKey in finalAnswers;
      const hasB = qBKey in finalAnswers;

      if (!hasA && !hasB) {
        if (t < currentTopicNo && lastWrongCount === 0) {
          mastery[t] = 'mastered';
          levels[t] = 4;
        } else if (t < currentTopicNo) {
          mastery[t] = 'review';
          levels[t] = 3;
        } else {
          mastery[t] = 'not-started';
          levels[t] = 1;
        }
      } else {
        const correctCount =
          (finalAnswers[qAKey]?.isCorrect ? 1 : 0) +
          (finalAnswers[qBKey]?.isCorrect ? 1 : 0);

        if (correctCount >= 2) {
          mastery[t] = 'mastered';
          levels[t] = 4;
        } else if (correctCount === 1) {
          mastery[t] = 'review';
          levels[t] = 3;
        } else {
          mastery[t] = 'review';
          levels[t] = 2;
        }
      }
    }

    setEditableMastery(mastery);
    setEditableLevels(levels);

    const recLesson = computeRecommendedLesson(mastery);

    const placementRes: PlacementResult = {
      completedAt: new Date().toISOString(),
      topicMastery: mastery,
      recommendedLessonId: recLesson?.id || 'algo-min-max',
      recommendedLevels: levels,
      answers: finalAnswers,
    };

    dispatch({ type: 'SAVE_PLACEMENT', payload: placementRes });
    awardXp('quiz_passed', 'placement-test', { topicsMastered: Object.values(mastery).filter((m) => m === 'mastered').length });
    setPhase('result');
  };

  // Xử lý nộp câu dự đoán (Câu A)
  const handleCheckPredict = () => {
    if (predictFeedback?.submitted || !predictInput.trim()) return;
    const q = currentTopicData.predictQuestion;
    const isCorrect =
      normalizeOutput(predictInput) === normalizeOutput(q.expectedOutput);

    const newAnswers = {
      ...answers,
      [q.id]: { answer: predictInput, isCorrect },
    };
    setAnswers(newAnswers);

    const newWrongCount = isCorrect ? 0 : consecutiveWrong + 1;
    setConsecutiveWrong(newWrongCount);

    setPredictFeedback({
      submitted: true,
      isCorrect,
      msg: isCorrect
        ? 'Chính xác! Em dự đoán đúng đầu ra của đoạn mã.'
        : `Chưa đúng! Đáp án chính xác là: "${q.expectedOutput}".`,
    });

    clearAdvanceTimer();
    // Nếu sai 2 câu liên tiếp -> DỪNG NGAY
    if (newWrongCount >= 2) {
      advanceTimerRef.current = window.setTimeout(() => {
        finalizePlacement(newAnswers, newWrongCount);
      }, 1500);
      return;
    }

    // Chuyển sang câu (b) của cùng chuyên đề sau 1.2s
    advanceTimerRef.current = window.setTimeout(() => {
      setCurrentSubQuestion('b');
    }, 1200);
  };

  // Xử lý nộp bài code (Câu B)
  const handleCheckCode = async () => {
    setIsRunningCode(true);
    const q = currentTopicData.codeQuestion;

    try {
      const taskDummy = {
        kind: 'code' as const,
        statement: q.statement,
        inputFormat: q.inputFormat,
        outputFormat: q.outputFormat,
        constraints: '',
        examples: [],
        ioMode: { kind: 'stdio' as const },
        referenceSolution: q.referenceSolution,
        tests: q.tests,
        starterCode: q.starterCode,
        analysis: { maxN: '1000', expectedComplexities: ['O(N)'] },
      };

      const report = await gradeSubmission(
        q.id,
        taskDummy,
        [],
        userCode
      );

      const isCorrect = report.score >= 100 || report.passedCount === report.totalTests;

      const newAnswers = {
        ...answers,
        [q.id]: { answer: userCode, isCorrect },
      };
      setAnswers(newAnswers);

      const newWrongCount = isCorrect ? 0 : consecutiveWrong + 1;
      setConsecutiveWrong(newWrongCount);

      setCodeGradeFeedback({
        submitted: true,
        isCorrect,
        msg: isCorrect
          ? `Xuất sắc! Đã vượt qua toàn bộ ${report.totalTests}/${report.totalTests} bộ test.`
          : `Đạt ${report.passedCount}/${report.totalTests} test. ${report.summaryMessage}`,
      });

      clearAdvanceTimer();
      // Nếu sai 2 câu liên tiếp -> DỪNG NGAY
      if (newWrongCount >= 2) {
        advanceTimerRef.current = window.setTimeout(() => {
          finalizePlacement(newAnswers, newWrongCount);
        }, 1500);
        return;
      }

      // Nếu đúng hoặc chỉ mới sai 1 câu, tiến lên chuyên đề tiếp theo
      advanceTimerRef.current = window.setTimeout(() => {
        if (currentTopicNo < 11) {
          const nextTopic = currentTopicNo + 1;
          setCurrentTopicNo(nextTopic);
          setCurrentSubQuestion('a');
          if (!testedTopics.includes(nextTopic)) {
            setTestedTopics([...testedTopics, nextTopic]);
          }
        } else {
          // Đã hoàn thành cả 11 chuyên đề
          finalizePlacement(newAnswers, newWrongCount);
        }
      }, 1500);
    } catch (err: any) {
      setCodeGradeFeedback({
        submitted: true,
        isCorrect: false,
        msg: `Lỗi khi chạy code: ${err?.message || 'Không thể thực thi'}`,
      });
    } finally {
      setIsRunningCode(false);
    }
  };

  // Tính bài học bắt đầu đề xuất
  const computeRecommendedLesson = (
    masteryMap: Record<number, 'mastered' | 'review' | 'not-started'>
  ): RegisteredLesson | undefined => {
    // Tìm chuyên đề yếu nhất (chuyên đề đầu tiên 'review', nếu không có thì 'not-started')
    let weakestTopic = 1;
    for (let t = 1; t <= 11; t++) {
      if (masteryMap[t] === 'review') {
        weakestTopic = t;
        break;
      }
    }

    const readyLessons = allRegisteredLessons.filter(
      (l) => l.status === 'ready' && !state.progress.understood.includes(l.id)
    );

    // Tìm bài thuộc chuyên đề yếu nhất
    let target = readyLessons.find((l) => {
      if (weakestTopic === 1) return l.kind === 'concept' && l.groupOrder <= 3;
      if (weakestTopic === 2) return l.id === 'algo-sliding-window' || l.id === 'algo-prefix-sum';
      if (weakestTopic === 3) return l.kind === 'algorithm' && l.groupOrder === 3;
      return true;
    });

    if (!target) {
      target = readyLessons[0] || allRegisteredLessons.find((l) => l.status === 'ready');
    }

    if (target) {
      const missingPrereqs = getMissingPrerequisites(target, state.progress.understood);
      if (missingPrereqs.length > 0) {
        const firstPrereq = allRegisteredLessons.find((l) => l.id === missingPrereqs[0].id && l.status === 'ready');
        if (firstPrereq) return firstPrereq;
      }
    }

    return target;
  };

  const recommendedLesson = useMemo(() => {
    return computeRecommendedLesson(editableMastery);
  }, [editableMastery, state.progress.understood]);

  // Lưu chỉnh sửa tay vào ProgressState
  const handleSaveManualChanges = () => {
    const updated: PlacementResult = {
      completedAt: state.progress.placement?.completedAt || new Date().toISOString(),
      topicMastery: editableMastery,
      recommendedLessonId: recommendedLesson?.id || 'algo-min-max',
      recommendedLevels: editableLevels,
      answers,
    };
    dispatch({ type: 'SAVE_PLACEMENT', payload: updated });
    setSaveSuccess(true);
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }
    saveTimerRef.current = window.setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Chuyển đổi trạng thái năng lực khi bấm vào
  const cycleMastery = (topicNo: number) => {
    const curr = editableMastery[topicNo];
    const next =
      curr === 'mastered' ? 'review' : curr === 'review' ? 'not-started' : 'mastered';
    setEditableMastery({ ...editableMastery, [topicNo]: next });
  };

  return (
    <main className={`flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8 ${state.classroomMode ? 'text-lg' : ''}`}>
      {/* ============================================================ */}
      {/* GIAI ĐOẠN 1: GIỚI THIỆU BÀI TEST THÍCH ỨNG */}
      {/* ============================================================ */}
        {phase === 'intro' && (
          <div className="space-y-8 py-4">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold">
                <Compass className="w-4 h-4" />
                Kiểm tra năng lực lập trình thích ứng (Adaptive Placement Test)
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-100 tracking-tight">
                Xác định lộ trình học tối ưu cho em
              </h1>
              <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
                Bài kiểm tra ngắn gồm các câu hỏi từ 11 chuyên đề cốt lõi của Tin học trẻ & HSG Tin.
                Hệ thống bắt đầu từ <strong className="text-blue-300">Chuyên đề 3 (Số học)</strong>:
                nếu làm đúng sẽ tăng dần độ khó; nếu sai 2 câu liên tiếp sẽ tự động dừng và đưa ra lộ trình chính xác nhất.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                  1
                </div>
                <h3 className="font-bold text-slate-200 text-sm">Thuật toán thích ứng</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tự động điều chỉnh theo năng lực thực tế, không lãng phí thời gian vào bài quá dễ hoặc quá khó.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold">
                  2
                </div>
                <h3 className="font-bold text-slate-200 text-sm">Hai dạng câu hỏi</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  (a) Đọc code dự đoán đầu ra và (b) Viết code ngắn kiểm tra tư duy thuật toán thực chiến.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold">
                  3
                </div>
                <h3 className="font-bold text-slate-200 text-sm">Bản đồ 11 chuyên đề</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Nhận ngay bản đồ năng lực (Vững / Cần ôn / Chưa học) và bài bắt đầu phù hợp theo chuẩn HSG.
                </p>
              </div>
            </div>

            <div className="text-center pt-4">
              <button type="button"
                onClick={handleStartTest}
                className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 mx-auto cursor-pointer"
              >
                <span>Bắt đầu bài kiểm tra ngay</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* GIAI ĐOẠN 2: ĐANG LÀM BÀI TEST */}
        {/* ============================================================ */}
        {phase === 'testing' && (
          <div className="space-y-6">
            {/* Thanh tiến trình chuyên đề */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="px-3 py-1 rounded-xl bg-blue-600 text-white text-xs font-bold font-mono">
                  Chuyên đề {currentTopicNo}/11
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-100">
                    {TOPIC_NAMES[currentTopicNo]}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Câu hỏi ({currentSubQuestion.toUpperCase()}):{' '}
                    {currentSubQuestion === 'a' ? 'Dự đoán đầu ra' : 'Luyện viết code ngắn'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Số câu sai liên tiếp:</span>
                <span
                  className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold ${
                    consecutiveWrong > 0
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {consecutiveWrong}/2
                </span>

                <button type="button"
                  onClick={() => finalizePlacement(answers, consecutiveWrong)}
                  className="ml-3 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer border border-slate-700"
                >
                  Dừng & Xem kết quả
                </button>
              </div>
            </div>

            {/* NỘI DUNG CÂU A: DỰ ĐOÁN ĐẦU RA */}
            {currentSubQuestion === 'a' && (
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Câu (a) · Dự đoán đầu ra
                    </span>
                    <h3 className="text-lg font-bold text-slate-100">
                      {currentTopicData.predictQuestion.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300">
                    {currentTopicData.predictQuestion.promptText}
                  </p>
                </div>

                {/* Khối code Python */}
                <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-950">
                  <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
                    <span>Python 3 Code</span>
                    <span className="text-[10px] text-slate-500">Đọc kỹ từng dòng</span>
                  </div>
                  <pre className="p-4 text-xs sm:text-sm font-mono text-slate-200 overflow-x-auto whitespace-pre leading-relaxed">
                    {currentTopicData.predictQuestion.code}
                  </pre>
                </div>

                {/* Ô nhập dự đoán */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-300">
                    Nhập kết quả em dự đoán màn hình sẽ in ra:
                  </label>
                  <div className="flex flex-wrap items-center gap-3">
                    <input
                      type="text"
                      value={predictInput}
                      onChange={(e) => setPredictInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && predictInput.trim() && !predictFeedback?.submitted) {
                          handleCheckPredict();
                        }
                      }}
                      placeholder="Ví dụ: 42 hoặc YES..."
                      disabled={predictFeedback?.submitted}
                      className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 text-sm font-mono focus:outline-none focus:border-blue-500"
                    />
                    <button type="button"
                      onClick={handleCheckPredict}
                      disabled={!predictInput.trim() || predictFeedback?.submitted}
                      className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20 cursor-pointer flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Xác nhận đáp án</span>
                    </button>
                  </div>
                </div>

                {/* Phản hồi */}
                {predictFeedback && (
                  <div
                    className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-3 ${
                      predictFeedback.isCorrect
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {predictFeedback.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 shrink-0 text-rose-400" />
                    )}
                    <span>{predictFeedback.msg}</span>
                  </div>
                )}
              </div>
            )}

            {/* NỘI DUNG CÂU B: VIẾT CODE NGẮN */}
            {currentSubQuestion === 'b' && (
              <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-6 shadow-xl">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      Câu (b) · Viết code Python
                    </span>
                    <h3 className="text-lg font-bold text-slate-100">
                      {currentTopicData.codeQuestion.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                    {currentTopicData.codeQuestion.statement}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-slate-400">
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="font-bold text-slate-300">Đầu vào: </span>
                      {currentTopicData.codeQuestion.inputFormat}
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                      <span className="font-bold text-slate-300">Đầu ra: </span>
                      {currentTopicData.codeQuestion.outputFormat}
                    </div>
                  </div>
                </div>

                {/* Trình soạn thảo CodeMirror */}
                <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-md">
                  <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Code2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>solution.py</span>
                    </div>
                    <span className="text-[10px] text-slate-500">Chạy trực tiếp bằng Pyodide</span>
                  </div>
                  <CodeMirror
                    value={userCode}
                    height="200px"
                    theme={oneDark}
                    extensions={[python()]}
                    onChange={(val) => setUserCode(val)}
                  />
                </div>

                {/* Nút nộp code */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button type="button"
                    onClick={() => setUserCode(currentTopicData.codeQuestion.starterCode)}
                    className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Đặt lại mẫu code</span>
                  </button>

                  <button type="button"
                    onClick={handleCheckCode}
                    disabled={isRunningCode || codeGradeFeedback?.submitted}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-emerald-600/20 cursor-pointer flex items-center gap-2"
                  >
                    {isRunningCode ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Đang chấm test...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        <span>Chấm & Nộp bài</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Phản hồi chấm code */}
                {codeGradeFeedback && (
                  <div
                    className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center gap-3 ${
                      codeGradeFeedback.isCorrect
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {codeGradeFeedback.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 shrink-0 text-rose-400" />
                    )}
                    <span>{codeGradeFeedback.msg}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* GIAI ĐOẠN 3: BẢN ĐỒ NĂNG LỰC & ĐỀ XUẤT LỘ TRÌNH */}
        {/* ============================================================ */}
        {phase === 'result' && (
          <div className="space-y-8 py-2">
            {/* Header kết quả */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      Kết quả đánh giá năng lực
                    </span>
                    {state.progress.placement?.completedAt && (
                      <span className="text-xs text-slate-500 font-mono">
                        {new Date(state.progress.placement.completedAt).toLocaleDateString('vi-VN')}
                      </span>
                    )}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
                    Bản đồ 11 chuyên đề & Lộ trình xuất phát
                  </h1>
                </div>

                <div className="flex items-center gap-2">
                  <button type="button"
                    onClick={handleStartTest}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-700 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Làm lại bài kiểm tra</span>
                  </button>

                  <button type="button"
                    onClick={handleSaveManualChanges}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                  >
                    {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{saveSuccess ? 'Đã lưu!' : 'Lưu kết quả'}</span>
                  </button>
                </div>
              </div>

              {/* KHỐI ĐỀ XUẤT BÀI BẮT ĐẦU */}
              {recommendedLesson && (
                <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Đề xuất bài học xuất phát tối ưu nhất
                    </div>
                    <div className="text-base font-bold text-slate-100">
                      {recommendedLesson.title}
                    </div>
                    <p className="text-xs text-slate-300 max-w-xl">
                      {recommendedLesson.summary}
                    </p>
                  </div>

                  <Link
                    to={`/${recommendedLesson.kind}/${recommendedLesson.id}`}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 transition-all flex items-center gap-2"
                  >
                    <span>Bắt đầu học ngay</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>

            {/* BẢNG ĐỒ NĂNG LỰC THEO 11 CHUYÊN ĐỀ (CHO PHÉP SỬA TAY) */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-blue-400" />
                    <span>Đánh giá chi tiết & Cấp độ hỗ trợ đề xuất</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Học sinh hoặc Huấn luyện viên có thể bấm trực tiếp vào nhãn trạng thái hoặc cấp độ để điều chỉnh tay.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((topicNo) => {
                  const mastery = editableMastery[topicNo] || 'not-started';
                  const level = editableLevels[topicNo] || 1;

                  return (
                    <div
                      key={topicNo}
                      className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          #{topicNo}
                        </span>

                        {/* NÚT CHUYỂN ĐỔI TRẠNG THÁI VỮNG / CẦN ÔN / CHƯA HỌC */}
                        <button type="button"
                          onClick={() => cycleMastery(topicNo)}
                          title="Bấm để đổi trạng thái thủ công"
                          className="cursor-pointer"
                        >
                          {mastery === 'mastered' && (
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 hover:bg-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              Vững vàng
                            </span>
                          )}
                          {mastery === 'review' && (
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 hover:bg-amber-500/30">
                              <AlertTriangle className="w-3 h-3" />
                              Cần ôn tập
                            </span>
                          )}
                          {mastery === 'not-started' && (
                            <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1 hover:bg-slate-700">
                              Chưa học
                            </span>
                          )}
                        </button>
                      </div>

                      <div className="font-bold text-sm text-slate-200">
                        {TOPIC_NAMES[topicNo]}
                      </div>

                      {/* CHỌN CẤP ĐỘ ĐỀ XUẤT 1..4 */}
                      <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Cấp hỗ trợ:</span>
                        <div className="flex items-center gap-1">
                          {([1, 2, 3, 4] as const).map((lvl) => (
                            <button type="button"
                              key={lvl}
                              onClick={() =>
                                setEditableLevels({ ...editableLevels, [topicNo]: lvl })
                              }
                              className={`w-6 h-6 rounded-md text-[11px] font-bold font-mono transition-all cursor-pointer ${
                                level === lvl
                                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                              }`}
                              title={`Cấp ${lvl}: ${
                                lvl === 1
                                  ? 'Khái niệm'
                                  : lvl === 2
                                  ? 'Dự đoán'
                                  : lvl === 3
                                  ? 'Giàn giáo khuyết'
                                  : 'Code độc lập'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>
  );
};

export default PlacementPage;
