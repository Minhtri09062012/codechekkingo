import React, { useState, useEffect } from 'react';
import { useLocation, NavLink, Link } from 'react-router-dom';
import {
  Home,
  BookOpen,
  Trophy,
  AlertTriangle,
  MoreHorizontal,
  Cpu,
  HelpCircle,
  Compass,
  User,
  Users,
  FileCode,
  Tv,
  FileJson,
  Keyboard,
  X,
} from 'lucide-react';
import { routes, isPathActive } from '../../core/routes.ts';
import { useLeaveGuardContext } from '../../context/LeaveGuardContext.tsx';
import { useApp } from '../../context/AppContext.tsx';
import { ProgressModal } from '../modals/ProgressModal.tsx';
import { KeyboardShortcutsModal } from '../modals/KeyboardShortcutsModal.tsx';

interface BottomTabBarProps {
  isExamRunning?: boolean;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ isExamRunning = false }) => {
  const location = useLocation();
  const { safeNavigate, guardConfig } = useLeaveGuardContext();
  const { state, dispatch } = useApp();

  const handleLinkClick = (to: string) => (e: React.MouseEvent) => {
    if (guardConfig.isGuarded) {
      e.preventDefault();
      safeNavigate(to);
    }
  };

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [showLearnSheet, setShowLearnSheet] = useState(false);
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  // Phát hiện bàn phím ảo mở trên thiết bị di động
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      const vh = window.visualViewport?.height || window.innerHeight;
      const wh = window.innerHeight;
      // Nếu chiều cao viewport nhỏ hơn đáng kể (>150px) so với window, bàn phím đang mở
      setIsKeyboardOpen(wh - vh > 150);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  // Đóng sheets khi chuyển route
  useEffect(() => {
    setShowLearnSheet(false);
    setShowMoreSheet(false);
  }, [location.pathname]);

  // Ẩn thanh dưới khi bàn phím mở hoặc đang trong giờ thi
  if (isKeyboardOpen || isExamRunning) {
    return null;
  }

  const overdueErrorCount = (state.progress.errorBook || []).filter((e) => {
    if (!e.at) return false;
    const diffMs = Date.now() - new Date(e.at).getTime();
    const isOverdue = diffMs >= 3 * 24 * 60 * 60 * 1000;
    const isResolved = (state.progress.solved[e.sourceId]?.bestScore ?? 0) >= 100;
    return isOverdue && !isResolved;
  }).length;

  const isHomeActive = location.pathname === '/' || location.pathname === '';
  const isLearnActive =
    location.pathname.startsWith('/concept') ||
    location.pathname.startsWith('/algorithm') ||
    location.pathname.startsWith('/problem');
  const isExamActive = location.pathname.startsWith('/exam');
  const isErrorsActive = location.pathname.startsWith('/errors');
  const isMoreActive =
    location.pathname.startsWith('/placement') ||
    location.pathname.startsWith('/profile') ||
    location.pathname.startsWith('/coach') ||
    location.pathname.startsWith('/import');

  return (
    <>
      <nav
        aria-label="Thanh điều hướng di động"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-2 py-1 flex items-center justify-around shadow-2xl pb-safe"
      >
        {/* 1. Trang chủ */}
        <NavLink
          to={routes.home()}
          onClick={handleLinkClick(routes.home())}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1 rounded-xl transition-colors cursor-pointer ${
              isActive ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
          aria-label="Trang chủ"
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Trang chủ</span>
        </NavLink>

        {/* 2. Học (Mở popup lựa chọn) */}
        <button type="button"
          onClick={() => {
            setShowLearnSheet(!showLearnSheet);
            setShowMoreSheet(false);
          }}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1 rounded-xl transition-colors cursor-pointer ${
            isLearnActive || showLearnSheet ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Học"
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Học</span>
        </button>

        {/* 3. Luyện thi */}
        <NavLink
          to={routes.exam()}
          onClick={handleLinkClick(routes.exam())}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1 rounded-xl transition-colors cursor-pointer ${
              isActive || isExamActive ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
          aria-label="Luyện thi"
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Luyện thi</span>
        </NavLink>

        {/* 4. Sổ lỗi */}
        <NavLink
          to={routes.errors()}
          onClick={handleLinkClick(routes.errors())}
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1 rounded-xl transition-colors cursor-pointer ${
              isActive || isErrorsActive ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`
          }
          aria-label="Sổ lỗi"
        >
          <AlertTriangle className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Sổ lỗi</span>
          {overdueErrorCount > 0 && (
            <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold font-mono text-[9px] flex items-center justify-center animate-pulse">
              {overdueErrorCount}
            </span>
          )}
        </NavLink>

        {/* 5. Thêm */}
        <button type="button"
          onClick={() => {
            setShowMoreSheet(!showMoreSheet);
            setShowLearnSheet(false);
          }}
          className={`flex flex-col items-center justify-center min-w-[48px] min-h-[48px] px-2 py-1 rounded-xl transition-colors cursor-pointer ${
            isMoreActive || showMoreSheet ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
          aria-label="Thêm"
        >
          <MoreHorizontal className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Thêm</span>
        </button>
      </nav>

      {/* POPUP BẢNG CHỌN "HỌC" */}
      {showLearnSheet && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex flex-col justify-end p-3 animate-fade-in"
          onClick={() => setShowLearnSheet(false)}
        >
          <div
            className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-400" />
                <span>Phương pháp học</span>
              </h3>
              <button type="button"
                onClick={() => setShowLearnSheet(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              <NavLink
                to={routes.concept()}
                onClick={(e) => {
                  setShowLearnSheet(false);
                  handleLinkClick(routes.concept())(e);
                }}
                className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-blue-500 flex items-center gap-3 text-left transition-all cursor-pointer min-h-[48px]"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-100">Học khái niệm</div>
                  <div className="text-[11px] text-slate-400">Hiểu biến, vòng lặp, mảng qua hình ảnh</div>
                </div>
              </NavLink>

              <NavLink
                to={routes.algorithm()}
                onClick={(e) => {
                  setShowLearnSheet(false);
                  handleLinkClick(routes.algorithm())(e);
                }}
                className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500 flex items-center gap-3 text-left transition-all cursor-pointer min-h-[48px]"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-100">Học thuật toán</div>
                  <div className="text-[11px] text-slate-400">Xem thuật toán chạy từng bước với dữ liệu của em</div>
                </div>
              </NavLink>

              <NavLink
                to={routes.problem()}
                onClick={(e) => {
                  setShowLearnSheet(false);
                  handleLinkClick(routes.problem())(e);
                }}
                className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-purple-500 flex items-center gap-3 text-left transition-all cursor-pointer min-h-[48px]"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-100">Hiểu bài tập</div>
                  <div className="text-[11px] text-slate-400">Được dẫn dắt để tự viết code bài tập HSG</div>
                </div>
              </NavLink>
            </div>
          </div>
        </div>
      )}

      {/* POPUP NGĂN KÉO "THÊM" */}
      {showMoreSheet && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex flex-col justify-end p-3 animate-fade-in"
          onClick={() => setShowMoreSheet(false)}
        >
          <div
            className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm text-slate-100">Tính năng mở rộng</h3>
              <button type="button"
                onClick={() => setShowMoreSheet(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <NavLink
                to={routes.placement()}
                onClick={(e) => {
                  setShowMoreSheet(false);
                  handleLinkClick(routes.placement())(e);
                }}
                className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:bg-slate-800 flex items-center gap-2.5 text-left cursor-pointer min-h-[44px]"
              >
                <Compass className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Test đầu vào</span>
              </NavLink>

              <NavLink
                to={routes.profile()}
                onClick={(e) => {
                  setShowMoreSheet(false);
                  handleLinkClick(routes.profile())(e);
                }}
                className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:bg-slate-800 flex items-center gap-2.5 text-left cursor-pointer min-h-[44px]"
              >
                <User className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Hồ sơ năng lực</span>
              </NavLink>

              <NavLink
                to={routes.coach()}
                onClick={(e) => {
                  setShowMoreSheet(false);
                  handleLinkClick(routes.coach())(e);
                }}
                className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:bg-slate-800 flex items-center gap-2.5 text-left cursor-pointer min-h-[44px]"
              >
                <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Huấn luyện viên</span>
              </NavLink>

              <NavLink
                to={routes.import()}
                onClick={(e) => {
                  setShowMoreSheet(false);
                  handleLinkClick(routes.import())(e);
                }}
                className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:bg-slate-800 flex items-center gap-2.5 text-left cursor-pointer min-h-[44px]"
              >
                <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Nhập đề bài</span>
              </NavLink>

              <button type="button"
                onClick={() => {
                  setShowMoreSheet(false);
                  dispatch({ type: 'TOGGLE_CLASSROOM_MODE' });
                }}
                className={`p-3 rounded-2xl border flex items-center gap-2.5 text-left cursor-pointer min-h-[44px] ${
                  state.classroomMode
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300'
                }`}
              >
                <Tv className="w-4 h-4 shrink-0" />
                <span>Chiếu lớp: {state.classroomMode ? 'BẬT' : 'TẮT'}</span>
              </button>

              <button type="button"
                onClick={() => {
                  setShowMoreSheet(false);
                  setShowProgressModal(true);
                }}
                className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:bg-slate-800 flex items-center gap-2.5 text-left cursor-pointer min-h-[44px]"
              >
                <FileJson className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Tiến độ JSON</span>
              </button>

              <button type="button"
                onClick={() => {
                  setShowMoreSheet(false);
                  setShowShortcutsModal(true);
                }}
                className="col-span-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:bg-slate-800 flex items-center justify-center gap-2 text-slate-300 cursor-pointer min-h-[44px]"
              >
                <Keyboard className="w-4 h-4 text-slate-400" />
                <span>Bảng phím tắt (?)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showProgressModal && <ProgressModal onClose={() => setShowProgressModal(false)} />}
      {showShortcutsModal && <KeyboardShortcutsModal onClose={() => setShowShortcutsModal(false)} />}
    </>
  );
};

export default BottomTabBar;
