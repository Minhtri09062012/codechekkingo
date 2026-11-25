import { useEffect } from 'react';
import { useLeaveGuardContext } from '../context/LeaveGuardContext.tsx';

/**
 * Hook bảo vệ khi rời trang (Quy tắc 17):
 * Kích hoạt khi có trạng thái chưa lưu hoặc bài thi đang tính giờ.
 */
export function useLeaveGuard(
  isGuarded: boolean,
  message?: string,
  onConfirm?: () => void
) {
  const { setGuard, clearGuard, safeNavigate } = useLeaveGuardContext();

  useEffect(() => {
    if (isGuarded) {
      setGuard({ isGuarded: true, message, onConfirm });
    } else {
      clearGuard();
    }

    return () => {
      clearGuard();
    };
  }, [isGuarded, message, onConfirm, setGuard, clearGuard]);

  return { safeNavigate };
}

export { useLeaveGuardContext };
export default useLeaveGuard;
