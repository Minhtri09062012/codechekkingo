import React, { useState, useMemo } from 'react';
import { LearningSource, LevelProgress, Step } from '../../core/types.ts';
import { useApp } from '../../context/AppContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  selectKeyStepsForPrediction,
  generateQuestionForStep,
  DeterministicQuestion,
} from '../../core/predictionGenerator.ts';
import { evaluateStudentAnswer } from '../../ai/gemini.ts';
import { AiRubricEvaluation } from '../../ai/aiPrompts.ts';
import { resolveRenderer } from '../renderers/index.tsx';
import {
  Eye,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Send,
  Lock,
  Unlock,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  TrendingUp,
  Award,
} from 'lucide-react';

interface Level2PredictionPanelProps {
  source: LearningSource;
  activeLessonIndex?: number;
}

export const Level2PredictionPanel: React.FC<Level2PredictionPanelProps> = ({
  source,
  activeLessonIndex = 0,
}) => {
  const { state, dispatch } = useApp();
  const { awardXp } = useAuth();
  const currentLesson = source.lessons[activeLessonIndex] || source.lessons[0];
  const rubric = source.rubric;

  const progressKey = `${source.id}|2`;
  const savedProgress: LevelProgress = state.progress.levels[progressKey] || {
    attempts: 0,
    matchedIdeas: [],
    hintLevel: 1,
    codeUnlocked: false,
    stagesDone: 0,
    predictRight: 0,
    predictTotal: 0,
  };

  // 1. Sinh các bước mô phỏng cho preset đầu tiên
  const steps = useMemo<Step[]>(() => {
    if (!currentLesson) return [];
    try {
      const parsed = currentLesson.sample.parse(currentLesson.sample.defaultInput);
      if (parsed.ok) {
        return currentLesson.generateSteps(parsed.value);
      }
    } catch {
      // fallback
    }
    return [];
  }, [currentLesson]);

  // 2. Chọn tối đa 5 bước quan trọng để hỏi
  const keyStepIndices = useMemo(() => {
    if (!currentLesson || steps.length === 0) return [];
    return selectKeyStepsForPrediction(steps, currentLesson.code.length);
  }, [steps, currentLesson]);

  // Trạng thái dự đoán câu hỏi hiện tại
  const [currentPredictIdx, setCurrentPredictIdx] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [sessionRight, setSessionRight] = useState(savedProgress.predictRight);
  const [sessionTotal, setSessionTotal] = useState(savedProgress.predictTotal);
  const [predictionFinished, setPredictionFinished] = useState(
    savedProgress.predictTotal >= keyStepIndices.length && keyStepIndices.length > 0
  );

  // Câu hỏi cho bước hiện tại
  const activeStepTargetIndex = keyStepIndices[currentPredictIdx] ?? 0;
  const currentStep = steps[activeStepTargetIndex];

  const currentQuestion = useMemo<DeterministicQuestion | null>(() => {
    if (!currentLesson || steps.length === 0 || keyStepIndices.length === 0) return null;
    return generateQuestionForStep(
      activeStepTargetIndex,
      steps,
      currentLesson.code.length,
      currentPredictIdx % 2 === 0 ? 'line' : 'var'
    );
  }, [activeStepTargetIndex, steps, currentLesson, currentPredictIdx]);

  // Trạng thái rút ra quy tắc thuật toán
  const [ruleText, setRuleText] = useState('');
  const [complexityText, setComplexityText] = useState('');
  const [isSubmittingRule, setIsSubmittingRule] = useState(false);
  const [ruleEvaluation, setRuleEvaluation] = useState<AiRubricEvaluation | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  // Kiểm tra điều kiện mở khóa code (công nhận >= 2/3 ý và đã hoàn thành dự đoán)
  const totalIdeas = rubric.keyIdeas.length;
  const matchedCount = savedProgress.matchedIdeas.length;
  const isRuleAccepted = matchedCount / totalIdeas >= 2 / 3;
  const isCodeUnlocked = savedProgress.codeUnlocked || (predictionFinished && isRuleAccepted);

  // Xử lý chọn đáp án dự đoán
  const handleSelectOption = (opt: string) => {
    if (hasAnswered || !currentQuestion) return;

    setSelectedAnswer(opt);
    setHasAnswered(true);

    const isCorrect = opt === currentQuestion.correctAnswer;
    const nextRight = isCorrect ? sessionRight + 1 : sessionRight;
    const nextTotal = sessionTotal + 1;

    setSessionRight(nextRight);
    setSessionTotal(nextTotal);

    dispatch({
      type: 'UPDATE_LEVEL_PROGRESS',
      payload: {
        sourceId: source.id,
        level: 2,
        data: {
          predictRight: nextRight,
          predictTotal: nextTotal,
        },
      },
    });
  };

  // Sang câu hỏi dự đoán kế tiếp
  const handleNextPrediction = () => {
    if (currentPredictIdx + 1 < keyStepIndices.length) {
      setCurrentPredictIdx(currentPredictIdx + 1);
      setSelectedAnswer(null);
      setHasAnswered(false);
    } else {
      setPredictionFinished(true);
    }
  };

  // Làm lại chuỗi dự đoán
  const handleResetPrediction = () => {
    setCurrentPredictIdx(0);
    setSelectedAnswer(null);
    setHasAnswered(false);
    setSessionRight(0);
    setSessionTotal(0);
    setPredictionFinished(false);
  };

  // Gửi quy tắc thuật toán cho AI / Fallback chấm
  const handleSubmitRule = async () => {
    if (!ruleText.trim() || isSubmittingRule) return;

    setIsSubmittingRule(true);
    const newAttempts = savedProgress.attempts + 1;

    const fullStudentSubmission =
      currentLesson?.compare && complexityText.trim()
        ? `${ruleText}\nĐộ phức tạp: ${complexityText}`
        : ruleText;

    try {
      const res = await evaluateStudentAnswer({
        statement: source.task.statement,
        rubric,
        studentText: fullStudentSubmission,
        attemptNo: newAttempts,
        hiddenReference: source.task.referenceSolution,
        mode: 'level2_rule',
      });

      setRuleEvaluation(res.evaluation);
      setIsFallbackMode(res.isFallback);

      const combinedMatched = Array.from(
        new Set([...savedProgress.matchedIdeas, ...res.evaluation.matchedIdeaIds])
      );

      const unlock = combinedMatched.length / totalIdeas >= 2 / 3;

      dispatch({
        type: 'UPDATE_LEVEL_PROGRESS',
        payload: {
          sourceId: source.id,
          level: 2,
          data: {
            attempts: newAttempts,
            matchedIdeas: combinedMatched,
            codeUnlocked: unlock,
          },
        },
      });

      if (unlock && !state.progress.understood.includes(source.id)) {
        dispatch({ type: 'TOGGLE_UNDERSTOOD', payload: source.id });
        awardXp('quiz_passed', source.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingRule(false);
    }
  };

  const RendererComponent = currentLesson ? resolveRenderer(currentLesson) : null;

  return (
    <div className="space-y-6">
      {/* 1. Tiêu đề hướng dẫn Cấp 2 */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Eye className="w-4 h-4 text-blue-400" />
            Chế độ quan sát & Dự đoán diễn biến thuật toán
          </div>
          <span className="text-[11px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">
            Ẩn mã nguồn mẫu
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Ở cấp độ này, mã nguồn mẫu được ẩn đi. Em sẽ quan sát sự biến đổi của các ô nhớ và dự đoán
          hành vi của thuật toán tại các bước then chốt.
        </p>
      </div>

      {/* 2. KHUNG QUAN SÁT MÔ PHỎNG (Chỉ hiện Renderer, ẨN code mẫu và ẨN lineNotes) */}
      {currentStep && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
            <span className="text-slate-400 font-medium">
              Bước hiện tại: <strong className="text-slate-200">#{activeStepTargetIndex + 1}</strong> / {steps.length}
            </span>
            <span className="text-slate-500 font-mono">
              Phép tính tích lũy: {currentStep.ops} ops
            </span>
          </div>

          {/* Visual Renderer */}
          <div className="min-h-[160px] flex items-center justify-center">
            {RendererComponent && <RendererComponent step={currentStep} />}
          </div>

          {/* Biến số hiện tại */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 text-xs flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-semibold">Các ô nhớ hiện thời:</span>
            {Object.entries(currentStep.vars).map(([k, v]) => (
              <span
                key={k}
                className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-300 text-[11px]"
              >
                <strong className="text-blue-400">{k}</strong> = {String(v)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. PHẦN CÂU HỎI DỰ ĐOÁN (Chế độ Dự đoán) */}
      {!predictionFinished && currentQuestion ? (
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-blue-500/30 space-y-4 shadow-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-blue-300 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              Câu hỏi dự đoán #{currentPredictIdx + 1} / {keyStepIndices.length}:
            </span>
            <span className="text-slate-400 font-mono">
              Đúng: <strong className="text-emerald-400">{sessionRight}</strong> / {sessionTotal}
            </span>
          </div>

          <div className="text-sm font-semibold text-slate-100 leading-snug">
            {currentQuestion.prompt}
          </div>

          {/* 4 phương án lựa chọn */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {currentQuestion.options.map((opt, i) => {
              const isSelected = selectedAnswer === opt;
              const isCorrect = opt === currentQuestion.correctAnswer;

              let btnClasses =
                'p-3 rounded-xl text-xs sm:text-sm font-semibold border text-left transition-all cursor-pointer flex items-center justify-between ';

              if (!hasAnswered) {
                btnClasses +=
                  'bg-slate-950 border-slate-800 text-slate-300 hover:bg-blue-600/20 hover:border-blue-500/50 hover:text-white';
              } else if (isCorrect) {
                btnClasses += 'bg-emerald-950/60 border-emerald-500 text-emerald-200';
              } else if (isSelected && !isCorrect) {
                btnClasses += 'bg-rose-950/60 border-rose-500 text-rose-200';
              } else {
                btnClasses += 'bg-slate-950/40 border-slate-800/40 text-slate-600 opacity-60';
              }

              return (
                <button type="button"
                  key={i}
                  disabled={hasAnswered}
                  onClick={() => handleSelectOption(opt)}
                  className={btnClasses}
                >
                  <span>{opt}</span>
                  {hasAnswered && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                  {hasAnswered && isSelected && !isCorrect && (
                    <XCircle className="w-4 h-4 text-rose-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Giải thích sau khi chọn */}
          {hasAnswered && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-fadeIn">
              <div className="text-xs text-slate-300 leading-relaxed">
                <span className="font-bold text-slate-200">Kết quả thực tế: </span>
                {currentQuestion.explain}
              </div>

              <div className="flex justify-end pt-1">
                <button type="button"
                  onClick={handleNextPrediction}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 transition-colors shadow-md shadow-blue-600/30 cursor-pointer"
                >
                  <span>
                    {currentPredictIdx + 1 < keyStepIndices.length ? 'Bước tiếp theo' : 'Xem tổng kết dự đoán'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Bảng tổng kết chuỗi dự đoán */
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Award className="w-4 h-4" />
              Đã hoàn thành chuỗi dự đoán các bước then chốt!
            </div>
            <button type="button"
              onClick={handleResetPrediction}
              className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Làm lại dự đoán
            </button>
          </div>

          <p className="text-xs text-slate-300">
            Kết quả của em: <strong className="text-emerald-400">{sessionRight}</strong> /{' '}
            {sessionTotal} bước chính xác.
          </p>
        </div>
      )}

      {/* 4. Ô "Em rút ra quy tắc của thuật toán" */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-200">
              Em rút ra quy tắc tổng quát của thuật toán là gì?
            </h3>
          </div>
          {isCodeUnlocked ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <Unlock className="w-3.5 h-3.5" /> Code đã mở khóa
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-medium">
              <Lock className="w-3.5 h-3.5" /> Cần đạt ≥ 2/3 ý
            </span>
          )}
        </div>

        <p className="text-xs text-slate-400">
          Dựa trên việc quan sát ô nhớ và dự đoán dòng lệnh, hãy tóm tắt lại nguyên lý hoạt động của
          thuật toán bằng ngôn ngữ của em.
        </p>

        <textarea
          rows={3}
          value={ruleText}
          onChange={(e) => setRuleText(e.target.value)}
          placeholder="Ví dụ: Khi gặp giá trị lớn hơn max hiện tại, thuật toán sẽ cập nhật lại giá trị max và ghi nhớ vị trí..."
          className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-sans leading-relaxed"
        />

        {/* Câu hỏi độ phức tạp nếu bài có compare */}
        {currentLesson?.compare && (
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-semibold text-slate-300">
              Độ phức tạp thời gian/bộ nhớ của cách làm này là gì?
            </label>
            <input
              type="text"
              value={complexityText}
              onChange={(e) => setComplexityText(e.target.value)}
              placeholder="Ví dụ: O(n) thời gian, O(1) bộ nhớ"
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-mono"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-500">
            Tiến độ quy tắc: {matchedCount}/{totalIdeas} ý cốt lõi ({Math.round((matchedCount / totalIdeas) * 100)}%)
          </span>

          <button type="button"
            onClick={handleSubmitRule}
            disabled={!ruleText.trim() || isSubmittingRule}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer ${
              !ruleText.trim() || isSubmittingRule
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-purple-600 text-white hover:bg-purple-500 shadow-purple-600/30'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmittingRule ? 'Đang đánh giá...' : 'Gửi quy tắc'}</span>
          </button>
        </div>

        {/* Nhận xét quy tắc */}
        {ruleEvaluation && (
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-purple-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Đánh giá quy tắc của em:
            </div>
            <p className="text-slate-200 leading-relaxed">{ruleEvaluation.praise}</p>
            {ruleEvaluation.nextQuestion && (
              <p className="text-blue-300 font-medium">{ruleEvaluation.nextQuestion}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
