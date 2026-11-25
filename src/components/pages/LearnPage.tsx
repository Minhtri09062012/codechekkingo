import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { routes } from '../../core/routes.ts';
import {
  getLesson,
  getLessons,
  getMissingPrerequisites,
  getProblemsOfLesson,
  RegisteredLesson,
} from '../../core/registry.ts';
import { catalog } from '../../core/catalog.ts';
import { ExplanationBlock, InputField, Level, ContestTag, Step, LearningSource } from '../../core/types.ts';
import { SimulationView } from '../simulation/SimulationView.tsx';
import { UnderstandingPanel } from '../quiz/UnderstandingPanel.tsx';
import {
  BookOpen,
  HelpCircle,
  Play,
  Dices,
  ListOrdered,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Lightbulb,
  AlertTriangle,
  Info,
  Code,
  Sparkles,
  AlertCircle,
  Cpu,
  Clock,
  ExternalLink,
  ChevronRightSquare,
  Award,
} from 'lucide-react';

interface LearnPageProps {
  mode: 'concept' | 'algorithm';
}

function getLevelLabel(level: Level): string {
  switch (level) {
    case 'nen-tang': return 'Nền tảng';
    case 'co-ban': return 'Cơ bản';
    case 'trung-cap': return 'Trung cấp';
    case 'nang-cao': return 'Nâng cao';
  }
}

function getContestLabel(tag: ContestTag): string {
  switch (tag) {
    case 'core': return 'Cốt lõi thi';
    case 'useful': return 'Hữu ích';
    case 'extra': return 'Mở rộng';
  }
}

export const LearnPage: React.FC<LearnPageProps> = ({ mode }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state, dispatch, devErrors } = useApp();

  const allLessonsInMode = useMemo(() => getLessons(mode), [mode]);

  // Determine current active lesson
  const activeLesson: RegisteredLesson | undefined = useMemo(() => {
    if (id) {
      const found = getLesson(id);
      if (found && found.kind === mode) return found;
    }
    // Mở bài 'ready' đầu tiên theo thứ tự; nếu chưa có thì mở bài đầu danh mục
    const readyList = allLessonsInMode.filter((l) => l.status === 'ready');
    return readyList[0] || allLessonsInMode[0];
  }, [id, mode, allLessonsInMode]);

  // Synchronize route & context activeLessonId
  useEffect(() => {
    if (!activeLesson) return;
    if (activeLesson.id !== state.activeLessonId) {
      dispatch({ type: 'SELECT_LESSON', payload: activeLesson.id });
    }
    if (!id || id !== activeLesson.id) {
      navigate(routes.lesson(mode, activeLesson.id), { replace: true });
    }
  }, [activeLesson, id, mode, state.activeLessonId, dispatch, navigate]);

  // Nguồn học dùng chung cho Tab Kiểm tra độ hiểu
  const learningSource = useMemo<LearningSource | null>(() => {
    if (!activeLesson?.content) return null;
    return {
      id: activeLesson.id,
      kind: 'lesson',
      title: activeLesson.title,
      task: activeLesson.content.task,
      rubric: activeLesson.content.rubric,
      lessons: [activeLesson.content],
    };
  }, [activeLesson]);

  // Compute filtered list to sync with sidebar for "Bài trước / Bài sau"
  const currentFilters = state.filters[mode];
  const sidebarFilteredLessons = useMemo(() => {
    return allLessonsInMode.filter((l) => {
      if (currentFilters.level !== 'all' && l.level !== currentFilters.level) return false;
      if (currentFilters.contest !== 'all' && l.contest !== currentFilters.contest) return false;
      if (currentFilters.onlyReady && l.status !== 'ready') return false;
      if (currentFilters.search.trim()) {
        const q = currentFilters.search.toLowerCase().trim();
        const matchTitle = l.title.toLowerCase().includes(q);
        const matchSummary = l.summary.toLowerCase().includes(q);
        const matchGroup = l.group.toLowerCase().includes(q);
        if (!matchTitle && !matchSummary && !matchGroup) return false;
      }
      return true;
    });
  }, [allLessonsInMode, currentFilters]);

  const currentIndex = sidebarFilteredLessons.findIndex((l) => l.id === activeLesson?.id);
  const prevLesson = currentIndex > 0 ? sidebarFilteredLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < sidebarFilteredLessons.length - 1
      ? sidebarFilteredLessons[currentIndex + 1]
      : null;

  const handleGoToLesson = (targetLesson: RegisteredLesson) => {
    navigate(routes.lesson(targetLesson.kind, targetLesson.id));
    dispatch({ type: 'SELECT_LESSON', payload: targetLesson.id });
  };

  const { user: authUser, awardXp } = useAuth();

  const isUnderstood = activeLesson
    ? state.progress.understood.includes(activeLesson.id)
    : false;

  const handleToggleUnderstood = () => {
    if (activeLesson) {
      const willBeUnderstood = !state.progress.understood.includes(activeLesson.id);
      dispatch({ type: 'TOGGLE_UNDERSTOOD', payload: activeLesson.id });
      if (willBeUnderstood) {
        awardXp('lesson_completed', activeLesson.id);
      }
    }
  };

  // Tiền đề của bài hiện tại
  const prerequisiteEntries = useMemo(() => {
    if (!activeLesson) return [];
    return activeLesson.prerequisites
      .map((pId) => getLesson(pId))
      .filter((l): l is RegisteredLesson => Boolean(l));
  }, [activeLesson]);

  const hasUnmetPrerequisites = useMemo(() => {
    return prerequisiteEntries.some((p) => !state.progress.understood.includes(p.id));
  }, [prerequisiteEntries, state.progress.understood]);

  // Các bài có bài này làm tiền đề ("Học tiếp")
  const forwardEntries = useMemo(() => {
    if (!activeLesson) return [];
    return catalog
      .filter((c) => c.prerequisites.includes(activeLesson.id))
      .map((c) => getLesson(c.id))
      .filter((l): l is RegisteredLesson => Boolean(l));
  }, [activeLesson]);

  // Simulation & Input State (Luồng dữ liệu: Quy tắc 1, 2, 3, 5)
  const [rawInputs, setRawInputs] = useState<Record<string, string>>({});
  const [activeInput, setActiveInput] = useState<unknown>(undefined);
  const [activeSteps, setActiveSteps] = useState<Step[]>([]);
  const [inputErrors, setInputErrors] = useState<Record<string, string>>({});
  const [isFallbackToPrevious, setIsFallbackToPrevious] = useState<boolean>(false);
  const [simSummary, setSimSummary] = useState<string>('');
  const [exceededWarning, setExceededWarning] = useState<string | null>(null);
  const skipNextDebounceRef = useRef<boolean>(false);

  // Helper tính tóm tắt dữ liệu mô phỏng
  const computeSummary = (lessonId: string, val: any): string => {
    if (!val) return '';
    if (lessonId === 'algo-min-max' && val.arr && val.mode) {
      return `[${val.arr.join(', ')}] (${val.mode})`;
    }
    if (lessonId === 'concept-variables-memory' && val.x !== undefined && val.y !== undefined) {
      return `x = ${val.x}, y = ${val.y}`;
    }
    if (typeof val === 'object') {
      return Object.entries(val)
        .map(([k, v]) => `${k}=${Array.isArray(v) ? `[${v.join(',')}]` : v}`)
        .join(', ');
    }
    return String(val);
  };

  // Thực thi mô phỏng từ dữ liệu thô
  const executeSimulation = (inputs: Record<string, string>) => {
    if (!activeLesson?.content) return;
    const sample = activeLesson.content.sample;
    const res = sample.parse(inputs);

    if (!res.ok) {
      const errMap: Record<string, string> = { _global: res.error };
      for (const f of sample.fields) {
        if (
          res.error.toLowerCase().includes(f.key.toLowerCase()) ||
          res.error.toLowerCase().includes(f.label.toLowerCase()) ||
          sample.fields.length === 1 ||
          (sample.fields.filter((x) => x.kind !== 'choice').length === 1 && f.kind !== 'choice')
        ) {
          errMap[f.key] = res.error;
        }
      }
      setInputErrors(errMap);
      if (activeInput !== undefined) {
        setIsFallbackToPrevious(true);
      }
    } else {
      setInputErrors({});
      setIsFallbackToPrevious(false);
      setActiveInput(res.value);
      try {
        const steps = activeLesson.content.generateSteps(res.value);
        if (steps.length > 500) {
          setActiveSteps(steps.slice(0, 500));
          setExceededWarning(`Giới hạn mô phỏng: Đã cắt còn 500 bước theo ${sample.maxSimSize}`);
        } else {
          setActiveSteps(steps);
          setExceededWarning(null);
        }
        setSimSummary(computeSummary(activeLesson.id, res.value));
      } catch (err) {
        console.error('Lỗi khi chạy generateSteps:', err);
      }
    }
  };

  // Khởi tạo lại khi đổi bài học
  useEffect(() => {
    if (activeLesson?.content?.sample?.defaultInput) {
      const init = { ...activeLesson.content.sample.defaultInput };
      skipNextDebounceRef.current = true;
      setRawInputs(init);
      setInputErrors({});
      setIsFallbackToPrevious(false);
      setExceededWarning(null);

      const parsed = activeLesson.content.sample.parse(init);
      if (parsed.ok) {
        setActiveInput(parsed.value);
        const steps = activeLesson.content.generateSteps(parsed.value);
        if (steps.length > 500) {
          setActiveSteps(steps.slice(0, 500));
          setExceededWarning(`Giới hạn mô phỏng: Đã cắt còn 500 bước theo ${activeLesson.content.sample.maxSimSize}`);
        } else {
          setActiveSteps(steps);
        }
        setSimSummary(computeSummary(activeLesson.id, parsed.value));
      }
    }
  }, [activeLesson?.id]);

  // Debounce 400ms khi người dùng sửa dữ liệu ô nhập
  useEffect(() => {
    if (!activeLesson?.content) return;
    if (skipNextDebounceRef.current) {
      skipNextDebounceRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      executeSimulation(rawInputs);
    }, 400);
    return () => clearTimeout(timer);
  }, [rawInputs]);

  // Áp dụng dữ liệu mẫu (Presets)
  const handleApplyPreset = (presetInput: Record<string, string>) => {
    skipNextDebounceRef.current = true;
    setRawInputs(presetInput);
    executeSimulation(presetInput);
  };

  // Randomize inputs helper
  const handleRandomize = () => {
    if (!activeLesson || !activeLesson.content) return;
    const sample = activeLesson.content.sample;
    const randomInputs: Record<string, string> = {};

    for (const field of sample.fields) {
      if (field.kind === 'int') {
        randomInputs[field.key] = String(Math.floor(Math.random() * 20) + 1);
      } else if (field.kind === 'intList') {
        const len = Math.floor(Math.random() * 5) + 3; // 3 đến 7 số (<= 12)
        const nums: number[] = [];
        for (let i = 0; i < len; i++) {
          nums.push(Math.floor(Math.random() * 30) - 5);
        }
        randomInputs[field.key] = nums.join(' ');
      } else if (field.kind === 'choice') {
        const opts = field.options || ['max', 'min'];
        randomInputs[field.key] = opts[Math.floor(Math.random() * opts.length)];
      } else {
        randomInputs[field.key] = sample.defaultInput[field.key] || '';
      }
    }

    skipNextDebounceRef.current = true;
    setRawInputs(randomInputs);
    executeSimulation(randomInputs);
  };

  const renderExplanationBlock = (block: ExplanationBlock, index: number) => {
    switch (block.type) {
      case 'text':
        return (
          <p key={index} className="text-slate-300 leading-relaxed text-sm sm:text-base">
            {block.text}
          </p>
        );
      case 'callout': {
        const styles = {
          tip: 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200',
          warn: 'bg-amber-950/40 border-amber-500/40 text-amber-200',
          info: 'bg-blue-950/40 border-blue-500/40 text-blue-200',
        };
        const icons = {
          tip: <Lightbulb className="w-5 h-5 text-emerald-400 flex-shrink-0" />,
          warn: <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />,
          info: <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />,
        };
        return (
          <div key={index} className={`flex items-start gap-3 p-4 rounded-xl border ${styles[block.tone]}`}>
            {icons[block.tone]}
            <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
              {block.text}
            </div>
          </div>
        );
      }
      case 'code':
        return (
          <div key={index} className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
            <div className="px-3 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-blue-400" /> Python 3
            </div>
            <pre className="p-4 text-xs sm:text-sm font-mono text-emerald-300 overflow-x-auto leading-relaxed">
              <code>{block.code}</code>
            </pre>
          </div>
        );
      case 'example':
        return (
          <div key={index} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              {block.title}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {block.body}
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div key={activeLesson?.id} className="flex-1 flex flex-col justify-between">
      {/* Dev Error Banner nếu có lỗi catalog hoặc file bài học thiếu trường */}
      {devErrors.length > 0 && (
        <div className="bg-rose-950/90 border-b border-rose-500 p-3 px-6 text-xs text-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>[Dev Check] Phát hiện lỗi Catalog / File: {devErrors.join(' | ')}</span>
        </div>
      )}

      <div className="flex-1 px-4 sm:px-8 py-5 max-w-4xl mx-auto w-full">
            {/* Dòng đường dẫn (Nhóm › Tên bài) + chip cấp độ + nhãn thi cử */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span>{activeLesson?.group}</span>
                <span className="text-slate-600">›</span>
                <span className="text-slate-200 font-semibold">{activeLesson?.title}</span>
              </div>

              {activeLesson && (
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                    {getLevelLabel(activeLesson.level)}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                    {getContestLabel(activeLesson.contest)}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 font-mono">
                    {activeLesson.rendererKind}
                  </span>
                </div>
              )}
            </div>

            {/* Hàng "Nên học trước" liệt kê tiền đề dưới dạng chip */}
            {activeLesson && prerequisiteEntries.length > 0 && (
              <div className="my-4 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                  Nên học trước (Tiền đề):
                </div>

                <div className="flex flex-wrap gap-2">
                  {prerequisiteEntries.map((prereq) => {
                    const isPrereqUnderstood = state.progress.understood.includes(prereq.id);
                    const isPrereqSoon = prereq.status === 'soon';

                    return (
                      <Link
                        key={prereq.id}
                        to={`/${prereq.kind}/${prereq.id}`}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border transition-colors ${
                          isPrereqUnderstood
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                            : isPrereqSoon
                            ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                            : 'bg-amber-950/30 border-amber-500/40 text-amber-300 hover:bg-amber-900/40'
                        }`}
                      >
                        {isPrereqUnderstood ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        ) : isPrereqSoon ? (
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-amber-400" />
                        )}
                        <span>
                          #{prereq.order} {prereq.title}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          ({isPrereqUnderstood ? '✓ đã hiểu' : isPrereqSoon ? 'sắp có' : 'chưa hiểu'})
                        </span>
                      </Link>
                    );
                  })}
                </div>

                {/* Nếu có tiền đề chưa hiểu: hiện khung vàng nhẹ "Em nên xem các bài này trước", KHÔNG chặn học */}
                {hasUnmetPrerequisites && (
                  <div className="mt-2 p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90 flex items-center gap-2">
                    <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>
                      Em nên xem các bài tiền đề trước để tiếp thu tốt nhất, nhưng vẫn có thể tự do học tiếp bài này!
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Hàng "Học tiếp" liệt kê các bài có bài này là tiền đề */}
            {activeLesson && forwardEntries.length > 0 && (
              <div className="my-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <ChevronRightSquare className="w-3.5 h-3.5 text-purple-400" />
                  Mở khóa bài tiếp theo:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {forwardEntries.map((fwd) => (
                    <Link
                      key={fwd.id}
                      to={`/${fwd.kind}/${fwd.id}`}
                      className="px-2.5 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-purple-500 text-xs transition-colors"
                    >
                      #{fwd.order} {fwd.title}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* NỘI DUNG CHÍNH DÀNH CHO BÀI STATUS 'READY' */}
            {activeLesson && activeLesson.status === 'ready' && activeLesson.content && (
              <div className="space-y-6 pt-2">
                {/* THANH TAB CỐ ĐỊNH: [Bài học] [Kiểm tra độ hiểu] */}
                <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md pt-1 pb-4 border-b border-slate-800 flex items-center gap-2">
                  <button type="button"
                    onClick={() => dispatch({ type: 'SET_TAB', payload: 'lesson' })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      state.activeTab === 'lesson'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Bài học</span>
                  </button>

                  <button type="button"
                    onClick={() => dispatch({ type: 'SET_TAB', payload: 'quiz' })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                      state.activeTab === 'quiz'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>Kiểm tra độ hiểu</span>
                  </button>
                </div>

                {/* TAB BÀI HỌC: 3 phần xếp dọc A, B, C */}
                {state.activeTab === 'lesson' && (
                  <div className="space-y-8 pb-12">
                    <div className="space-y-1">
                      <h1 className="text-2xl sm:text-3xl font-black text-slate-100">
                        {activeLesson.title}
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-400">
                        {activeLesson.summary}
                      </p>
                    </div>

                    {/* Phần A: "1. Giải thích" */}
                    <section className="space-y-4">
                      <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-blue-600/30 border border-blue-500 text-blue-300 text-xs flex items-center justify-center font-mono">
                          A
                        </span>
                        Giải thích
                      </h2>
                      <div className="space-y-3.5 bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-slate-800/80">
                        {activeLesson.content.explanation.map((block, idx) =>
                          renderExplanationBlock(block, idx)
                        )}
                      </div>
                    </section>

                    {/* Phần B: "2. Đề bài mẫu" */}
                    <section className="space-y-4">
                      <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-emerald-600/30 border border-emerald-500 text-emerald-300 text-xs flex items-center justify-center font-mono">
                          B
                        </span>
                        Đề bài mẫu
                      </h2>

                      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5">
                        <div>
                          <p className="text-sm sm:text-base font-medium text-slate-200 leading-relaxed">
                            {activeLesson.content.sample.statement}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-400">
                            <span>
                              Ràng buộc:{' '}
                              <code className="text-slate-300 font-mono">
                                {activeLesson.content.sample.constraints}
                              </code>
                            </span>
                            <span>•</span>
                            <span className="text-amber-300">
                              Giới hạn mô phỏng: {activeLesson.content.sample.maxSimSize}
                            </span>
                          </div>
                        </div>

                        {/* Presets */}
                        {activeLesson.content.sample.presets &&
                          activeLesson.content.sample.presets.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-slate-800/80">
                              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                                <ListOrdered className="w-3.5 h-3.5 text-blue-400" />
                                Dữ liệu mẫu (Presets):
                              </span>
                              <div className="flex flex-wrap gap-2">
                                {activeLesson.content.sample.presets.map((preset, pIdx) => (
                                  <button type="button"
                                    key={pIdx}
                                    onClick={() => handleApplyPreset(preset.input)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:border-blue-500 hover:text-white transition-all shadow-sm cursor-pointer"
                                  >
                                    {preset.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                        {/* Input fields sinh theo field.kind */}
                        <div className="space-y-4 pt-2 border-t border-slate-800/80">
                          {activeLesson.content.sample.fields.map((field: InputField) => {
                            const val = rawInputs[field.key] ?? '';
                            const error = inputErrors[field.key];

                            return (
                              <div key={field.key} className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <label className="text-xs font-bold text-slate-300">
                                    {field.label}
                                  </label>
                                  {field.help && (
                                    <span className="text-[11px] text-slate-500">
                                      {field.help}
                                    </span>
                                  )}
                                </div>

                                {field.kind === 'choice' ? (
                                  <select
                                    value={val}
                                    onChange={(e) => {
                                      const next = { ...rawInputs, [field.key]: e.target.value };
                                      skipNextDebounceRef.current = true;
                                      setRawInputs(next);
                                      executeSimulation(next);
                                    }}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 font-mono text-xs sm:text-sm text-slate-100 border border-slate-800 focus:border-blue-500 cursor-pointer"
                                  >
                                    {field.options?.map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt === 'max'
                                          ? 'max (Tìm phần tử lớn nhất)'
                                          : opt === 'min'
                                          ? 'min (Tìm phần tử nhỏ nhất)'
                                          : opt}
                                      </option>
                                    ))}
                                  </select>
                                ) : field.kind === 'matrix' || field.kind === 'edgeList' ? (
                                  <textarea
                                    rows={3}
                                    value={val}
                                    onChange={(e) =>
                                      setRawInputs({ ...rawInputs, [field.key]: e.target.value })
                                    }
                                    placeholder={field.placeholder}
                                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 font-mono text-xs sm:text-sm text-slate-100 border transition-all ${
                                      error
                                        ? 'border-rose-500 ring-1 ring-rose-500'
                                        : 'border-slate-800 focus:border-blue-500'
                                    }`}
                                  />
                                ) : field.kind === 'intPair' ? (
                                  (() => {
                                    const parts = val.split(/[\s,]+/);
                                    const first = parts[0] ?? '';
                                    const second = parts[1] ?? '';
                                    return (
                                      <div className="grid grid-cols-2 gap-3">
                                        <div>
                                          <label className="text-[10px] text-slate-400 font-mono mb-1 block">
                                            Số thứ nhất
                                          </label>
                                          <input
                                            type="number"
                                            value={first}
                                            onChange={(e) => {
                                              const next = `${e.target.value} ${second}`.trim();
                                              setRawInputs({ ...rawInputs, [field.key]: next });
                                            }}
                                            placeholder="0"
                                            className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 font-mono text-xs sm:text-sm text-slate-100 border transition-all ${
                                              error
                                                ? 'border-rose-500 ring-1 ring-rose-500'
                                                : 'border-slate-800 focus:border-blue-500'
                                            }`}
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-slate-400 font-mono mb-1 block">
                                            Số thứ hai
                                          </label>
                                          <input
                                            type="number"
                                            value={second}
                                            onChange={(e) => {
                                              const next = `${first} ${e.target.value}`.trim();
                                              setRawInputs({ ...rawInputs, [field.key]: next });
                                            }}
                                            placeholder="0"
                                            className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 font-mono text-xs sm:text-sm text-slate-100 border transition-all ${
                                              error
                                                ? 'border-rose-500 ring-1 ring-rose-500'
                                                : 'border-slate-800 focus:border-blue-500'
                                            }`}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })()
                                ) : (
                                  <input
                                    type="text"
                                    value={val}
                                    onChange={(e) =>
                                      setRawInputs({ ...rawInputs, [field.key]: e.target.value })
                                    }
                                    placeholder={field.placeholder}
                                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950 font-mono text-xs sm:text-sm text-slate-100 border transition-all ${
                                      error
                                        ? 'border-rose-500 ring-1 ring-rose-500'
                                        : 'border-slate-800 focus:border-blue-500'
                                    }`}
                                  />
                                )}

                                {error && (
                                  <div className="flex items-center gap-1.5 text-xs text-rose-400 font-medium pt-1">
                                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span>{error}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Error global */}
                        {inputErrors._global && (
                          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                            <span>{inputErrors._global}</span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80">
                          <div className="flex items-center gap-2">
                            <button type="button"
                              onClick={() => executeSimulation(rawInputs)}
                              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                            >
                              <Play className="w-4 h-4 fill-white" />
                              <span>Chạy</span>
                            </button>

                            <button type="button"
                              onClick={handleRandomize}
                              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition-colors cursor-pointer"
                            >
                              <Dices className="w-4 h-4 text-purple-400" />
                              <span>Ngẫu nhiên</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Phần C: "3. Mô phỏng" */}
                    <section className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-purple-600/30 border border-purple-500 text-purple-300 text-xs flex items-center justify-center font-mono">
                            C
                          </span>
                          <span>Mô phỏng</span>
                        </h2>

                        {simSummary && (
                          <span className="text-xs font-mono text-purple-300 font-semibold px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/25">
                            Đang mô phỏng với: {simSummary}
                          </span>
                        )}
                      </div>

                      {/* Nhãn cảnh báo nếu đang hiển thị dữ liệu trước đó do lỗi */}
                      {isFallbackToPrevious && (
                        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                          <span>
                            Đang hiển thị dữ liệu trước đó (Dữ liệu vừa sửa có lỗi: {inputErrors._global || 'không hợp lệ'}, mô phỏng cũ còn nguyên).
                          </span>
                        </div>
                      )}

                      {/* Cảnh báo cắt bớt bước nếu vượt quá 500 */}
                      {exceededWarning && (
                        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                          <span>{exceededWarning}</span>
                        </div>
                      )}

                      {/* SimulationView 4 vùng đồng bộ */}
                      <SimulationView
                        lesson={activeLesson}
                        input={activeInput}
                        steps={activeSteps}
                        autoPlay={true}
                      />
                    </section>
                  </div>
                )}

                {/* TAB KIỂM TRA ĐỘ HIỂU */}
                {state.activeTab === 'quiz' && learningSource && (
                  <div className="space-y-6 pb-16">
                    <UnderstandingPanel source={learningSource} />
                  </div>
                )}
              </div>
            )}

            {/* NỘI DUNG THÔNG TIN DÀNH CHO BÀI STATUS 'SOON' (KHÔNG CÓ TAB) */}
            {activeLesson && activeLesson.status === 'soon' && (
              <div className="space-y-8 py-6 pb-16">
                <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-6 shadow-xl">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold">
                      #{activeLesson.order} • {activeLesson.group}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
                      Bài này sắp có
                    </span>
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
                      {activeLesson.title}
                    </h1>
                    <p className="text-sm sm:text-base text-slate-300 leading-relaxed mt-2">
                      {activeLesson.summary}
                    </p>
                  </div>

                  {/* Thông tin metadata */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                    <div>
                      <div className="text-slate-500 mb-0.5">Cấp độ học tập:</div>
                      <div className="font-semibold text-slate-200">{getLevelLabel(activeLesson.level)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-0.5">Mục tiêu thi cử:</div>
                      <div className="font-semibold text-indigo-300">{getContestLabel(activeLesson.contest)}</div>
                    </div>
                    <div>
                      <div className="text-slate-500 mb-0.5">Hình thái minh họa dự kiến:</div>
                      <div className="font-mono font-semibold text-purple-300 uppercase">{activeLesson.rendererKind}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-950/20 border border-blue-500/30 text-xs sm:text-sm text-blue-200 flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-blue-300 mb-0.5">Nội dung đang được biên tập</div>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        Bài học này đã có siêu dữ liệu và vị trí chuẩn trong cây kiến thức HSG Tin học. Khi biên soạn file nội dung trong thư mục <code>src/lessons/</code>, hệ thống sẽ tự động chuyển trạng thái thành sẵn sàng (ready).
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CHÂN TRANG NỘI DUNG */}
          <footer className="sticky bottom-0 z-30 w-full bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between gap-3">
            <button type="button"
              onClick={() => prevLesson && handleGoToLesson(prevLesson)}
              disabled={!prevLesson}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Bài trước</span>
            </button>

            {/* Nút Đánh dấu đã hiểu (bài 'soon' thì ẩn nút này) */}
            {activeLesson && activeLesson.status === 'ready' ? (
              <button type="button"
                onClick={handleToggleUnderstood}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer shadow-sm ${
                  isUnderstood
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                {isUnderstood ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Đã hiểu</span>
                  </>
                ) : (
                  <>
                    <Circle className="w-4 h-4 text-slate-500" />
                    <span>Đánh dấu đã hiểu</span>
                  </>
                )}
              </button>
            ) : (
              <div className="text-xs text-slate-500 italic">Bài đang biên soạn</div>
            )}

            <button type="button"
              onClick={() => nextLesson && handleGoToLesson(nextLesson)}
              disabled={!nextLesson}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <span>Bài sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </footer>
        </div>
  );
};
