import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.tsx';
import { getLessons, getNextRecommendedLesson, RegisteredLesson, LessonGroup } from '../../core/registry.ts';
import { Level, ContestTag } from '../../core/types.ts';
import { routes } from '../../core/routes.ts';
import { logComponentMount } from '../../core/devMonitor.ts';
import {
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  X,
  Circle,
  Clock,
  Sparkles,
  RotateCcw,
  Star,
} from 'lucide-react';

interface LearnSidebarProps {
  mode: 'concept' | 'algorithm';
}

function getLevelDotClass(level: Level): string {
  switch (level) {
    case 'nen-tang': return 'bg-slate-400';
    case 'co-ban': return 'bg-emerald-400';
    case 'trung-cap': return 'bg-blue-400';
    case 'nang-cao': return 'bg-purple-400';
  }
}

function getLevelStars(level: Level, contest: ContestTag): number {
  if (level === 'nen-tang') return 1;
  if (level === 'co-ban') return 2;
  if (level === 'trung-cap') return 3;
  if (level === 'nang-cao') return contest === 'core' ? 5 : 4;
  return 1;
}

export const LearnSidebar: React.FC<LearnSidebarProps> = ({ mode }) => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const currentFilters = state.filters[mode];

  // All lessons for this mode sorted by (groupOrder, order)
  const allLessons = useMemo(() => getLessons(mode), [mode]);

  // Overall progress using state.progress.understood
  const completedInMode = useMemo(() => {
    const idsInMode = new Set(allLessons.map((l) => l.id));
    return state.progress.understood.filter((id) => idsInMode.has(id));
  }, [allLessons, state.progress.understood]);

  const totalInMode = allLessons.length;
  const progressPercent = totalInMode > 0 ? Math.round((completedInMode.length / totalInMode) * 100) : 0;

  // Next recommended lesson
  const recommendedLesson = useMemo(() => {
    return getNextRecommendedLesson(mode, state.progress.understood);
  }, [mode, state.progress.understood]);

  // Handle filter changes
  const handleSetFilter = (field: 'level' | 'contest' | 'onlyReady' | 'search', value: any) => {
    dispatch({
      type: 'SET_FILTER',
      payload: { kind: mode, field, value },
    });
  };

  const handleResetFilters = () => {
    dispatch({ type: 'RESET_FILTER', payload: mode });
  };

  const isFilterActive =
    currentFilters.level !== 'all' ||
    currentFilters.contest !== 'all' ||
    currentFilters.onlyReady ||
    currentFilters.search.trim().length > 0;

  // Filter lessons
  const filteredLessons = useMemo(() => {
    return allLessons.filter((l) => {
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
  }, [allLessons, currentFilters]);

  // Group filtered lessons
  const groupedLessons = useMemo(() => {
    const map = new Map<string, LessonGroup>();
    for (const l of filteredLessons) {
      const key = `${l.groupOrder}-${l.group}`;
      if (!map.has(key)) {
        map.set(key, {
          groupName: l.group,
          groupOrder: l.groupOrder,
          topicNo: l.topicNo,
          lessons: [],
        });
      }
      map.get(key)!.lessons.push(l);
    }
    return Array.from(map.values()).sort((a, b) => a.groupOrder - b.groupOrder);
  }, [filteredLessons]);

  // ĐO KIỂM: Ghi nhận số lần mount của Sidebar (chỉ được 1 lần)
  useEffect(() => {
    logComponentMount('sidebar');
  }, []);

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const toggleGroup = (key: string) => {
    const groupKey = `${mode}-${key}`;
    setCollapsedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const isGroupCollapsed = (key: string): boolean => {
    const groupKey = `${mode}-${key}`;
    return Boolean(collapsedGroups[groupKey]);
  };

  const handleSelectLesson = (lessonId: string) => {
    navigate(routes.lesson(mode, lessonId));
    dispatch({ type: 'SELECT_LESSON', payload: lessonId });
    dispatch({ type: 'TOGGLE_SIDEBAR', payload: false });
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {state.isSidebarOpen && (
        <div
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR', payload: false })}
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar: ~320px wide, independent scrolling */}
      <aside
        className={`fixed md:sticky top-14 z-40 h-[calc(100vh-3.5rem)] w-[320px] flex-shrink-0 flex flex-col border-r border-slate-800 bg-slate-950 transition-transform duration-200 ease-in-out ${
          state.isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-slate-800 md:hidden">
          <span className="font-bold text-xs uppercase tracking-wider text-slate-300">
            {mode === 'concept' ? 'Danh mục Khái niệm (51)' : 'Danh mục Thuật toán (43)'}
          </span>
          <button
            type="button"
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR', payload: false })}
            className="p-1 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nút "Bài nên học tiếp" */}
        {recommendedLesson && (
          <div className="p-3 border-b border-slate-800/80 bg-blue-950/20">
            <button
              type="button"
              onClick={() => handleSelectLesson(recommendedLesson.id)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-200 hover:bg-blue-600/30 text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <div className="flex items-center gap-2 truncate">
                <Sparkles className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                <span className="truncate">
                  Học tiếp: #{recommendedLesson.order} {recommendedLesson.title}
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            </button>
          </div>
        )}

        {/* Bộ lọc Sidebar */}
        <div className="p-3 border-b border-slate-800/80 space-y-2.5 bg-slate-950/80">
          {/* (i) Ô tìm kiếm */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm theo tên hoặc tóm tắt..."
              value={currentFilters.search}
              onChange={(e) => handleSetFilter('search', e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* (ii) Hàng chip lọc cấp độ: Tất cả | Nền tảng | Cơ bản | Trung cấp | Nâng cao */}
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Cấp độ:</div>
            <div className="flex flex-wrap gap-1">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'nen-tang', label: 'Nền tảng' },
                { key: 'co-ban', label: 'Cơ bản' },
                { key: 'trung-cap', label: 'Trung cấp' },
                { key: 'nang-cao', label: 'Nâng cao' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => handleSetFilter('level', item.key)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                    currentFilters.level === item.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* (iii) Chip lọc thi cử: Tất cả | Cốt lõi thi | Hữu ích | Mở rộng */}
          <div className="space-y-1">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Thi cử:</div>
            <div className="flex flex-wrap gap-1">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'core', label: 'Cốt lõi thi' },
                { key: 'useful', label: 'Hữu ích' },
                { key: 'extra', label: 'Mở rộng' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.key}
                  onClick={() => handleSetFilter('contest', item.key)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                    currentFilters.contest === item.key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* (iv) Công tắc "Chỉ hiện bài đã sẵn sàng" */}
          <label className="flex items-center gap-2 cursor-pointer pt-0.5">
            <input
              type="checkbox"
              checked={currentFilters.onlyReady}
              onChange={(e) => handleSetFilter('onlyReady', e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0 cursor-pointer"
            />
            <span className="text-xs text-slate-300 font-medium select-none">
              Chỉ hiện bài đã sẵn sàng
            </span>
          </label>

          {/* Dòng "Đang lọc: ... (bỏ lọc)" nếu đang có bộ lọc */}
          {isFilterActive && (
            <div className="flex items-center justify-between pt-1 text-[11px] text-amber-300/90 bg-amber-950/30 px-2 py-1 rounded-lg border border-amber-500/20">
              <span className="truncate">
                Đang lọc: {filteredLessons.length}/{allLessons.length} bài
              </span>
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-amber-400 hover:underline font-semibold flex-shrink-0 cursor-pointer ml-1"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Bỏ lọc
              </button>
            </div>
          )}

          {/* (v) Thanh tiến độ tổng */}
          <div className="pt-1.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Tiến độ toàn bộ:</span>
              <span className="font-mono font-bold text-emerald-400">
                {completedInMode.length}/{totalInMode} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* (vi) Danh sách nhóm theo groupOrder (thu/gọn được, ghi "đã hiểu/tổng") */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {groupedLessons.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              Không tìm thấy bài học nào phù hợp với bộ lọc hiện tại.
            </div>
          ) : (
            groupedLessons.map((group) => {
              const groupKey = `${group.groupOrder}-${group.groupName}`;
              const isCollapsed = isGroupCollapsed(groupKey);

              const allInThisGroup = allLessons.filter((l) => l.group === group.groupName);
              const understoodInGroup = allInThisGroup.filter((l) =>
                state.progress.understood.includes(l.id)
              ).length;

              return (
                <div key={groupKey} className="space-y-1">
                  {/* Group Header */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(groupKey)}
                    className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-left text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900/60 transition-colors uppercase tracking-wider cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {isCollapsed ? (
                        <Folder className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      ) : (
                        <FolderOpen className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      )}
                      <span className="truncate">{group.groupName}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 flex-shrink-0">
                      <span className="text-emerald-400">{understoodInGroup}</span>/
                      <span>{allInThisGroup.length}</span>
                      {isCollapsed ? (
                        <ChevronRight className="w-3 h-3 text-slate-500 ml-0.5" />
                      ) : (
                        <ChevronDown className="w-3 h-3 text-slate-500 ml-0.5" />
                      )}
                    </div>
                  </button>

                  {/* List of lessons in group */}
                  {!isCollapsed && (
                    <div className="space-y-1 pl-1">
                      {group.lessons.map((lesson) => {
                        const isActive = lesson.id === state.activeLessonId;
                        const isUnderstood = state.progress.understood.includes(lesson.id);
                        const isSoon = lesson.status === 'soon';
                        const dotColor = getLevelDotClass(lesson.level);

                        return (
                          <button
                            type="button"
                            key={lesson.id}
                            onClick={() => handleSelectLesson(lesson.id)}
                            className={`w-full text-left p-2 rounded-xl transition-all duration-150 flex items-start gap-2 cursor-pointer ${
                              isActive
                                ? 'bg-blue-600/20 border border-blue-500/50 text-blue-200 shadow-sm font-semibold'
                                : 'hover:bg-slate-900/80 text-slate-300 border border-transparent'
                            }`}
                          >
                            <div className="pt-0.5 flex-shrink-0">
                              {isUnderstood ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              ) : isSoon ? (
                                <Clock className="w-3.5 h-3.5 text-slate-600" />
                              ) : (
                                <Circle className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-600'}`} />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <div className="flex items-center gap-1.5 truncate">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotColor}`}
                                    title={`Cấp độ: ${lesson.level}`}
                                  />
                                  <span className="text-xs truncate">
                                    <span className="font-mono text-slate-500 mr-1">{lesson.order}.</span>
                                    {lesson.title}
                                  </span>
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {/* Huy hiệu độ khó: 1-5 sao nhỏ */}
                                  <div
                                    className="flex items-center text-amber-400"
                                    title={`Độ khó: ${getLevelStars(lesson.level, lesson.contest)} sao (${lesson.level})`}
                                  >
                                    {Array.from({ length: getLevelStars(lesson.level, lesson.contest) }).map((_, sIdx) => (
                                      <Star key={sIdx} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                                    ))}
                                  </div>

                                  {lesson.contest === 'extra' && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-medium">
                                      Mở rộng
                                    </span>
                                  )}

                                  {isSoon && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                                      Sắp có
                                    </span>
                                  )}
                                </div>
                              </div>

                              <p className="text-[11px] text-slate-500 line-clamp-1">
                                {lesson.summary}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
};
