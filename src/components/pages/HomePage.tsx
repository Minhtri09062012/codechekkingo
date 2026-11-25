import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext.tsx';
import { routes } from '../../core/routes.ts';
import { getLessons, getReadyCount, getProblems } from '../../core/registry.ts';
import { BookOpen, Cpu, HelpCircle, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { APP_NAME, APP_TAGLINE, BrandIcon } from '../../core/brand.ts';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useApp();

  const conceptStats = getReadyCount('concept');
  const algorithmStats = getReadyCount('algorithm');

  const readyConcepts = getLessons('concept').filter((l) => l.status === 'ready');
  const firstConcept = readyConcepts[0] || getLessons('concept')[0];

  const readyAlgorithms = getLessons('algorithm').filter((l) => l.status === 'ready');
  const firstAlgorithm = readyAlgorithms[0] || getLessons('algorithm')[0];

  const handleNavigateConcept = () => {
    navigate(routes.concept(firstConcept?.id));
  };

  const handleNavigateAlgorithm = () => {
    navigate(routes.algorithm(firstAlgorithm?.id));
  };

  const handleNavigateProblem = () => {
    navigate(routes.problem());
  };

  return (
    <div className={`flex-1 flex flex-col justify-center px-4 sm:px-6 py-12 ${state.classroomMode ? 'text-lg' : ''}`}>
      <main className="max-w-5xl mx-auto w-full flex flex-col items-center">
        <div className="max-w-4xl w-full text-center space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            Nền tảng trực quan hoá lập trình Python 3 cho HSG Tin
          </div>

          <div className="flex items-center justify-center gap-3">
            <BrandIcon size="xl" />
            <h1 className={`font-black tracking-tight text-slate-100 ${
              state.classroomMode ? 'text-3xl sm:text-5xl' : 'text-3xl sm:text-4xl lg:text-5xl'
            }`}>
              <span className="bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent">
                {APP_NAME}
              </span>
            </h1>
          </div>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base font-medium leading-relaxed">
            {APP_TAGLINE}
          </p>
          <p className="text-slate-400 max-w-xl mx-auto text-xs sm:text-sm">
            Chọn phương pháp học phù hợp để bắt đầu khám phá từng bước dòng chảy dữ liệu.
          </p>
        </div>

        {/* 3 thẻ nút lớn ở giữa màn hình, cùng kích thước */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl">
          {/* Card 1: Học khái niệm */}
          <button
            type="button"
            onClick={handleNavigateConcept}
            className="group text-left p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-blue-500 hover:bg-slate-900 transition-all duration-200 shadow-xl flex flex-col justify-between h-80 cursor-pointer transform hover:-translate-y-1 hover:shadow-blue-500/10"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <BookOpen className="w-7 h-7" />
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-semibold font-mono">
                  {conceptStats.ready}/{conceptStats.total} bài sẵn sàng
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-100 group-hover:text-blue-300 transition-colors mb-2">
                Học khái niệm
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Hiểu biến, vòng lặp, mảng, hàm... qua hình ảnh
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 pt-4 border-t border-slate-800/80 group-hover:translate-x-1 transition-transform">
              <span>Bắt đầu học</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Card 2: Học thuật toán */}
          <button
            type="button"
            onClick={handleNavigateAlgorithm}
            className="group text-left p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500 hover:bg-slate-900 transition-all duration-200 shadow-xl flex flex-col justify-between h-80 cursor-pointer transform hover:-translate-y-1 hover:shadow-emerald-500/10"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Cpu className="w-7 h-7" />
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold font-mono">
                  {algorithmStats.ready}/{algorithmStats.total} bài sẵn sàng
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-100 group-hover:text-emerald-300 transition-colors mb-2">
                Học thuật toán
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Xem thuật toán chạy từng bước với dữ liệu của em
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 pt-4 border-t border-slate-800/80 group-hover:translate-x-1 transition-transform">
              <span>Khám phá thuật toán</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Card 3: Hiểu bài tập */}
          <button
            type="button"
            onClick={handleNavigateProblem}
            className="group text-left p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-purple-500 hover:bg-slate-900 transition-all duration-200 shadow-xl flex flex-col justify-between h-80 cursor-pointer transform hover:-translate-y-1 hover:shadow-purple-500/10"
          >
            <div>
              <div className="flex items-center justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-purple-600/20 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <HelpCircle className="w-7 h-7" />
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold font-mono">
                  {getProblems().length} bài luyện tập
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-100 group-hover:text-purple-300 transition-colors mb-2">
                Hiểu bài tập
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Chọn một đề bài, được dẫn dắt để tự viết code
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 pt-4 border-t border-slate-800/80 group-hover:translate-x-1 transition-transform">
              <span>Luyện bài tập HSG</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Các tính năng nâng cao: Test đầu vào, Luyện thi, Sổ lỗi, HLV, Hồ sơ, Nhập đề */}
        <div className="w-full max-w-5xl mt-10 pt-8 border-t border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-bold uppercase tracking-wider text-slate-300">Tính năng chuyên sâu HSG Tin:</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <button
              type="button"
              onClick={() => navigate(routes.placement())}
              className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all text-left space-y-1.5 cursor-pointer"
            >
              <div className="text-blue-400 font-bold text-xs flex items-center gap-1">
                <span>Test đầu vào</span>
                <ArrowRight className="w-3 h-3" />
              </div>
              <p className="text-[11px] text-slate-400">Kiểm tra thích ứng 11 chuyên đề</p>
            </button>

            <button
              type="button"
              onClick={() => navigate(routes.exam())}
              className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-900 transition-all text-left space-y-1.5 cursor-pointer"
            >
              <div className="text-rose-400 font-bold text-xs flex items-center gap-1">
                <span>Luyện thi thật</span>
                <ArrowRight className="w-3 h-3" />
              </div>
              <p className="text-[11px] text-slate-400">Thi 4 bài chấm subtask đếm ngược</p>
            </button>

            <button
              type="button"
              onClick={() => navigate(routes.errors())}
              className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900 transition-all text-left space-y-1.5 cursor-pointer"
            >
              <div className="text-amber-400 font-bold text-xs flex items-center gap-1">
                <span>Sổ tay lỗi</span>
                <ArrowRight className="w-3 h-3" />
              </div>
              <p className="text-[11px] text-slate-400">Nhắc ôn sau 3 ngày & đã sửa</p>
            </button>

            <button
              type="button"
              onClick={() => navigate(routes.profile())}
              className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-900 transition-all text-left space-y-1.5 cursor-pointer"
            >
              <div className="text-purple-400 font-bold text-xs flex items-center gap-1">
                <span>Hồ sơ năng lực</span>
                <ArrowRight className="w-3 h-3" />
              </div>
              <p className="text-[11px] text-slate-400">Biểu đồ radar 11 chuyên đề</p>
            </button>

            <button
              type="button"
              onClick={() => navigate(routes.coach())}
              className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all text-left space-y-1.5 cursor-pointer"
            >
              <div className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                <span>Huấn luyện viên</span>
                <ArrowRight className="w-3 h-3" />
              </div>
              <p className="text-[11px] text-slate-400">So sánh đội tuyển & xuất CSV</p>
            </button>

            <button
              type="button"
              onClick={() => navigate(routes.import())}
              className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 transition-all text-left space-y-1.5 cursor-pointer"
            >
              <div className="text-cyan-400 font-bold text-xs flex items-center gap-1">
                <span>Nhập đề bài</span>
                <ArrowRight className="w-3 h-3" />
              </div>
              <p className="text-[11px] text-slate-400">Kiểm định Pyodide & xuất .ts</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
