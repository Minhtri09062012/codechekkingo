import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, NavLink } from 'react-router-dom';
import { useApp } from '../../context/AppContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLeaveGuardContext } from '../../context/LeaveGuardContext.tsx';
import { routes, isPathActive } from '../../core/routes.ts';
import { logComponentMount } from '../../core/devMonitor.ts';
import {
  Code2,
  Tv,
  FileJson,
  Menu,
  ChevronDown,
  BookOpen,
  Cpu,
  HelpCircle,
  Trophy,
  Compass,
  AlertTriangle,
  User,
  Users,
  FileCode,
  Keyboard,
  LogOut,
  Zap,
} from 'lucide-react';
import { ProgressModal } from '../modals/ProgressModal.tsx';
import { KeyboardShortcutsModal } from '../modals/KeyboardShortcutsModal.tsx';
import { BrandLogo, APP_NAME, APP_SHORT_NAME } from '../../core/brand.ts';

interface NavbarProps {
  showSidebarToggle?: boolean;
  isExamRunning?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  showSidebarToggle = false,
  isExamRunning = false,
}) => {
  const { state, dispatch } = useApp();
  const { safeNavigate, guardConfig } = useLeaveGuardContext();
  const location = useLocation();

  const handleLinkClick = (to: string) => (e: React.MouseEvent) => {
    if (guardConfig.isGuarded) {
      e.preventDefault();
      safeNavigate(to);
    }
  };

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const { user, openLoginModal, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<'me' | 'teacher' | null>(null);
  const meMenuRef = useRef<HTMLDivElement>(null);
  const teacherMenuRef = useRef<HTMLDivElement>(null);

  // ĐO KIỂM: Ghi nhận số lần mount của Navbar (AppHeader) (chỉ được 1 lần)
  useEffect(() => {
    logComponentMount('appHeader');
  }, []);

  // Đóng dropdown khi click bên ngoài hoặc bấm phím Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        meMenuRef.current &&
        !meMenuRef.current.contains(event.target as Node) &&
        teacherMenuRef.current &&
        !teacherMenuRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Đóng dropdown khi chuyển route
  useEffect(() => {
    setOpenDropdown(null);
  }, [location.pathname]);

  // PHÍM TẮT TOÀN CỤC (Quy tắc 8)
  // Alt+H, Alt+1, Alt+2, Alt+3, Alt+4, Alt+5; '?' mở bảng phím tắt
  // Không kích hoạt khi đang ở trong ô nhập hoặc trình soạn thảo code
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Kiểm tra xem focus có đang ở input, textarea, select hoặc CodeMirror không
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        activeEl?.closest('.cm-editor') !== null ||
        activeEl?.getAttribute('contenteditable') === 'true';

      if (isInputFocused) {
        return;
      }

      // '?' (Shift + /) mở modal phím tắt
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
        return;
      }

      // Alt + H: Trang chủ
      if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        safeNavigate(routes.home());
        return;
      }

      // Alt + 1: Học khái niệm
      if (e.altKey && e.key === '1') {
        e.preventDefault();
        safeNavigate(routes.concept());
        return;
      }

      // Alt + 2: Học thuật toán
      if (e.altKey && e.key === '2') {
        e.preventDefault();
        safeNavigate(routes.algorithm());
        return;
      }

      // Alt + 3: Hiểu bài tập
      if (e.altKey && e.key === '3') {
        e.preventDefault();
        safeNavigate(routes.problem());
        return;
      }

      // Alt + 4: Luyện thi
      if (e.altKey && e.key === '4') {
        e.preventDefault();
        safeNavigate(routes.exam());
        return;
      }

      // Alt + 5: Sổ lỗi sai
      if (e.altKey && e.key === '5') {
        e.preventDefault();
        safeNavigate(routes.errors());
        return;
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [safeNavigate]);

  // Đếm số lỗi quá hạn 3 ngày cần làm lại
  const overdueErrorCount = (state.progress.errorBook || []).filter((e) => {
    if (!e.at) return false;
    const diffMs = Date.now() - new Date(e.at).getTime();
    const isOverdue = diffMs >= 3 * 24 * 60 * 60 * 1000;
    const isResolved = (state.progress.solved[e.sourceId]?.bestScore ?? 0) >= 100;
    return isOverdue && !isResolved;
  }).length;

  // Nếu đang trong chế độ thi tính giờ -> Ẩn toàn bộ menu thông thường
  if (isExamRunning) {
    return null;
  }

  const isHomeActive = location.pathname === '/' || location.pathname === '';
  const isConceptActive = location.pathname.startsWith('/concept');
  const isAlgoActive = location.pathname.startsWith('/algorithm');
  const isProblemActive = location.pathname.startsWith('/problem');
  const isExamActive = location.pathname.startsWith('/exam');
  const isPlacementActive = location.pathname.startsWith('/placement');
  const isIdeActive = location.pathname.startsWith('/ide');
  const isLeaderboardActive = location.pathname.startsWith('/leaderboard');
  const isErrorsActive = location.pathname.startsWith('/errors');
  const isProfileActive = location.pathname.startsWith('/profile');
  const isCoachActive = location.pathname.startsWith('/coach');
  const isImportActive = location.pathname.startsWith('/import');

  const isMeActive = isErrorsActive || isProfileActive;
  const isTeacherActive = isCoachActive || isImportActive;

  return (
    <header className="sticky top-0 z-40 w-full h-14 border-b border-slate-800 bg-slate-950/95 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between">
      {/* 1. Trái: Nút menu mobile & Logo Trang chủ */}
      <div className="flex items-center gap-3">
        {showSidebarToggle && (
          <button
            type="button"
            onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Mở danh sách bài học"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <Link
          to={routes.home()}
          onClick={handleLinkClick(routes.home())}
          className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer min-h-[44px]"
          aria-label="Về Trang chủ"
        >
          <BrandLogo size="md" shortOnMobile={true} />
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 hidden sm:inline-block">
            Python 3
          </span>
        </Link>
      </div>

      {/* 2. Giữa: MENU CHÍNH THEO ĐÚNG THIẾT KẾ YÊU CẦU 2 */}
      <nav aria-label="Menu chính" className="hidden lg:flex items-center gap-1 xl:gap-2">
        {/* Nhóm HỌC */}
        <div className="flex items-center gap-1 border-r border-slate-800/80 pr-2">
          <NavLink
            to={routes.concept()}
            onClick={handleLinkClick(routes.concept())}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
                isActive || isConceptActive
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
              }`
            }
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Học khái niệm</span>
          </NavLink>

          <NavLink
            to={routes.algorithm()}
            onClick={handleLinkClick(routes.algorithm())}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
                isActive || isAlgoActive
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
              }`
            }
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Học thuật toán</span>
          </NavLink>

          <NavLink
            to={routes.problem()}
            onClick={handleLinkClick(routes.problem())}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
                isActive || isProblemActive
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
              }`
            }
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Hiểu bài tập</span>
          </NavLink>
        </div>

        {/* Nhóm LUYỆN */}
        <div className="flex items-center gap-1 border-r border-slate-800/80 pr-2">
          <NavLink
            to={routes.exam()}
            onClick={handleLinkClick(routes.exam())}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
                isActive || isExamActive
                  ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
              }`
            }
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Luyện thi</span>
          </NavLink>

          <NavLink
            to={routes.placement()}
            onClick={handleLinkClick(routes.placement())}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
                isActive || isPlacementActive
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
              }`
            }
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Test đầu vào</span>
          </NavLink>

          <NavLink
            to={routes.ide()}
            onClick={handleLinkClick(routes.ide())}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
                isActive || isIdeActive
                  ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
              }`
            }
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>IDE Python</span>
          </NavLink>

          <NavLink
            to={routes.leaderboard()}
            onClick={handleLinkClick(routes.leaderboard())}
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
                isActive || isLeaderboardActive
                  ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900 border border-transparent'
              }`
            }
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Bảng xếp hạng</span>
          </NavLink>
        </div>

        {/* Menu thả xuống: CỦA EM */}
        <div className="relative" ref={meMenuRef}>
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 'me' ? null : 'me')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setOpenDropdown(openDropdown === 'me' ? null : 'me');
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
              isMeActive || openDropdown === 'me'
                ? 'bg-slate-800 text-slate-100 border border-slate-700'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
            }`}
            aria-expanded={openDropdown === 'me'}
            aria-haspopup="true"
          >
            <span>Của em</span>
            {overdueErrorCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'me' ? 'rotate-180' : ''}`} />
          </button>

          {openDropdown === 'me' && (
            <div
              className="absolute left-0 mt-1.5 w-48 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 space-y-1 animate-fade-in"
              role="menu"
            >
              <NavLink
                to={routes.errors()}
                role="menuitem"
                onClick={(e) => {
                  setOpenDropdown(null);
                  handleLinkClick(routes.errors())(e);
                }}
                className={({ isActive }) =>
                  `w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>Sổ lỗi sai</span>
                </div>
                {overdueErrorCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
                    {overdueErrorCount} cần sửa
                  </span>
                )}
              </NavLink>

              <NavLink
                to={routes.profile()}
                role="menuitem"
                onClick={(e) => {
                  setOpenDropdown(null);
                  handleLinkClick(routes.profile())(e);
                }}
                className={({ isActive }) =>
                  `w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <User className="w-3.5 h-3.5 text-blue-400" />
                <span>Hồ sơ học sinh</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Menu thả xuống: GIÁO VIÊN */}
        <div className="relative" ref={teacherMenuRef}>
          <button
            type="button"
            onClick={() => setOpenDropdown(openDropdown === 'teacher' ? null : 'teacher')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setOpenDropdown(openDropdown === 'teacher' ? null : 'teacher');
              }
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all min-h-[44px] cursor-pointer ${
              isTeacherActive || openDropdown === 'teacher'
                ? 'bg-slate-800 text-slate-100 border border-slate-700'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
            }`}
            aria-expanded={openDropdown === 'teacher'}
            aria-haspopup="true"
          >
            <span>Giáo viên</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${openDropdown === 'teacher' ? 'rotate-180' : ''}`} />
          </button>

          {openDropdown === 'teacher' && (
            <div
              className="absolute left-0 mt-1.5 w-48 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 space-y-1 animate-fade-in"
              role="menu"
            >
              <NavLink
                to={routes.coach()}
                role="menuitem"
                onClick={(e) => {
                  setOpenDropdown(null);
                  handleLinkClick(routes.coach())(e);
                }}
                className={({ isActive }) =>
                  `w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Huấn luyện viên</span>
              </NavLink>

              <NavLink
                to={routes.import()}
                role="menuitem"
                onClick={(e) => {
                  setOpenDropdown(null);
                  handleLinkClick(routes.import())(e);
                }}
                className={({ isActive }) =>
                  `w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                <span>Nhập đề bài</span>
              </NavLink>
            </div>
          )}
        </div>
      </nav>

      {/* 3. Phải: Nút Chiếu lớp & Tiến độ JSON & Phím tắt */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Nút phím tắt '?' */}
        <button
          type="button"
          onClick={() => setShowShortcutsModal(true)}
          title="Bảng phím tắt (?)"
          className="hidden sm:flex items-center justify-center w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer min-h-[36px] min-w-[36px]"
          aria-label="Phím tắt"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Nút Chiếu lớp */}
        <button
          type="button"
          onClick={() => dispatch({ type: 'TOGGLE_CLASSROOM_MODE' })}
          title="Chế độ Chiếu lớp: Bật/tắt chữ lớn hiển thị máy chiếu"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer min-h-[44px] ${
            state.classroomMode
              ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Chiếu lớp</span>
        </button>

        {/* Nút Xuất/Nhập JSON */}
        <button
          type="button"
          onClick={() => setShowProgressModal(true)}
          title="Xuất / Nhập tiến độ học tập (JSON)"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-slate-300 border border-slate-800 hover:bg-slate-800 hover:text-white transition-colors cursor-pointer min-h-[44px]"
        >
          <FileJson className="w-3.5 h-3.5 text-blue-400" />
          <span>Tiến độ JSON</span>
        </button>

        {/* GOOGLE AUTH BUTTON / USER PROFILE CHIP */}
        {user ? (
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer min-h-[44px]"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-6 h-6 rounded-full object-cover border border-blue-400"
              />
              <span className="text-xs font-semibold text-slate-200 hidden sm:inline max-w-[100px] truncate">
                {user.name}
              </span>
              <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold">
                <Zap className="w-3 h-3 fill-amber-400" />
                <span>{user.totalXp}</span>
              </div>
            </button>

            {userDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 space-y-1 z-50 animate-fade-in"
                role="menu"
              >
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-xs font-bold text-white truncate">{user.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{user.email}</p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-amber-400 font-bold">
                    <span>🔥 Chuỗi {user.streak} ngày</span>
                    <span>•</span>
                    <span>{user.totalXp} XP</span>
                  </div>
                </div>

                <Link
                  to={routes.profile()}
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-blue-400" />
                  <span>Hồ sơ năng lực</span>
                </Link>

                <Link
                  to={routes.ide()}
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>IDE Python của tôi</span>
                </Link>

                <Link
                  to={routes.leaderboard()}
                  onClick={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>Xem Bảng xếp hạng</span>
                </Link>

                <button
                  type="button"
                  onClick={async () => {
                    setUserDropdownOpen(false);
                    await logout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 cursor-pointer text-left border-t border-slate-800/80"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={openLoginModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs shadow-sm transition-all cursor-pointer min-h-[44px]"
            title="Đăng nhập bằng tài khoản Google"
          >
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
              />
            </svg>
            <span className="hidden sm:inline">Đăng nhập</span>
          </button>
        )}
      </div>

      {showProgressModal && <ProgressModal onClose={() => setShowProgressModal(false)} />}
      {showShortcutsModal && <KeyboardShortcutsModal onClose={() => setShowShortcutsModal(false)} />}
    </header>
  );
};

export default Navbar;
