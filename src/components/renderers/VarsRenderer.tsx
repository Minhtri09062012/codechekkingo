import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Step } from '../../core/types.ts';
import { Box, Sparkles } from 'lucide-react';

interface VarsRendererProps {
  step: Step;
}

export const VarsRenderer: React.FC<VarsRendererProps> = ({ step }) => {
  const varsEntries = Object.entries(step.vars || {});

  // Check highlights on variables: role 'active' | 'compare' | 'swap' | 'done' | 'found' | 'visited'
  const getVarRole = (varName: string) => {
    for (const h of step.highlights || []) {
      if (h.target === `var:${varName}` || h.target === varName) {
        return h.role;
      }
    }
    return null;
  };

  const getRoleBadgeClasses = (role: string | null) => {
    switch (role) {
      case 'active':
        return 'border-blue-500 bg-blue-950/60 text-blue-300 ring-2 ring-blue-500/40';
      case 'compare':
        return 'border-amber-400 bg-amber-950/60 text-amber-300 ring-2 ring-amber-400/40';
      case 'swap':
        return 'border-rose-500 bg-rose-950/60 text-rose-300 ring-2 ring-rose-500/40';
      case 'found':
      case 'done':
        return 'border-emerald-500 bg-emerald-950/60 text-emerald-300 ring-2 ring-emerald-500/40';
      case 'visited':
        return 'border-slate-700 bg-slate-900/60 text-slate-400';
      default:
        return 'border-slate-800 bg-slate-900/80 text-slate-200';
    }
  };

  if (varsEntries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-500 text-xs">
        <Box className="w-8 h-8 mb-2 opacity-40" />
        Chưa có biến nào được khởi tạo tại bước này
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 bg-slate-950/70 rounded-2xl border border-slate-800 flex flex-col items-center justify-center min-h-[200px]">
      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5 self-start">
        <Box className="w-3.5 h-3.5 text-blue-400" />
        Không gian ô nhớ biến (Variable Memory Blocks)
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 w-full max-w-2xl">
        <AnimatePresence>
          {varsEntries.map(([name, val]) => {
            const role = getVarRole(name);
            const styleClasses = getRoleBadgeClasses(role);
            const displayVal = val === null ? 'None' : String(val);

            return (
              <motion.div
                key={name}
                layout
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.85, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className={`relative flex flex-col items-center justify-center min-w-[100px] sm:min-w-[120px] p-3 rounded-2xl border ${styleClasses} transition-colors shadow-lg`}
              >
                {/* Tên biến */}
                <div className="text-[11px] font-mono font-bold text-slate-400 mb-1 flex items-center gap-1">
                  <span>{name}</span>
                  {role && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                </div>

                {/* Ô giá trị với animation khi đổi số */}
                <motion.div
                  key={`${name}-${displayVal}`}
                  initial={{ y: -6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="px-3 py-1 rounded-xl bg-slate-950/90 border border-slate-800/80 font-mono text-base sm:text-lg font-black tracking-tight"
                >
                  {displayVal}
                </motion.div>

                {/* Role tooltip tag */}
                {role && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-900 border border-current shadow-sm"
                  >
                    {role}
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
