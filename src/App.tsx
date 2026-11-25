import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { LeaveGuardProvider } from './context/LeaveGuardContext.tsx';
import { RootLayout } from './components/layout/RootLayout.tsx';
import { LearningLayout } from './components/layout/LearningLayout.tsx';
import { HomePage } from './components/pages/HomePage.tsx';
import { LearnPage } from './components/pages/LearnPage.tsx';
import { ProblemPage } from './components/pages/ProblemPage.tsx';
import { DemoTablePage } from './components/pages/DemoTablePage.tsx';
import { ErrorsPage } from './components/pages/ErrorsPage.tsx';
import { PlacementPage } from './components/pages/PlacementPage.tsx';
import { ExamPage } from './components/pages/ExamPage.tsx';
import { ProfilePage } from './components/pages/ProfilePage.tsx';
import { CoachPage } from './components/pages/CoachPage.tsx';
import { ImportProblemPage } from './components/pages/ImportProblemPage.tsx';
import { LeaderboardPage } from './components/pages/LeaderboardPage.tsx';
import { IdePage } from './components/pages/IdePage.tsx';
import { NotFoundPage } from './components/pages/NotFoundPage.tsx';
import { GoogleLoginModal } from './components/auth/GoogleLoginModal.tsx';
import { getLessons } from './core/registry.ts';
import { routes } from './core/routes.ts';

// Helper component chuyển hướng tới bài học sẵn sàng đầu tiên
const NavigateToFirstLesson: React.FC<{ mode: 'concept' | 'algorithm' }> = ({ mode }) => {
  const readyList = getLessons(mode).filter((l) => l.status === 'ready');
  const target = readyList[0] || getLessons(mode)[0];
  const targetPath = target ? routes.lesson(mode, target.id) : routes.home();
  return <Navigate to={targetPath} replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <HashRouter>
          <LeaveGuardProvider>
            <GoogleLoginModal />
            <Routes>
              <Route path="/" element={<RootLayout />}>
                {/* 1. Trang chủ */}
                <Route index element={<HomePage />} />

                {/* 2. Nhánh học tập: Giữ nguyên Sidebar và Filter trong LearningLayout */}
                <Route element={<LearningLayout />}>
                  <Route path="concept">
                    <Route index element={<NavigateToFirstLesson mode="concept" />} />
                    <Route path=":id" element={<LearnPage mode="concept" />} />
                  </Route>
                  <Route path="algorithm">
                    <Route index element={<NavigateToFirstLesson mode="algorithm" />} />
                    <Route path=":id" element={<LearnPage mode="algorithm" />} />
                  </Route>
                </Route>

                {/* 3. Hiểu bài tập & Chi tiết */}
                <Route path="problem">
                  <Route index element={<ProblemPage />} />
                  <Route path=":id" element={<ProblemPage />} />
                </Route>

                {/* 4. Test đầu vào thích ứng */}
                <Route path="placement" element={<PlacementPage />} />

                {/* 5. IDE Python Độc Lập Chuyên Nghiệp */}
                <Route path="ide" element={<IdePage />} />

                {/* 6. Bảng Xếp Hạng Toàn Hệ Thống */}
                <Route path="leaderboard" element={<LeaderboardPage />} />

                {/* 7. Chế độ Luyện thi HSG Tin */}
                <Route path="exam">
                  <Route index element={<ExamPage />} />
                  <Route path=":setId" element={<ExamPage />} />
                </Route>

                {/* 8. Sổ tay lỗi (ErrorBook) */}
                <Route path="errors" element={<ErrorsPage />} />

                {/* 9. Hồ sơ học sinh & Radar năng lực */}
                <Route path="profile" element={<ProfilePage />} />

                {/* 10. Huấn luyện viên & So sánh đội tuyển */}
                <Route path="coach" element={<CoachPage />} />

                {/* 11. Nhập đề & Kiểm định Pyodide */}
                <Route path="import" element={<ImportProblemPage />} />

                {/* 12. Demo Renderer Table */}
                <Route path="demo/table" element={<DemoTablePage />} />

                {/* 13. Trang 404 NotFound */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </LeaveGuardProvider>
        </HashRouter>
      </AppProvider>
    </AuthProvider>
  );
}
