import React, { useState, useMemo } from 'react';
import { LearningSource, LevelProgress, Step, Stage, TestCase } from '../../core/types.ts';
import { useApp } from '../../context/AppContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  getSmallestTests,
  matchAnswerNormalized,
  filterStepsByStage,
} from '../../core/predictionGenerator.ts';
import { SimulationView } from '../simulation/SimulationView.tsx';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Code,
  ArrowRight,
  Lock,
  Unlock,
  AlertCircle,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface Level3ScaffoldPanelProps {
  source: LearningSource;
  activeLessonIndex?: number;
}

type SubStep = 'b1_understand' | 'b2_self_check' | 'b3_stages' | 'b4_fill_blanks';

export const Level3ScaffoldPanel: React.FC<Level3ScaffoldPanelProps> = ({
  source,
  activeLessonIndex = 0,
}) => {
  const { state, dispatch } = useApp();
  const { awardXp } = useAuth();
  const currentLesson = source.lessons[activeLessonIndex] || source.lessons[0];
  const task = source.task;
  const stages: Stage[] = currentLesson?.stages || [];

  const progressKey = `${source.id}|3`;
  const savedProgress: LevelProgress = state.progress.levels[progressKey] || {
    attempts: 0,
    matchedIdeas: [],
    hintLevel: 1,
    codeUnlocked: false,
    stagesDone: 0,
    predictRight: 0,
    predictTotal: 0,
  };

  // Các bước B1 -> B2 -> B3 -> B4
  const [currentSubStep, setCurrentSubStep] = useState<SubStep>('b1_understand');
  const [b1Done, setB1Done] = useState(false);

  // --- B2: Tự kiểm tra ---
  const smallestTests = useMemo<TestCase[]>(() => {
    return getSmallestTests(task, 3);
  }, [task]);

  const [b2Answers, setB2Answers] = useState<Record<number, string>>({});
  const [b2Checked, setB2Checked] = useState<Record<number, boolean>>({});
  const [b2Results, setB2Results] = useState<Record<number, boolean>>({});
  const [b2FailedIndex, setB2FailedIndex] = useState<number | null>(null);

  const b2AllCorrect = useMemo(() => {
    if (smallestTests.length === 0) return true;
    return (
      smallestTests.every((_, idx) => b2Checked[idx] && b2Results[idx])
    );
  }, [smallestTests, b2Checked, b2Results]);

  const handleCheckB2Question = (idx: number) => {
    const studentAns = b2Answers[idx] || '';
    const test = smallestTests[idx];
    if (!test) return;

    const ok = matchAnswerNormalized(studentAns, test.output);
    setB2Checked((prev) => ({ ...prev, [idx]: true }));
    setB2Results((prev) => ({ ...prev, [idx]: ok }));

    if (!ok) {
      setB2FailedIndex(idx);
    } else if (b2FailedIndex === idx) {
      setB2FailedIndex(null);
    }
  };

  // --- B3: Lần theo hướng giải qua từng Stage ---
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(
    Math.min(savedProgress.stagesDone, Math.max(0, stages.length - 1))
  );
  const [stageAnswers, setStageAnswers] = useState<Record<number, string>>({});
  const [stagePassed, setStagePassed] = useState<Record<number, boolean>>({});

  const activeStage = stages[currentStageIdx];

  const handlePassStage = (idx: number) => {
    const nextPassed = { ...stagePassed, [idx]: true };
    setStagePassed(nextPassed);

    const nextStagesDone = Math.max(savedProgress.stagesDone, idx + 1);

    dispatch({
      type: 'UPDATE_LEVEL_PROGRESS',
      payload: {
        sourceId: source.id,
        level: 3,
        data: {
          stagesDone: nextStagesDone,
        },
      },
    });

    if (idx + 1 < stages.length) {
      setCurrentStageIdx(idx + 1);
    }
  };

  // --- B4: Điền khuyết ---
  const allBlanks = useMemo(() => {
    const list: {
      stageIdx: number;
      line: number;
      before: string;
      answer: string;
      after: string;
      key: string;
    }[] = [];

    stages.forEach((st, sIdx) => {
      st.blanks.forEach((b, bIdx) => {
        list.push({
          stageIdx: sIdx,
          line: b.line,
          before: b.before,
          answer: b.answer,
          after: b.after,
          key: `blank_${sIdx}_${bIdx}`,
        });
      });
    });

    return list;
  }, [stages]);

  const [blankInputs, setBlankInputs] = useState<Record<string, string>>({});
  const [blanksChecked, setBlanksChecked] = useState(false);
  const [blanksResults, setBlanksResults] = useState<Record<string, boolean>>({});

  const blanksAllCorrect = useMemo(() => {
    if (allBlanks.length === 0) return true;
    return blanksChecked && allBlanks.every((b) => blanksResults[b.key]);
  }, [allBlanks, blanksChecked, blanksResults]);

  const handleVerifyBlanks = () => {
    const res: Record<string, boolean> = {};
    for (const b of allBlanks) {
      const val = blankInputs[b.key] || '';
      res[b.key] = matchAnswerNormalized(val, b.answer);
    }
    setBlanksResults(res);
    setBlanksChecked(true);

    const allOk = allBlanks.every((b) => res[b.key]);
    if (allOk) {
      dispatch({
        type: 'UPDATE_LEVEL_PROGRESS',
        payload: {
          sourceId: source.id,
          level: 3,
          data: {
            codeUnlocked: true,
            stagesDone: stages.length,
          },
        },
      });

      if (!state.progress.understood.includes(source.id)) {
        dispatch({ type: 'TOGGLE_UNDERSTOOD', payload: source.id });
        awardXp('quiz_passed', source.id);
      }
    }
  };

  const isB3Done = stages.length === 0 || savedProgress.stagesDone >= stages.length;

  return (
    <div className="space-y-6">
      {/* Thanh 4 bước tuần tự B1 -> B2 -> B3 -> B4 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-2 border-b border-slate-800">
        {[
          { key: 'b1_understand', label: 'B1. Hiểu đề bài', icon: BookOpen, unlocked: true },
          { key: 'b2_self_check', label: 'B2. Tự kiểm tra', icon: HelpCircle, unlocked: b1Done },
          { key: 'b3_stages', label: 'B3. Lần theo giải', icon: Layers, unlocked: b1Done && b2AllCorrect },
          { key: 'b4_fill_blanks', label: 'B4. Điền khuyết', icon: Code, unlocked: b1Done && b2AllCorrect && isB3Done },
        ].map((step, idx) => {
          const isActive = currentSubStep === step.key;
          const isUnlocked = step.unlocked;

          return (
            <button type="button"
              key={step.key}
              disabled={!isUnlocked}
              onClick={() => setCurrentSubStep(step.key as SubStep)}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600/30 border-blue-500 text-blue-200 shadow-sm'
                  : isUnlocked
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                  : 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-60 cursor-not-allowed'
              }`}
            >
              <step.icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
              <span className="truncate">{step.label}</span>
              {!isUnlocked && <Lock className="w-3 h-3 ml-auto text-slate-600" />}
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* BƯỚC 1: HIỂU ĐỀ BÀI */}
      {/* ============================================================ */}
      {currentSubStep === 'b1_understand' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-400" />
              Đề bài và các từ khóa quan trọng (Glossary):
            </h3>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-line">
              {task.statement}
            </p>

            {/* Thuật ngữ glossary */}
            {task.glossary && task.glossary.length > 0 && (
              <div className="pt-2 space-y-2">
                <div className="text-xs font-semibold text-amber-300">Giải nghĩa từ khóa:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {task.glossary.map((g, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-0.5"
                    >
                      <span className="font-bold text-blue-300 font-mono">{g.term}:</span>
                      <p className="text-slate-400 leading-relaxed">{g.meaning}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Mô phỏng với preset đầu tiên kèm lời dẫn */}
          {currentLesson && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Mô phỏng dữ liệu mẫu đầu tiên ({currentLesson.sample.presets[0]?.name || 'Mặc định'}):
              </div>
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl">
                <SimulationView
                  lesson={currentLesson}
                  input={currentLesson.sample.presets[0]?.input || currentLesson.sample.defaultInput}
                />
              </div>
            </div>
          )}

          {/* Các trường hợp biên cần chú ý từ presets */}
          {currentLesson?.sample.presets && (
            <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2 text-xs">
              <div className="font-bold text-slate-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Các trường hợp biên đặc biệt cần lưu tâm trong bài:
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                {currentLesson.sample.presets.map((p, idx) => (
                  <li key={idx}>
                    <strong className="text-slate-300">{p.name}:</strong>{' '}
                    {Object.entries(p.input)
                      .map(([k, v]) => `${k} = ${v}`)
                      .join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button type="button"
              onClick={() => {
                setB1Done(true);
                setCurrentSubStep('b2_self_check');
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs sm:text-sm hover:bg-blue-500 shadow-md shadow-blue-600/30 cursor-pointer"
            >
              <span>Em đã hiểu đề bài - Chuyển sang Tự kiểm tra</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* BƯỚC 2: TỰ KIỂM TRA (2-3 câu từ smallest tests) */}
      {/* ============================================================ */}
      {currentSubStep === 'b2_self_check' && (
        <div className="space-y-5 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs text-slate-300">
            <div className="font-bold text-slate-200 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              Tự kiểm tra: Với đầu vào này, kết quả của chương trình là gì?
            </div>
            <p className="text-slate-400">
              Hãy tính nhẩm và nhập kết quả chính xác theo định dạng đầu ra của bài toán.
            </p>
          </div>

          <div className="space-y-4">
            {smallestTests.map((t, idx) => {
              const isChecked = b2Checked[idx];
              const isOk = b2Results[idx];

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    isChecked
                      ? isOk
                        ? 'bg-emerald-950/20 border-emerald-500/40'
                        : 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800/80">
                    <span className="font-bold text-slate-300">
                      Câu hỏi #{idx + 1} {t.label ? `(${t.label})` : ''}
                    </span>
                    {isChecked && (
                      <span className="flex items-center gap-1 font-semibold text-xs">
                        {isOk ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Chính xác
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1">
                            <XCircle className="w-4 h-4" /> Chưa đúng
                          </span>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-500 font-mono">Đầu vào (Input):</span>
                      <pre className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-blue-300 overflow-x-auto">
                        {t.input}
                      </pre>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-500 font-mono">Đáp án của em:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={b2Answers[idx] || ''}
                          onChange={(e) =>
                            setB2Answers({ ...b2Answers, [idx]: e.target.value })
                          }
                          placeholder="Nhập kết quả..."
                          className="flex-1 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
                        />
                        <button type="button"
                          onClick={() => handleCheckB2Question(idx)}
                          className="px-3.5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 cursor-pointer"
                        >
                          Kiểm tra
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Nếu học sinh làm sai: Mở một ví dụ từ examples để giải thích bằng mô phỏng */}
          {b2FailedIndex !== null && task.examples.length > 0 && currentLesson && (
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <AlertCircle className="w-4 h-4" />
                Em đã trả lời sai. Hãy quan sát ví dụ mẫu sau để hiểu quy tắc tính:
              </div>
              <div className="text-xs text-slate-300 space-y-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                <div>
                  <strong className="text-slate-200">Đầu vào:</strong> {task.examples[0].input}
                </div>
                <div>
                  <strong className="text-slate-200">Đầu ra đúng:</strong> {task.examples[0].output}
                </div>
                {task.examples[0].note && (
                  <div className="text-amber-200/80">
                    <strong>Giải thích:</strong> {task.examples[0].note}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              {b2AllCorrect ? 'Tất cả câu tự kiểm tra đều chính xác!' : 'Hoàn thành đúng cả 3 câu để mở Bước 3.'}
            </span>

            <button type="button"
              disabled={!b2AllCorrect}
              onClick={() => setCurrentSubStep('b3_stages')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                b2AllCorrect
                  ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              <span>Chuyển sang B3: Lần theo hướng giải</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* BƯỚC 3: LẦN THEO HƯỚNG GIẢI (Duyệt từng Stage) */}
      {/* ============================================================ */}
      {currentSubStep === 'b3_stages' && !activeStage && (
        <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 animate-fadeIn">
          <p className="text-xs sm:text-sm text-slate-300">
            Bài này chưa tách chặng mô phỏng riêng. Em có thể chuyển thẳng sang bước điền khuyết khung mã nguồn.
          </p>
          <button
            type="button"
            onClick={() => setCurrentSubStep('b4_fill_blanks')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer"
          >
            <span>Chuyển sang B4: Điền khuyết</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
      {currentSubStep === 'b3_stages' && activeStage && (
        <div className="space-y-5 animate-fadeIn">
          {/* Header chọn Chặng */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {stages.map((st, sIdx) => {
              const isCurrent = currentStageIdx === sIdx;
              const isDone = (savedProgress.stagesDone > sIdx) || stagePassed[sIdx];

              return (
                <button type="button"
                  key={sIdx}
                  onClick={() => setCurrentStageIdx(sIdx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-purple-600 text-white shadow-sm'
                      : isDone
                      ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-900 border border-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <span>#{sIdx + 1}</span>
                  )}
                  <span>{st.title}</span>
                </button>
              );
            })}
          </div>

          {/* Chi tiết Chặng hiện tại */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono text-purple-400 uppercase tracking-wider">
                Chặng #{currentStageIdx + 1} (Dòng {activeStage.codeLines[0]} - {activeStage.codeLines[1]})
              </span>
              <h4 className="text-base font-bold text-slate-100">{activeStage.title}</h4>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                <strong className="text-purple-300">Mục tiêu:</strong> {activeStage.goal}
              </p>
            </div>

            {/* Chỉ phát các dòng code thuộc chặng */}
            {currentLesson && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs space-y-1">
                <div className="text-[10px] text-slate-500 pb-1 border-b border-slate-800">
                  Mã nguồn của chặng này:
                </div>
                {currentLesson.code
                  .slice(activeStage.codeLines[0] - 1, activeStage.codeLines[1])
                  .map((lineStr, lineIdx) => {
                    const actualLineNo = activeStage.codeLines[0] + lineIdx;
                    return (
                      <div key={lineIdx} className="flex items-center gap-3">
                        <span className="text-slate-600 w-6 text-right select-none">
                          {actualLineNo}
                        </span>
                        <span className="text-slate-200">{lineStr}</span>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* Câu hỏi của chặng */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-400" />
                Câu hỏi của chặng: {activeStage.question}
              </label>
              <textarea
                rows={2}
                value={stageAnswers[currentStageIdx] || ''}
                onChange={(e) =>
                  setStageAnswers({ ...stageAnswers, [currentStageIdx]: e.target.value })
                }
                placeholder="Nhập câu trả lời hoặc suy luận của em cho chặng này..."
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 font-sans"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button type="button"
                onClick={() => handlePassStage(currentStageIdx)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold text-xs sm:text-sm hover:bg-purple-500 transition-colors shadow-md shadow-purple-600/30 cursor-pointer"
              >
                <span>
                  {currentStageIdx + 1 < stages.length ? 'Hoàn thành chặng & Tiếp tục' : 'Hoàn thành tất cả các chặng'}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-slate-400">
              Đã hoàn thành: <strong className="text-purple-300">{savedProgress.stagesDone}</strong> / {stages.length} chặng
            </span>

            <button type="button"
              disabled={!isB3Done}
              onClick={() => setCurrentSubStep('b4_fill_blanks')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
                isB3Done
                  ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
              }`}
            >
              <span>Chuyển sang B4: Điền khuyết</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* BƯỚC 4: ĐIỀN KHUYẾT (Dựng code từ lesson.code và stage.blanks) */}
      {/* ============================================================ */}
      {currentSubStep === 'b4_fill_blanks' && currentLesson && (
        <div className="space-y-5 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs text-slate-300">
            <div className="font-bold text-slate-200 flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              Điền vào chỗ trống để hoàn thiện mã nguồn:
            </div>
            <p className="text-slate-400">
              Điền cú pháp Python chính xác vào các ô khuyết để ghép thành chương trình hoàn chỉnh.
            </p>
          </div>

          {/* Khung code có các ô input điền khuyết */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 font-mono text-xs sm:text-sm space-y-2 shadow-2xl">
            {currentLesson.code.map((lineStr, lineIdx) => {
              const lineNo = lineIdx + 1;
              const blankItem = allBlanks.find((b) => b.line === lineNo);

              if (!blankItem) {
                return (
                  <div key={lineIdx} className="flex items-center gap-3">
                    <span className="w-6 text-right text-slate-600 select-none text-xs">{lineNo}</span>
                    <span className="text-slate-300">{lineStr}</span>
                  </div>
                );
              }

              const isChecked = blanksChecked;
              const isCorrect = blanksResults[blankItem.key];

              return (
                <div key={lineIdx} className="flex items-center gap-3 py-1">
                  <span className="w-6 text-right text-slate-600 select-none text-xs">{lineNo}</span>
                  <div className="flex flex-wrap items-center gap-1.5 flex-1">
                    <span className="text-slate-300">{blankItem.before}</span>
                    <input
                      type="text"
                      value={blankInputs[blankItem.key] || ''}
                      onChange={(e) =>
                        setBlankInputs({ ...blankInputs, [blankItem.key]: e.target.value })
                      }
                      placeholder="... điền tại đây ..."
                      className={`px-3 py-1 rounded-lg border text-xs sm:text-sm font-mono focus:outline-none transition-all ${
                        isChecked
                          ? isCorrect
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
                            : 'bg-rose-950 border-rose-500 text-rose-200'
                          : 'bg-slate-900 border-purple-500/50 text-purple-200 focus:border-purple-400'
                      }`}
                    />
                    <span className="text-slate-300">{blankItem.after}</span>
                    {isChecked && (
                      <span className="ml-2">
                        {isCorrect ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400 inline" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-slate-400">
              {blanksAllCorrect ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <Unlock className="w-4 h-4" /> Mã nguồn đã hoàn thiện và mở khóa code thành công!
                </span>
              ) : (
                'Điền đúng tất cả các ô khuyết để hoàn tất Cấp độ 3.'
              )}
            </span>

            <button type="button"
              onClick={handleVerifyBlanks}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs sm:text-sm hover:bg-emerald-500 shadow-md shadow-emerald-600/30 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Kiểm tra mã nguồn ghép nối</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
