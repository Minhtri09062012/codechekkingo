import React, { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LearnSidebar } from './LearnSidebar.tsx';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import { useApp } from '../../context/AppContext.tsx';

export const LearningLayout: React.FC = () => {
  const location = useLocation();
  const { state } = useApp();

  // Xác định chế độ theo nhánh route hiện tại
  const mode = useMemo<'concept' | 'algorithm'>(() => {
    return location.pathname.startsWith('/algorithm') ? 'algorithm' : 'concept';
  }, [location.pathname]);

  return (
    <div
      className={`flex-1 flex w-full min-h-0 bg-slate-950 text-slate-100 ${
        state.classroomMode ? 'text-lg' : ''
      }`}
    >
      {/* SIDEBAR TRÁI: Nằm ở layout cha, không bị hủy hoặc re-mount khi đổi bài */}
      <LearnSidebar mode={mode} />

      {/* VÙNG NỘI DUNG BÊN PHẢI (cuộn riêng, độc lập với sidebar) */}
      <main
        id="learning-content-scroll"
        className="flex-1 min-w-0 h-[calc(100vh-3.5rem)] overflow-y-auto flex flex-col justify-between"
      >
        <ErrorBoundary fallbackTitle="Bài học này đang gặp sự cố">
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
};
export default LearningLayout;
