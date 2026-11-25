import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getProblems, getLessonsOfProblem, devWarnings } from '../../core/registry.ts';
import { Problem } from '../../core/types.ts';
import { routes } from '../../core/routes.ts';
import { useApp } from '../../context/AppContext.tsx';
import {
  HelpCircle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  Award,
  AlertTriangle,
} from 'lucide-react';

const TOPIC_NAMES: Record<number, string> = {
  1: 'Duyệt và đếm',
  2: 'Đoạn con và cộng dồn',
  3: 'Số học',
  4: 'Sắp xếp và tìm kiếm',
  5: 'Tham lam và vét cạn',
  6: 'Quy hoạch động cơ bản',
  7: 'Đồ thị cơ bản',
};

export const ProblemListPage: React.FC = () => {
  const { state } = useApp();
  const allProblems = useMemo(() => getProblems(), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<number | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [onlyWithSim, setOnlyWithSim] = useState(false);

  // Lọc danh sách bài tập
  const filteredProblems = useMemo(() => {
    return allProblems.filter((p) => {
      if (selectedTopic !== 'all' && p.topicNo !== selectedTopic) return false;
      if (selectedLevel !== 'all' && p.level !== selectedLevel) return false;

      const readyCount = getLessonsOfProblem(p.id).length;
      if (onlyWithSim && readyCount === 0) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (p.title || '').toLowerCase().includes(q);
        const matchId = (p.id || '').toLowerCase().includes(q);
        const tags = Array.isArray(p.tags) ? p.tags : [];
        const matchTags = tags.some((t) => typeof t === 'string' && t.toLowerCase().includes(q));
        if (!matchTitle && !matchId && !matchTags) return false;
      }

      return true;
    });
  }, [allProblems, selectedTopic, selectedLevel, onlyWithSim, searchQuery]);

  return (
    <div className={`flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8 ${state.classroomMode ? 'text-lg' : ''}`}>
      {/* Dev Warnings Banner nếu có dữ liệu bài tập phải tự sửa */}
      {devWarnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/80 border border-amber-600/50 text-xs text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-300">[Dev Cảnh báo chuẩn hóa dữ liệu bài tập]:</span>
            <ul className="list-disc pl-4 space-y-0.5 text-amber-200/90 font-mono text-[11px]">
              {devWarnings.map((w, idx) => (
                <li key={idx}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Banner tiêu đề */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
              Chế độ Hiểu bài tập
            </span>
            <span className="text-xs text-slate-500">
              Đề thi Tin học trẻ & HSG Tin học
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-100">
            Kho bài tập luyện đề chuẩn thi cử
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Mỗi bài tập được thiết kế đúng chuẩn định dạng file vào/ra, subtasks, phân tích độ phức tạp thuật toán và dẫn dắt 4 cấp độ tư duy.
          </p>
        </div>

        {/* Thanh công cụ tìm kiếm và bộ lọc */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Ô tìm kiếm */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm bài tập theo tên, mã bài hoặc thẻ tag (ví dụ: sodb, cộng dồn)..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Bộ lọc mức độ */}
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="all">Tất cả mức độ (A, B, C, HSG)</option>
              <option value="A">Mức A (Cơ bản)</option>
              <option value="B">Mức B (Khá)</option>
              <option value="C">Mức C (Giỏi)</option>
              <option value="HSG">Mức HSG (Chuyên đề nâng cao)</option>
            </select>

            {/* Bộ lọc chuyên đề */}
            <select
              value={selectedTopic}
              onChange={(e) =>
                setSelectedTopic(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="all">Tất cả chuyên đề</option>
              <option value="1">Chuyên đề 1: Duyệt và đếm</option>
              <option value="2">Chuyên đề 2: Đoạn con và cộng dồn</option>
              <option value="3">Chuyên đề 3: Số học</option>
              <option value="4">Chuyên đề 4: Sắp xếp và tìm kiếm</option>
              <option value="5">Chuyên đề 5: Tham lam và vét cạn</option>
            </select>
          </div>

          {/* Toggle chỉ bài có mô phỏng */}
          <div className="flex items-center justify-between pt-1 text-xs text-slate-400 border-t border-slate-800/80">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyWithSim}
                onChange={(e) => setOnlyWithSim(e.target.checked)}
                className="accent-purple-500 rounded"
              />
              <span>Chỉ hiển thị bài có liên kết mô phỏng sẵn sàng</span>
            </label>

            <span>
              Tìm thấy <strong className="text-purple-300">{filteredProblems.length}</strong> bài tập
            </span>
          </div>
        </div>

        {/* Lưới danh sách các bài tập */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProblems.map((prob) => {
            const readyLessons = getLessonsOfProblem(prob.id);
            const hasSim = readyLessons.length > 0;
            const isSolved = Boolean(state.progress.solved[prob.id]);
            const topicName = TOPIC_NAMES[prob.topicNo] || `Chuyên đề #${prob.topicNo}`;

            return (
              <Link
                key={prob.id}
                to={routes.problem(prob.id)}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900 transition-all flex flex-col justify-between space-y-4 group shadow-md"
              >
                <div className="space-y-2.5">
                  {/* Hàng metadata clean unboxed (Tuân thủ Zero-Pill) */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-400">{topicName}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-indigo-400">Mức {prob.level}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSolved && (
                        <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Đã giải
                        </span>
                      )}
                      {hasSim ? (
                        <span className="text-[11px] text-emerald-400 font-medium">
                          ✓ Có mô phỏng
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500">
                          Chưa có mô phỏng
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tiêu đề bài tập */}
                  <div>
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-purple-300 transition-colors">
                      {prob.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {prob.task.statement}
                    </p>
                  </div>

                  {/* Thẻ tags */}
                  {prob.tags && prob.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {prob.tags
                        .filter((tag) => !tag.toUpperCase().includes('HSG'))
                        .map((tag, tIdx) => (
                          <span
                            key={tIdx}
                            className="text-[10px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800/80"
                          >
                            #{tag}
                          </span>
                        ))}
                    </div>
                  )}
                </div>

                {/* Footer thẻ: Tên file & Nút xem */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                  <span className="font-mono text-[11px]">
                    {prob.task.ioMode.kind === 'file'
                      ? `${prob.task.ioMode.inputFile} / ${prob.task.ioMode.outputFile}`
                      : 'stdin / stdout'}
                  </span>

                  <span className="inline-flex items-center gap-1 font-semibold text-purple-400 group-hover:translate-x-1 transition-transform">
                    Vào luyện bài <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredProblems.length === 0 && (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-800 space-y-2">
            <p className="text-sm font-semibold text-slate-300">Không tìm thấy bài tập nào</p>
            <p className="text-xs text-slate-500">
              Hãy thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn các tiêu chí lọc.
            </p>
          </div>
        )}
      </div>
    );
  };
