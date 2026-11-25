import React, { useEffect, useState, useRef } from 'react';
import { Outlet, useLocation, useNavigationType } from 'react-router-dom';
import { Navbar } from './Navbar.tsx';
import { BottomTabBar } from './BottomTabBar.tsx';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import { getPageTitle, checkRoutesIntegrity } from '../../core/routes.ts';
import { getLesson, getProblem, devWarnings } from '../../core/registry.ts';
import { getExamSet } from '../../problems/sets/index.ts';
import {
  logComponentMount,
  auditInternalLinksInDOM,
} from '../../core/devMonitor.ts';

const routeIntegrity = checkRoutesIntegrity();
if (!routeIntegrity.ok) {
  console.warn('[Dev Audit Quy tắc 18]', routeIntegrity.errors);
}
if (devWarnings.length > 0) {
  console.warn('[Dev Audit chuẩn hóa dữ liệu]', devWarnings);
}

export const RootLayout: React.FC = () => {
  const location = useLocation();
  const navType = useNavigationType();

  const [liveAnnouncement, setLiveAnnouncement] = useState<string>('');
  const scrollPositions = useRef<Record<string, number>>({});
  const lastKeyRef = useRef<string>(location.key);

  // ĐO KIỂM: Ghi nhận số lần mount của RootLayout (chỉ được 1 lần)
  useEffect(() => {
    logComponentMount('rootLayout');
  }, []);

  // Kiểm tra liên kết DOM ở chế độ dev (ghi log console nếu có)
  useEffect(() => {
    const timer = setTimeout(() => {
      const audit = auditInternalLinksInDOM();
      if (!audit.ok) {
        console.error('[Dev Audit Quy tắc 19] Phát hiện lỗi thẻ liên kết:', audit.violations);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  // XỬ LÝ TIÊU ĐỀ, FOCUS H1 VÀ KHÔI PHỤC CUỘN (Quy tắc 3)
  useEffect(() => {
    // 1. Xác định tiêu đề chi tiết theo route & dữ liệu thực
    let itemTitle: string | undefined = undefined;
    const path = location.pathname;

    if (path.startsWith('/concept/')) {
      const id = path.replace('/concept/', '');
      const lesson = getLesson(id);
      if (lesson) itemTitle = lesson.title;
    } else if (path.startsWith('/algorithm/')) {
      const id = path.replace('/algorithm/', '');
      const lesson = getLesson(id);
      if (lesson) itemTitle = lesson.title;
    } else if (path.startsWith('/problem/')) {
      const id = path.replace('/problem/', '');
      const problem = getProblem(id);
      if (problem) itemTitle = problem.title;
    } else if (path.startsWith('/exam/')) {
      const setId = path.replace('/exam/', '');
      const examSet = getExamSet(setId);
      if (examSet) itemTitle = examSet.title;
    }

    const fullTitle = getPageTitle(path, itemTitle);
    document.title = fullTitle;
    setLiveAnnouncement(fullTitle);

    // 2. Chuyển focus đến tiêu đề h1 mới (tabIndex = -1) cho công nghệ hỗ trợ
    const focusTimer = setTimeout(() => {
      const h1 = document.querySelector('h1') as HTMLElement | null;
      if (h1) {
        if (!h1.hasAttribute('tabindex')) {
          h1.setAttribute('tabindex', '-1');
        }
        h1.focus({ preventScroll: true });
      }
    }, 100);

    // 3. Khôi phục / Thiết lập vị trí cuộn
    const prevKey = lastKeyRef.current;
    // Lưu lại vị trí cuộn của trang trước
    const learningContainer = document.getElementById('learning-content-scroll');
    const currentScrollY = learningContainer ? learningContainer.scrollTop : window.scrollY;
    scrollPositions.current[prevKey] = currentScrollY;

    if (navType === 'POP') {
      // Người dùng bấm Back/Forward: Khôi phục vị trí cuộn cũ
      const savedPos = scrollPositions.current[location.key] || 0;
      if (learningContainer) {
        learningContainer.scrollTop = savedPos;
      } else {
        window.scrollTo({ top: savedPos, behavior: 'instant' as ScrollBehavior });
      }
    } else {
      // Điều hướng mới (PUSH/REPLACE): Cuộn vùng nội dung về đầu trang (không cuộn sidebar)
      if (learningContainer) {
        learningContainer.scrollTop = 0;
      }
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }

    lastKeyRef.current = location.key;

    return () => clearTimeout(focusTimer);
  }, [location.pathname, location.key, navType]);

  const isLearningRoute =
    location.pathname.startsWith('/concept') ||
    location.pathname.startsWith('/algorithm');

  return (
    <div className="relative min-h-screen flex flex-col pb-16 lg:pb-0 bg-slate-950 text-slate-100">
      {/* Vùng aria-live thông báo tên trang cho trợ năng */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveAnnouncement}
      </div>

      {/* Khung Header (AppHeader / Navbar) - Giữ nguyên không bị hủy khi đổi trang */}
      <Navbar showSidebarToggle={isLearningRoute} />

      {/* 5. Vùng nội dung được bảo vệ bởi ErrorBoundary */}
      <div className="flex-1 flex flex-col min-h-0">
        <ErrorBoundary fallbackTitle="Trang này đang gặp lỗi">
          <Outlet />
        </ErrorBoundary>
      </div>

      {/* 6. Thanh điều hướng tab bar dưới đáy cho thiết bị di động */}
      <BottomTabBar />
    </div>
  );
};
export default RootLayout;
