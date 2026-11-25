import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLeaveGuardContext } from '../../context/LeaveGuardContext.tsx';
import { routes } from '../../core/routes.ts';

interface BackButtonProps {
  fallbackUrl?: string;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  fallbackUrl = routes.home(),
  label = 'Quay lại',
  className = '',
}) => {
  const navigate = useNavigate();
  const { safeNavigate } = useLeaveGuardContext();

  const handleBack = () => {
    // Nếu có lịch sử trình duyệt thì back, nếu không có thì fallbackUrl
    if (window.history.length > 1) {
      // Dùng safeNavigate hoặc xác nhận trước khi go back
      navigate(-1);
    } else {
      safeNavigate(fallbackUrl);
    }
  };

  return (
    <button type="button"
      onClick={handleBack}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-colors cursor-pointer min-h-[44px] min-w-[44px] ${className}`}
      title={label}
      aria-label={label}
    >
      <ArrowLeft className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </button>
  );
};

export default BackButton;
