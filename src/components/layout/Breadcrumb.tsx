import React from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useLeaveGuardContext } from '../../context/LeaveGuardContext.tsx';
import { routes, getRouteMetaByPath } from '../../core/routes.ts';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  customItems?: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ customItems, className = '' }) => {
  const location = useLocation();
  const { safeNavigate } = useLeaveGuardContext();

  const items: BreadcrumbItem[] = React.useMemo(() => {
    if (customItems) {
      return [{ label: 'Trang chủ', to: routes.home() }, ...customItems];
    }

    const currentMeta = getRouteMetaByPath(location.pathname);
    const result: BreadcrumbItem[] = [{ label: 'Trang chủ', to: routes.home() }];

    if (currentMeta && currentMeta.pattern !== '/') {
      result.push({
        label: currentMeta.shortTitle || currentMeta.title,
        to: location.pathname,
      });
    }

    return result;
  }, [customItems, location.pathname]);

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1.5 text-xs text-slate-400 overflow-x-auto whitespace-nowrap py-1 ${className}`}
    >
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        const isHome = idx === 0;

        return (
          <React.Fragment key={`${item.label}-${idx}`}>
            {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />}
            {item.to && !isLast ? (
              <button type="button"
                onClick={() => safeNavigate(item.to!)}
                className="hover:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer py-1 min-h-[36px]"
              >
                {isHome && <Home className="w-3.5 h-3.5" />}
                <span>{item.label}</span>
              </button>
            ) : (
              <span className={`font-semibold truncate max-w-[200px] sm:max-w-xs ${isLast ? 'text-slate-200' : 'text-slate-400'}`}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumb;
