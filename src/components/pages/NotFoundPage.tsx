import React from 'react';
import { BackButton } from '../layout/BackButton.tsx';
import { routes } from '../../core/routes.ts';
import { useLeaveGuardContext } from '../../context/LeaveGuardContext.tsx';
import {
  AlertCircle,
  Home,
  BookOpen,
  Cpu,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  const { safeNavigate } = useLeaveGuardContext();

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-xl mx-auto space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shadow-lg">
          <AlertCircle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black text-slate-100 tracking-tight">
            404 - Không tìm thấy trang
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Đường dẫn bạn yêu cầu không tồn tại hoặc đã được chuyển sang địa chỉ mới. Bạn có thể quay về Trang chủ ngay chỉ với 1 cú click hoặc chọn các chuyên mục chính dưới đây:
          </p>
        </div>

        {/* 2 nút thao tác chính: Về trang chủ trong 1 lần bấm & Quay lại màn trước */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button type="button"
            onClick={() => safeNavigate(routes.home())}
            className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            <span>Về Trang chủ</span>
          </button>

          <BackButton label="Quay lại trang trước" />
        </div>

        {/* Gợi ý 3 mục menu chính */}
        <div className="w-full pt-4 border-t border-slate-800/80 space-y-3">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Gợi ý các khu vực học tập:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button type="button"
              onClick={() => safeNavigate(routes.concept())}
              className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500 text-left transition-all cursor-pointer min-h-[44px]"
            >
              <div className="text-blue-400 font-bold text-xs flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Khái niệm</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Lệnh tuần tự, biến, mảng</p>
            </button>

            <button type="button"
              onClick={() => safeNavigate(routes.algorithm())}
              className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500 text-left transition-all cursor-pointer min-h-[44px]"
            >
              <div className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5" />
                <span>Thuật toán</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Mô phỏng từng bước</p>
            </button>

            <button type="button"
              onClick={() => safeNavigate(routes.problem())}
              className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500 text-left transition-all cursor-pointer min-h-[44px]"
            >
              <div className="text-purple-400 font-bold text-xs flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Bài tập HSG</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Luyện code có chấm subtask</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFoundPage;
