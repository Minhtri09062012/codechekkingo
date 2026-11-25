import React, { useState } from 'react';
import { LearningSource, LevelProgress, Rubric } from '../../core/types.ts';
import { useApp } from '../../context/AppContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { evaluateStudentAnswer } from '../../ai/gemini.ts';
import { AiRubricEvaluation } from '../../ai/aiPrompts.ts';
import {
  Sparkles,
  Send,
  CheckCircle2,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  Eye,
  Lock,
  Unlock,
  Loader2,
  FileCode,
} from 'lucide-react';
import { SimulationView } from '../simulation/SimulationView.tsx';

interface Level1ConceptPanelProps {
  source: LearningSource;
  activeLessonIndex?: number;
}

export const Level1ConceptPanel: React.FC<Level1ConceptPanelProps> = ({
  source,
  activeLessonIndex = 0,
}) => {
  const { state, dispatch } = useApp();
  const { awardXp } = useAuth();
  const currentLesson = source.lessons[activeLessonIndex] || source.lessons[0];
  const rubric = source.rubric;
  const task = source.task;

  const progressKey = `${source.id}|1`;
  const savedProgress: LevelProgress = state.progress.levels[progressKey] || {
    attempts: 0,
    matchedIdeas: [],
    hintLevel: 1,
    codeUnlocked: false,
    stagesDone: 0,
    predictRight: 0,
    predictTotal: 0,
  };

  const [studentText, setStudentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState<AiRubricEvaluation | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [showSimModal, setShowSimModal] = useState(false);

  const matchedSet = new Set(savedProgress.matchedIdeas);
  const totalIdeas = rubric.keyIdeas.length;
  const isAllMatched = matchedSet.size >= totalIdeas || savedProgress.codeUnlocked;

  const handleSubmit = async () => {
    if (!studentText.trim() || isLoading) return;

    setIsLoading(true);
    setStatusNotice(null);

    const newAttempts = savedProgress.attempts + 1;

    try {
      const res = await evaluateStudentAnswer({
        statement: task.statement,
        rubric,
        studentText,
        attemptNo: newAttempts,
        previousFeedback: evaluation?.nextQuestion,
        hiddenReference: task.referenceSolution,
        mode: 'level1',
      });

      setEvaluation(res.evaluation);
      setIsFallbackMode(res.isFallback);
      if (res.statusMessage) setStatusNotice(res.statusMessage);

      // Cập nhật danh sách ý đã đạt tích lũy
      const combinedMatched = Array.from(
        new Set([...savedProgress.matchedIdeas, ...res.evaluation.matchedIdeaIds])
      );

      const codeUnlockedNow = combinedMatched.length >= totalIdeas;

      dispatch({
        type: 'UPDATE_LEVEL_PROGRESS',
        payload: {
          sourceId: source.id,
          level: 1,
          data: {
            attempts: newAttempts,
            matchedIdeas: combinedMatched,
            hintLevel: res.evaluation.hintLevel,
            codeUnlocked: codeUnlockedNow,
          },
        },
      });

      // Nếu đã đạt đủ ý, đồng thời ghi nhận vào danh sách đã hiểu
      if (codeUnlockedNow && !state.progress.understood.includes(source.id)) {
        dispatch({ type: 'TOGGLE_UNDERSTOOD', payload: source.id });
        awardXp('quiz_passed', source.id);
      }
    } catch (e: any) {
      console.error(e);
      setStatusNotice('Đã xảy ra lỗi trong quá trình chấm. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Lấy gợi ý hiện tại cho ý bị thiếu đầu tiên
  const currentMissingId = rubric.keyIdeas.find((i) => !matchedSet.has(i.id))?.id;
  const currentHintLevel = savedProgress.hintLevel || 1;
  const currentHintText =
    currentMissingId && rubric.hintsByIdea[currentMissingId]
      ? rubric.hintsByIdea[currentMissingId][Math.min(3, currentHintLevel - 1)]
      : null;

  return (
    <div className="space-y-6">
      {/* 1. Phần Đề bài (Hiện đề bài, ẨN mô phỏng) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Đề bài cần phân tích và giải quyết:
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            {task.ioMode.kind === 'file' ? 'Tệp tin INP/OUT' : 'Luồng chuẩn stdio'}
          </span>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line font-sans">
          {task.statement}
        </p>

        {task.constraints && (
          <div className="text-xs text-slate-400 font-mono bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/60 inline-block">
            Giới hạn: {task.constraints}
          </div>
        )}
      </div>

      {/* 2. Thanh tiến độ: "Độ hoàn thiện x/y ý" */}
      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">
              Độ hoàn thiện ý tưởng cốt lõi (Rubric):
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold font-mono ${
                isAllMatched
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}
            >
              {matchedSet.size}/{totalIdeas} ý
            </span>
          </div>

          {isAllMatched ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
              <Unlock className="w-3.5 h-3.5" /> Đã mở khóa code!
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-medium">
              <Lock className="w-3.5 h-3.5" /> Chưa mở khóa
            </span>
          )}
        </div>

        {/* Thanh chip các ý tưởng */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {rubric.keyIdeas.map((idea, idx) => {
            const isMatched = matchedSet.has(idea.id);
            return (
              <div
                key={idea.id}
                className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                  isMatched
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-500'
                }`}
              >
                {isMatched ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[10px] text-slate-500 font-bold flex-shrink-0">
                    {idx + 1}
                  </div>
                )}
                <span className="truncate">
                  {/* QUY TẮC: Ý chưa đạt CHỈ hiện nhãn mờ, KHÔNG lộ nội dung */}
                  {isMatched ? idea.description : `Ý tưởng cốt lõi #${idx + 1} (Chưa mở)`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Ô văn bản lớn: "Em hãy tả cách giải bằng lời hoặc giả mã" */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <FileCode className="w-4 h-4 text-blue-400" />
            Em hãy tả cách giải bài toán này bằng lời hoặc giả mã:
          </label>
        </div>

        <textarea
          rows={5}
          value={studentText}
          onChange={(e) => setStudentText(e.target.value)}
          placeholder="Ví dụ: Đầu tiên em sẽ đọc hai số a và b. Sau đó em kiểm tra nếu a > 0 và b > 0 thì... Cuối cùng em in kết quả..."
          className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 placeholder:text-slate-600 text-xs sm:text-sm font-sans focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 leading-relaxed transition-all"
        />

        {statusNotice && (
          <div className="text-xs text-amber-300 bg-amber-950/30 p-2.5 rounded-xl border border-amber-500/30 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
            <span>{statusNotice}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-1">
          <span className="text-[11px] text-slate-500">
            Số lần gửi phân tích: <strong className="text-slate-300">{savedProgress.attempts}</strong>
          </span>

          <button type="button"
            onClick={handleSubmit}
            disabled={!studentText.trim() || isLoading}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md cursor-pointer ${
              !studentText.trim() || isLoading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-600/30 active:scale-95'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang kiểm tra...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Gửi kiểm tra ý tưởng</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Kết quả phản hồi đánh giá Rubric */}
      {evaluation && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-400 pb-2 border-b border-slate-800">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Nhận xét & Gợi ý theo tiêu chí bài học:
          </div>

          {/* Lời khen ý đúng */}
          <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs sm:text-sm text-emerald-200 leading-relaxed flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-emerald-300">Điểm em làm tốt:</div>
              <div>{evaluation.praise}</div>
            </div>
          </div>

          {/* Điểm hiểu lầm nếu có */}
          {evaluation.misconceptions && evaluation.misconceptions.length > 0 && (
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs sm:text-sm text-amber-200 leading-relaxed flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-300">Lưu ý bẫy tư duy:</div>
                <ul className="list-disc list-inside space-y-0.5 mt-1 text-xs">
                  {evaluation.misconceptions.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* MỘT câu hỏi gợi mở về ý thiếu quan trọng nhất */}
          {!isAllMatched && evaluation.nextQuestion && (
            <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-500/40 text-xs sm:text-sm text-blue-200 leading-relaxed flex items-start gap-2.5">
              <HelpCircle className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-blue-300 mb-0.5">Câu hỏi gợi mở tư duy:</div>
                <div>{evaluation.nextQuestion}</div>
              </div>
            </div>
          )}

          {/* Gợi ý tăng dần: Bậc 1 đến 4 */}
          {!isAllMatched && currentHintText && (
            <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-purple-300 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                  Gợi ý bậc {currentHintLevel}/4:
                </span>
                <span className="text-[10px] text-purple-400">
                  (Càng thử nhiều, gợi ý càng chi tiết)
                </span>
              </div>
              <div className="text-slate-300 leading-relaxed whitespace-pre-line font-mono bg-slate-950/60 p-2.5 rounded-lg border border-purple-500/20">
                {currentHintText}
              </div>

              {/* Bậc 3: Đồng thời mở mô phỏng một phần */}
              {currentHintLevel >= 3 && currentLesson && (
                <div className="pt-2">
                  <button type="button"
                    onClick={() => setShowSimModal(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 text-xs font-semibold hover:bg-indigo-600/50 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Mở mô phỏng trường hợp biên để quan sát</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 5. Khi đủ ý: Cho phép mở mô phỏng để đối chiếu */}
      {isAllMatched && (
        <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="text-xs sm:text-sm font-bold text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Chúc mừng em đã làm chủ toàn bộ tư duy bài toán!
            </div>
            <p className="text-xs text-slate-400">
              Em đã đủ điều kiện viết code và có thể mở mô phỏng đầy đủ để đối chiếu ý tưởng của mình.
            </p>
          </div>

          {currentLesson && (
            <button type="button"
              onClick={() => setShowSimModal(!showSimModal)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-500 transition-colors shadow-md shadow-emerald-600/30 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>{showSimModal ? 'Ẩn mô phỏng' : 'Mở mô phỏng đối chiếu'}</span>
            </button>
          )}
        </div>
      )}

      {/* Modal/Khung mô phỏng khi được phép mở */}
      {showSimModal && currentLesson && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-300">
              Mô phỏng trực quan: #{currentLesson.id}
            </span>
            <button type="button"
              onClick={() => setShowSimModal(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Đóng lại
            </button>
          </div>
          <SimulationView
            lesson={currentLesson}
            input={currentLesson.sample.defaultInput}
          />
        </div>
      )}
    </div>
  );
};
