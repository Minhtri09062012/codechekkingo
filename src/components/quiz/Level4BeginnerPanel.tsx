import React, { useState, useMemo } from 'react';
import { LearningSource, LevelProgress, Step } from '../../core/types.ts';
import { useApp } from '../../context/AppContext.tsx';
import { explainCodeLineWithAi, explainWhyFastWithAi } from '../../ai/gemini.ts';
import { resolveRenderer } from '../renderers/index.tsx';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Sparkles,
  HelpCircle,
  BookOpen,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingDown,
  Loader2,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface Level4BeginnerPanelProps {
  source: LearningSource;
  activeLessonIndex?: number;
}

type ExplanationLayer = 'statement' | 'main_idea' | 'why_fast';

export const Level4BeginnerPanel: React.FC<Level4BeginnerPanelProps> = ({
  source,
  activeLessonIndex = 0,
}) => {
  const { state, dispatch } = useApp();
  const currentLesson = source.lessons[activeLessonIndex] || source.lessons[0];
  const task = source.task;

  // 1. Chạy từng dòng: sinh steps
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

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const activeStep = steps[currentStepIndex] || steps[0];

  // AI giải thích dòng này kỹ hơn
  const [lineExplanation, setLineExplanation] = useState<string | null>(null);
  const [isExplainingLine, setIsExplainingLine] = useState(false);
  const [lastExplainedLine, setLastExplainedLine] = useState<number | null>(null);

  const handleExplainCurrentLine = async () => {
    if (!currentLesson || !activeStep || isExplainingLine) return;
    const lineNo = activeStep.line;
    const codeStr = currentLesson.code[lineNo - 1] || '';
    const noteStr = currentLesson.lineNotes[lineNo - 1] || '';

    setIsExplainingLine(true);
    setLastExplainedLine(lineNo);

    try {
      const res = await explainCodeLineWithAi({
        codeLine: codeStr,
        lineNote: noteStr,
        lineNumber: lineNo,
        lessonTitle: currentLesson.id,
        codeContext: currentLesson.code,
      });
      setLineExplanation(res.explanation);
    } catch (e) {
      console.error(e);
      setLineExplanation(noteStr || 'Lệnh thực thi trong chương trình.');
    } finally {
      setIsExplainingLine(false);
    }
  };

  // 2. Ba lớp giải thích:
  // Lớp 1: "Đề bài nói gì?" (task.statement + glossary)
  // Lớp 2: "Ý tưởng chính" (explanation)
  // Lớp 3: "Vì sao cách này nhanh/đúng?" (compare hoặc AI)
  const [activeLayer, setActiveLayer] = useState<ExplanationLayer>('statement');
  const [whyFastText, setWhyFastText] = useState<string | null>(null);
  const [isLoadingWhyFast, setIsLoadingWhyFast] = useState(false);

  const handleLoadWhyFast = async () => {
    if (!currentLesson || whyFastText || isLoadingWhyFast) return;
    setIsLoadingWhyFast(true);

    try {
      const res = await explainWhyFastWithAi({
        lessonTitle: currentLesson.id,
        statement: task.statement,
        code: currentLesson.code,
        analysisNote: task.analysis?.note,
      });
      setWhyFastText(res.explanation);
    } catch (e) {
      console.error(e);
      setWhyFastText(task.analysis?.note || 'Thuật toán tối ưu về thời gian và bộ nhớ.');
    } finally {
      setIsLoadingWhyFast(false);
    }
  };

  // 3. Thử thách đổi đề:
  // Chọn preset khác (ví dụ preset index 1 hoặc 2)
  const challengePresets = useMemo(() => {
    if (!currentLesson?.sample?.presets) return [];
    return currentLesson.sample.presets.slice(1);
  }, [currentLesson]);

  const [challengePresetIdx, setChallengePresetIdx] = useState(0);
  const [challengeInputVal, setChallengeInputVal] = useState('');
  const [challengeChecked, setChallengeChecked] = useState(false);
  const [challengeIsCorrect, setChallengeIsCorrect] = useState(false);
  const [consecutiveRight, setConsecutiveRight] = useState(0);

  const activeChallengePreset = challengePresets[challengePresetIdx] || challengePresets[0];

  const handleCheckChallenge = () => {
    if (!currentLesson || !activeChallengePreset) return;
    const parsed = currentLesson.sample.parse(activeChallengePreset.input);
    if (!parsed.ok) return;

    const expected = currentLesson.reference(parsed.value).trim();
    const student = challengeInputVal.trim();

    const ok = student.toLowerCase() === expected.toLowerCase();
    setChallengeChecked(true);
    setChallengeIsCorrect(ok);

    if (ok) {
      const nextCount = consecutiveRight + 1;
      setConsecutiveRight(nextCount);
    } else {
      setConsecutiveRight(0);
    }
  };

  const handleNextChallenge = () => {
    setChallengePresetIdx((prev) => (prev + 1) % Math.max(1, challengePresets.length));
    setChallengeInputVal('');
    setChallengeChecked(false);
  };

  const RendererComponent = currentLesson ? resolveRenderer(currentLesson) : null;

  return (
    <div className="space-y-6">
      {/* 1. KHUNG CHẠY TỪNG DÒNG LỜI GIẢI ĐẦY ĐỦ */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Play className="w-4 h-4 text-emerald-400" />
            Chạy từng dòng code mẫu (Cấp 4: Học sinh mới)
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">
              Bước {currentStepIndex + 1}/{steps.length} (Dòng {activeStep?.line || 1})
            </span>
          </div>
        </div>

        {/* Khung trực quan Renderer */}
        {activeStep && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 min-h-[140px] flex items-center justify-center">
            {RendererComponent && <RendererComponent step={activeStep} />}
          </div>
        )}

        {/* Khung Code Python & lineNotes bên cạnh */}
        {currentLesson && (
          <div className="rounded-xl border border-slate-800 overflow-hidden font-mono text-xs">
            <div className="grid grid-cols-12 bg-slate-950/80 p-2 text-[10px] text-slate-500 font-bold border-b border-slate-800 uppercase tracking-wider">
              <div className="col-span-1 text-center">Dòng</div>
              <div className="col-span-6">Mã nguồn Python</div>
              <div className="col-span-5">Chú thích ý nghĩa</div>
            </div>

            <div className="divide-y divide-slate-900 bg-slate-950">
              {currentLesson.code.map((lineStr, idx) => {
                const lineNo = idx + 1;
                const isCurrentLine = activeStep?.line === lineNo;
                const note = currentLesson.lineNotes[idx] || '';

                return (
                  <div
                    key={idx}
                    className={`grid grid-cols-12 p-2.5 items-center transition-all ${
                      isCurrentLine
                        ? 'bg-blue-600/25 border-l-4 border-l-blue-500 text-blue-100 font-bold'
                        : 'text-slate-400 hover:bg-slate-900/50'
                    }`}
                  >
                    <div className="col-span-1 text-center text-slate-500 select-none">
                      {lineNo}
                    </div>
                    <div className="col-span-6 font-mono text-xs overflow-x-auto text-slate-200">
                      {lineStr}
                    </div>
                    <div className="col-span-5 text-xs text-slate-400 font-sans italic">
                      {note}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Thanh tua bước & Nút "Giải thích dòng này kỹ hơn" bằng AI */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button type="button"
              onClick={() => setCurrentStepIndex(0)}
              disabled={currentStepIndex === 0}
              className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button type="button"
              onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))}
              disabled={currentStepIndex === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              Lùi 1 bước
            </button>
            <button type="button"
              onClick={() => setCurrentStepIndex(Math.min(steps.length - 1, currentStepIndex + 1))}
              disabled={currentStepIndex >= steps.length - 1}
              className="px-3 py-1.5 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-40 shadow-sm cursor-pointer"
            >
              Tiến 1 bước
            </button>
          </div>

          <button type="button"
            onClick={handleExplainCurrentLine}
            disabled={isExplainingLine}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-bold hover:bg-purple-600/50 transition-colors shadow-sm cursor-pointer"
          >
            {isExplainingLine ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-purple-300" />
                <span>Đang phân tích dòng...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Giải thích dòng {activeStep?.line || 1} kỹ hơn với ví dụ đời thường</span>
              </>
            )}
          </button>
        </div>

        {/* Khung giải thích chi tiết từ AI */}
        {lineExplanation && (
          <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 text-xs sm:text-sm text-purple-200 space-y-2 animate-fadeIn">
            <div className="font-bold text-purple-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Giải nghĩa dòng {lastExplainedLine} cho học sinh mới:
            </div>
            <p className="leading-relaxed whitespace-pre-line text-slate-200">
              {lineExplanation}
            </p>
          </div>
        )}
      </div>

      {/* 2. BA LỚP GIẢI THÍCH CHUYỂN ĐỔI ĐƯỢC */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
          {[
            { key: 'statement', label: '1. Đề bài nói gì?', icon: BookOpen },
            { key: 'main_idea', label: '2. Ý tưởng chính', icon: Layers },
            { key: 'why_fast', label: '3. Vì sao cách này nhanh/đúng?', icon: Zap },
          ].map((tab) => {
            const isActive = activeLayer === tab.key;
            return (
              <button type="button"
                key={tab.key}
                onClick={() => {
                  setActiveLayer(tab.key as ExplanationLayer);
                  if (tab.key === 'why_fast') handleLoadWhyFast();
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Lớp 1: Đề bài nói gì? */}
        {activeLayer === 'statement' && (
          <div className="space-y-3 text-xs sm:text-sm text-slate-200 leading-relaxed animate-fadeIn">
            <p className="font-sans whitespace-pre-line">{task.statement}</p>
            {task.glossary && task.glossary.length > 0 && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {task.glossary.map((g, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                    <span className="font-bold text-blue-300 font-mono">{g.term}: </span>
                    <span className="text-slate-400">{g.meaning}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Lớp 2: Ý tưởng chính */}
        {activeLayer === 'main_idea' && currentLesson && (
          <div className="space-y-3 text-xs sm:text-sm text-slate-200 leading-relaxed animate-fadeIn">
            {currentLesson.explanation.map((b, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                {b.type === 'text' && <p>{b.text}</p>}
                {b.type === 'callout' && (
                  <div className="font-semibold text-amber-300">{b.text}</div>
                )}
                {b.type === 'example' && (
                  <div>
                    <div className="font-bold text-blue-300">{b.title}</div>
                    <pre className="font-mono text-xs text-slate-300 mt-1 whitespace-pre-wrap">
                      {b.body}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Lớp 3: Vì sao cách này nhanh/đúng? */}
        {activeLayer === 'why_fast' && (
          <div className="space-y-3 text-xs sm:text-sm text-slate-200 leading-relaxed animate-fadeIn">
            {currentLesson?.compare && currentLesson.compare.length > 0 ? (
              /* Nếu có ComparePanel */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentLesson.compare.map((sol, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">{sol.name}</span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-blue-300">
                        {sol.complexity}
                      </span>
                    </div>
                    <pre className="p-2 rounded-lg bg-slate-900/80 font-mono text-[11px] text-slate-300 overflow-x-auto">
                      {sol.code.join('\n')}
                    </pre>
                  </div>
                ))}
              </div>
            ) : (
              /* Ngược lại giải thích ngắn từ AI */
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-blue-300 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Nguyên lý tối ưu thuật toán:
                </div>
                {isLoadingWhyFast ? (
                  <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span>Đang tổng hợp phân tích...</span>
                  </div>
                ) : (
                  <p className="text-slate-300 leading-relaxed">{whyFastText}</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. THỬ THÁCH ĐỔI ĐỀ (Dự đoán đầu ra preset khác) */}
      {activeChallengePreset && currentLesson && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs sm:text-sm font-bold text-slate-200">
                Thử thách đổi đề: Dự đoán kết quả với bộ dữ liệu mới
              </h4>
            </div>
            <span className="text-[11px] text-slate-400">
              Đúng liên tiếp: <strong className="text-emerald-400">{consecutiveRight}</strong>/2 lần
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="text-slate-400">
              Bộ dữ liệu mới:{' '}
              <strong className="text-slate-200">{activeChallengePreset.name}</strong>
            </div>
            <div className="font-mono text-blue-300 bg-slate-900/60 p-2 rounded-lg">
              {Object.entries(activeChallengePreset.input)
                .map(([k, v]) => `${k} = ${v}`)
                .join(', ')}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-300 font-semibold">
              Theo em, chương trình sẽ in ra kết quả gì?
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={challengeInputVal}
                onChange={(e) => setChallengeInputVal(e.target.value)}
                placeholder="Nhập kết quả dự đoán..."
                className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
              />
              <button type="button"
                onClick={handleCheckChallenge}
                className="px-4 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 cursor-pointer"
              >
                Kiểm tra
              </button>
            </div>
          </div>

          {challengeChecked && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                challengeIsCorrect
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {challengeIsCorrect ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400" />
                )}
                <span>
                  {challengeIsCorrect
                    ? 'Chính xác! Em đã nắm rất vững dòng chảy của chương trình.'
                    : 'Chưa chính xác. Hãy xem lại từng dòng lệnh nhé!'}
                </span>
              </div>

              {challengePresets.length > 1 && (
                <button type="button"
                  onClick={handleNextChallenge}
                  className="text-xs text-blue-400 underline hover:text-blue-300 cursor-pointer"
                >
                  Thử tiếp bộ khác
                </button>
              )}
            </div>
          )}

          {/* Nếu làm đúng 2 lần liên tiếp: Gợi ý chuyển xuống cấp 3 */}
          {consecutiveRight >= 2 && (
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200 flex items-center justify-between gap-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>
                  Em đã đoán đúng 2 lần liên tiếp! Em đã sẵn sàng thử sức tự giải bài ở Cấp độ 3.
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
