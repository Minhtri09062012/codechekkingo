import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';

export interface GuardConfig {
  isGuarded: boolean;
  message?: string;
  onConfirm?: () => void;
}

interface LeaveGuardContextType {
  guardConfig: GuardConfig;
  setGuard: (config: GuardConfig) => void;
  clearGuard: () => void;
  safeNavigate: (to: string) => void;
}

const LeaveGuardContext = createContext<LeaveGuardContextType | null>(null);

export const LeaveGuardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [guardConfig, setGuardConfig] = useState<GuardConfig>({
    isGuarded: false,
    message: '',
  });

  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const navigate = useNavigate();

  const setGuard = useCallback((config: GuardConfig) => {
    setGuardConfig(config);
  }, []);

  const clearGuard = useCallback(() => {
    setGuardConfig({ isGuarded: false, message: '' });
  }, []);

  // Điều hướng an toàn: nếu đang có guard thì hỏi xác nhận
  const safeNavigate = useCallback(
    (to: string) => {
      if (guardConfig.isGuarded) {
        setPendingTarget(to);
        setShowConfirmModal(true);
      } else {
        navigate(to);
      }
    },
    [guardConfig.isGuarded, navigate]
  );

  const handleConfirmLeave = () => {
    if (guardConfig.onConfirm) {
      try {
        guardConfig.onConfirm();
      } catch (e) {
        console.error('Lỗi khi chạy onConfirm của leave guard:', e);
      }
    }
    clearGuard();
    setShowConfirmModal(false);
    if (pendingTarget) {
      navigate(pendingTarget);
      setPendingTarget(null);
    }
  };

  const handleCancelLeave = () => {
    setShowConfirmModal(false);
    setPendingTarget(null);
  };

  // Chặn reload hoặc đóng tab khi guard active
  useEffect(() => {
    if (!guardConfig.isGuarded) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const msg =
        guardConfig.message ||
        'Bạn đang có bài làm dở hoặc bài thi đang tính giờ. Bạn có chắc muốn rời đi?';
      e.preventDefault();
      e.returnValue = msg;
      return msg;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [guardConfig.isGuarded, guardConfig.message]);

  return (
    <LeaveGuardContext.Provider
      value={{
        guardConfig,
        setGuard,
        clearGuard,
        safeNavigate,
      }}
    >
      {children}

      {/* Modal xác nhận rời trang */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-100">
                  Xác nhận rời khỏi trang
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {guardConfig.message ||
                    'Bạn đang có bài thi tính giờ dở, bài kiểm tra thích ứng chưa nộp hoặc code chưa được lưu. Rời khỏi lúc này có thể làm mất kết quả.'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={handleCancelLeave}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
              >
                Ở lại làm tiếp
              </button>
              <button
                onClick={handleConfirmLeave}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/30 transition-all cursor-pointer"
              >
                Đồng ý rời đi
              </button>
            </div>
          </div>
        </div>
      )}
    </LeaveGuardContext.Provider>
  );
};

export function useLeaveGuardContext(): LeaveGuardContextType {
  const ctx = useContext(LeaveGuardContext);
  if (!ctx) {
    throw new Error('useLeaveGuardContext must be used within LeaveGuardProvider');
  }
  return ctx;
}
