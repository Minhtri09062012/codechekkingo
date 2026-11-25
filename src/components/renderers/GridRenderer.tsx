import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Step, GridSnapshot } from '../../core/types.ts';
import { Grid as GridIcon } from 'lucide-react';

interface GridRendererProps {
  step: Step;
}

export const GridRenderer: React.FC<GridRendererProps> = ({ step }) => {
  const snapshot = step.snapshot as GridSnapshot | undefined;
  const grid = snapshot?.grid || [];
  const pointers = snapshot?.pointers || [];

  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;

  const getCellRole = (r: number, c: number) => {
    const flatIndex = r * cols + c;
    for (const h of step.highlights || []) {
      if (h.indices.includes(flatIndex)) {
        return h.role;
      }
    }
    return null;
  };

  const getRoleClasses = (role: string | null) => {
    switch (role) {
      case 'active':
        return 'bg-blue-600/30 border-blue-500 text-blue-200 ring-2 ring-blue-500/50';
      case 'compare':
        return 'bg-amber-500/30 border-amber-400 text-amber-200 ring-2 ring-amber-400/50';
      case 'swap':
        return 'bg-rose-600/30 border-rose-500 text-rose-200 ring-2 ring-rose-500/50';
      case 'done':
      case 'found':
        return 'bg-emerald-600/30 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50';
      case 'visited':
        return 'bg-slate-800/70 border-slate-700 text-slate-400';
      default:
        return 'bg-slate-900 border-slate-800 text-slate-200';
    }
  };

  if (rows === 0 || cols === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-500 text-xs">
        <GridIcon className="w-8 h-8 mb-2 opacity-40" />
        Chưa có lưới ma trận nào được khởi tạo tại bước này
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 bg-slate-950/70 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[220px]">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center justify-between w-full max-w-lg">
        <span className="flex items-center gap-1.5">
          <GridIcon className="w-3.5 h-3.5 text-blue-400" />
          Bảng 2 chiều (Lưới {rows}x{cols})
        </span>
      </div>

      <div className="overflow-auto max-w-full p-2">
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(40px, 48px))` }}
        >
          {grid.map((row, r) =>
            row.map((val, c) => {
              const role = getCellRole(r, c);
              const roleClass = getRoleClasses(role);
              const cellPointers = pointers.filter((p) => p.r === r && p.c === c);

              return (
                <div key={`${r}-${c}`} className="relative flex flex-col items-center justify-center">
                  {cellPointers.length > 0 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="px-1 py-0.2 rounded bg-blue-500 text-[9px] font-mono font-bold text-white shadow">
                        {cellPointers.map((p) => p.name).join(',')}
                      </span>
                    </div>
                  )}

                  <motion.div
                    layout
                    key={`${r}-${c}-${val}`}
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border flex items-center justify-center font-mono text-xs sm:text-sm font-bold shadow-sm ${roleClass}`}
                  >
                    {String(val)}
                  </motion.div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
