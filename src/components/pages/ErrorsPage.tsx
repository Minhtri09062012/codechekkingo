import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.tsx';
import { getLesson, getProblem, getLessonTopicNo } from '../../core/registry.ts';
import { ErrorEntry, TOPIC_NAMES } from '../../core/types.ts';
import {
  BookOpen,
  RotateCcw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileCode,
  Tag,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  Filter,
  Flame,
  Check,
  ChevronDown,
} from 'lucide-react';

export const ErrorsPage: React.FC = () => {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<number | 'all'>('all');
  const [selectedFixedStatus, setSelectedFixedStatus] = useState<'all' | 'unfixed' | 'fixed'>('all');
  const [onlyOverdue, setOnlyOverdue] = useState<boolean>(false);

  const errorBook = state.progress.errorBook || [];

  // Hàm kiểm tra bài đã được khắc phục (nộp lại đạt điểm tối đa 100)
  const isSourceResolved = (sourceId: string): boolean => {
    return (state.progress.solved[sourceId]?.bestScore ?? 0) >= 100;
  };

  // Hàm kiểm tra lỗi đã quá hạn 3 ngày cần làm lại
  const isEntryOverdue = (at: string): boolean => {
    if (!at) return false;
    const diffMs = Date.now() - new Date(at).getTime();
    return diffMs >= 3 * 24 * 60 * 60 * 1000; // 3 ngày
  };

  // Thống kê theo phân loại lỗi
  const typeStats = useMemo(() => {
    const stats: Record<string, number> = {
      all: errorBook.length,
      'wrong-algorithm': 0,
      'wrong-edge': 0,
      'wrong-format': 0,
      timeout: 0,
      runtime: 0,
    };

    for (const e of errorBook) {
      if (stats[e.type] !== undefined) {
        stats[e.type]++;
      }
    }
    return stats;
  }, [errorBook]);

  // Thống kê số lỗi quá hạn 3 ngày
  const overdueCount = useMemo(() => {
    return errorBook.filter((e) => isEntryOverdue(e.at) && !isSourceResolved(e.sourceId)).length;
  }, [errorBook, state.progress.solved]);

  // Lọc danh sách lỗi
  const filteredErrors = useMemo(() => {
    return errorBook.filter((e) => {
      // 1. Lọc theo loại lỗi
      if (selectedType !== 'all' && e.type !== selectedType) return false;

      // 2. Lọc theo chuyên đề
      if (selectedTopic !== 'all') {
        const topic = getLessonTopicNo(e.sourceId);
        if (topic !== selectedTopic) return false;
      }

      // 3. Lọc theo trạng thái khắc phục
      const resolved = isSourceResolved(e.sourceId);
      if (selectedFixedStatus === 'fixed' && !resolved) return false;
      if (selectedFixedStatus === 'unfixed' && resolved) return false;

      // 4. Lọc chỉ xem lỗi quá 3 ngày
      if (onlyOverdue && !isEntryOverdue(e.at)) return false;

      return true;
    });
  }, [errorBook, selectedType, selectedTopic, selectedFixedStatus, onlyOverdue, state.progress.solved]);

  // Gom nhóm theo ngày
  const groupedByDate = useMemo(() => {
    const groups: { dateStr: string; entries: ErrorEntry[] }[] = [];
    const dateMap = new Map<string, ErrorEntry[]>();

    for (const item of [...filteredErrors].reverse()) {
      const d = item.at ? new Date(item.at) : new Date();
      const dateKey = `${d.toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })}`;

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      dateMap.get(dateKey)!.push(item);
    }

    for (const [dateStr, entries] of dateMap.entries()) {
      groups.push({ dateStr, entries });
    }

    return groups;
  }, [filteredErrors]);

  const handleRetry = (sourceId: string) => {
    const prob = getProblem(sourceId);
    if (prob) {
      navigate(`/problem/${sourceId}`);
      return;
    }
    const les = getLesson(sourceId);
    if (les) {
      dispatch({ type: 'SET_TAB', payload: 'quiz' });
      navigate(`/${les.kind}/${sourceId}`);
      return;
    }
    // Fallback
    navigate(`/concept/${sourceId}`);
  };

  const getTypeBadge = (type: ErrorEntry['type']) => {
    switch (type) {
      case 'wrong-algorithm':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Sai thuật toán
          </span>
        );
      case 'wrong-edge':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Sai trường hợp biên
          </span>
        );
      case 'wrong-format':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Sai định dạng đầu ra
          </span>
        );
      case 'timeout':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Quá thời gian (TLE)
          </span>
        );
      case 'runtime':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
            Lỗi thực thi (Runtime)
          </span>
        );
    }
  };

  return (
    <div className={`flex-1 flex flex-col ${state.classroomMode ? 'text-lg' : ''}`}>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Header Sổ tay lỗi */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                Sổ tay lỗi cá nhân (ErrorBook)
              </span>
              <span className="text-xs text-slate-500 font-mono">
                Tổng cộng: {errorBook.length} lỗi
              </span>
              {overdueCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  {overdueCount} lỗi cần làm lại sau 3 ngày
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              Nhật ký sai sót & Bẫy lập trình đã gặp
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Theo dõi và rà soát các test sai. Hệ thống tự động nhắc nhở làm lại sau 3 ngày và đánh dấu "Đã khắc phục" khi nộp lại đạt 100 điểm.
            </p>
          </div>
        </div>

        {/* KHỐI BỘ LỌC ĐA TIÊU CHÍ */}
        <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3.5 shadow-lg">
          {/* Hàng 1: Lọc loại lỗi */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'Tất cả', count: typeStats.all },
              { id: 'wrong-algorithm', label: 'Sai thuật toán', count: typeStats['wrong-algorithm'] },
              { id: 'wrong-edge', label: 'Sai biên', count: typeStats['wrong-edge'] },
              { id: 'wrong-format', label: 'Sai định dạng', count: typeStats['wrong-format'] },
              { id: 'timeout', label: 'Quá thời gian', count: typeStats.timeout },
              { id: 'runtime', label: 'Lỗi chạy', count: typeStats.runtime },
            ].map((tab) => (
              <button type="button"
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  selectedType === tab.id
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-950/60 font-mono">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Hàng 2: Lọc theo Chuyên đề (1-11), Khắc phục và Nhắc 3 ngày */}
          <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-800/80 text-xs">
            {/* Dropdown lọc theo chuyên đề */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">Chuyên đề:</span>
              <select
                value={selectedTopic}
                onChange={(e) =>
                  setSelectedTopic(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="all">Tất cả chuyên đề (1 - 11)</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((no) => (
                  <option key={no} value={no}>
                    #{no}: {TOPIC_NAMES[no]}
                  </option>
                ))}
              </select>
            </div>

            {/* Trạng thái đã khắc phục */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">Trạng thái:</span>
              <select
                value={selectedFixedStatus}
                onChange={(e) => setSelectedFixedStatus(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="unfixed">Chưa khắc phục</option>
                <option value="fixed">Đã khắc phục (100đ)</option>
              </select>
            </div>

            {/* Checkbox chỉ xem lỗi quá 3 ngày */}
            <button type="button"
              onClick={() => setOnlyOverdue(!onlyOverdue)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                onlyOverdue
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Đề xuất làm lại (quá 3 ngày)</span>
            </button>
          </div>
        </div>

        {/* Danh sách lỗi nhóm theo ngày */}
        {groupedByDate.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-base sm:text-lg font-bold text-slate-200">
              Không có lỗi nào phù hợp tiêu chí lọc!
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Em đã khắc phục hết hoặc chưa có lỗi nào thuộc danh mục này. Hãy tiếp tục luyện tập nhé!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedByDate.map((group) => (
              <div key={group.dateStr} className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400 px-1 capitalize">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>{group.dateStr}</span>
                </div>

                <div className="space-y-2.5">
                  {group.entries.map((item, idx) => {
                    const les = getLesson(item.sourceId);
                    const prob = getProblem(item.sourceId);
                    const title = les?.title || prob?.title || item.sourceId;
                    const topicNo = getLessonTopicNo(item.sourceId);
                    const isFixed = isSourceResolved(item.sourceId);
                    const isOverdue = isEntryOverdue(item.at);

                    const timeStr = item.at
                      ? new Date(item.at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                      : '';

                    return (
                      <div
                        key={`${item.sourceId}-${item.at}-${idx}`}
                        className={`p-4 rounded-2xl border transition-all shadow-md flex flex-wrap items-center justify-between gap-4 ${
                          isFixed
                            ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
                            : isOverdue
                            ? 'bg-amber-950/20 border-amber-500/30'
                            : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            {getTypeBadge(item.type)}

                            {/* Huy hiệu chuyên đề */}
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300">
                              Chuyên đề #{topicNo}: {TOPIC_NAMES[topicNo]}
                            </span>

                            {/* Huy hiệu đã khắc phục */}
                            {isFixed ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Đã khắc phục (100đ)
                              </span>
                            ) : isOverdue ? (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 animate-pulse">
                                <Flame className="w-3 h-3 text-amber-400" />
                                Cần làm lại ngay (quá 3 ngày)
                              </span>
                            ) : null}

                            <span className="text-xs text-slate-400 font-mono">
                              {item.testLabel}
                            </span>
                            <span className="text-xs text-slate-500">· {timeStr}</span>
                          </div>

                          <div className="text-sm font-bold text-slate-100 flex items-center gap-2">
                            <span>{title}</span>
                            <span className="text-[11px] font-mono text-slate-500 font-normal">
                              #{item.sourceId}
                            </span>
                          </div>
                        </div>

                        {/* NÚT LÀM LẠI */}
                        <button type="button"
                          onClick={() => handleRetry(item.sourceId)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer ${
                            isOverdue && !isFixed
                              ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-black shadow-amber-600/30'
                              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20'
                          }`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Làm lại ngay</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default ErrorsPage;
