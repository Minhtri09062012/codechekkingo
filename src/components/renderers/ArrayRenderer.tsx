import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Step, ArraySnapshot } from '../../core/types.ts';
import { Layers } from 'lucide-react';

interface ArrayRendererProps {
  step: Step;
}

export const ArrayRenderer: React.FC<ArrayRendererProps> = ({ step }) => {
  const snapshot = step.snapshot as ArraySnapshot | undefined;
  const arrays = snapshot?.arrays || [];

  const getElementRole = (arrayName: string, index: number) => {
    for (const h of step.highlights || []) {
      if (h.target === arrayName && h.indices.includes(index)) {
        return h.role;
      }
    }
    return null;
  };

  const getRoleClasses = (role: string | null) => {
    switch (role) {
      case 'active':
        return 'bg-blue-600/30 border-blue-500 text-blue-200 ring-2 ring-blue-500/50 scale-105';
      case 'compare':
        return 'bg-amber-500/30 border-amber-400 text-amber-200 ring-2 ring-amber-400/50 scale-105';
      case 'swap':
        return 'bg-rose-600/30 border-rose-500 text-rose-200 ring-2 ring-rose-500/50 scale-105';
      case 'done':
      case 'found':
        return 'bg-emerald-600/30 border-emerald-500 text-emerald-200 ring-2 ring-emerald-500/50 scale-105';
      case 'visited':
        return 'bg-slate-800/60 border-slate-700 text-slate-400';
      default:
        return 'bg-slate-900 border-slate-800 text-slate-100 hover:border-slate-700';
    }
  };

  if (arrays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-500 text-xs">
        <Layers className="w-8 h-8 mb-2 opacity-40" />
        Chưa có mảng dữ liệu nào được khởi tạo tại bước này
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6 bg-slate-950/70 rounded-2xl border border-slate-800 flex flex-col gap-8 min-h-[220px]">
      {arrays.map((arrObj, arrIdx) => {
        const pointers = arrObj.pointers || [];

        return (
          <div key={arrObj.name || arrIdx} className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5">
                <span className="text-blue-400">{arrObj.name}</span>
                <span className="text-slate-500 font-normal">[{arrObj.values.length} phần tử]</span>
              </span>

              {/* Legend màu sắc */}
              <div className="hidden sm:flex items-center gap-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-blue-500 inline-block" /> Active
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-amber-400 inline-block" /> So sánh
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded bg-emerald-500 inline-block" /> Tìm thấy / Xong
                </span>
              </div>
            </div>

            {/* Khung cuộn ngang các phần tử mảng */}
            <div className="overflow-x-auto pb-4 pt-8 px-2 flex justify-start sm:justify-center items-end gap-2.5">
              {arrObj.values.map((val, idx) => {
                const role = getElementRole(arrObj.name, idx);
                const roleClass = getRoleClasses(role);
                // Con trỏ trỏ vào vị trí idx
                const activePointers = pointers.filter((p) => p.index === idx);

                return (
                  <div key={idx} className="relative flex flex-col items-center flex-shrink-0">
                    {/* Con trỏ ở trên ô phần tử */}
                    <div className="absolute -top-7 flex flex-col items-center pointer-events-none">
                      <AnimatePresence>
                        {activePointers.map((p) => (
                          <motion.div
                            key={p.name}
                            initial={{ y: -6, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -6, opacity: 0 }}
                            className="flex flex-col items-center"
                          >
                            <span className="px-1.5 py-0.5 rounded bg-blue-500 text-[10px] font-mono font-bold text-white shadow-md leading-none">
                              {p.name}
                            </span>
                            <span className="text-blue-400 text-[10px] leading-none">▼</span>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* Hộp giá trị phần tử */}
                    <motion.div
                      layout
                      key={`${idx}-${val}`}
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                      className={`w-12 h-14 sm:w-14 sm:h-16 rounded-2xl border-2 flex items-center justify-center font-mono text-base sm:text-lg font-black transition-all shadow-md ${roleClass}`}
                    >
                      {String(val)}
                    </motion.div>

                    {/* Chỉ số index ở dưới */}
                    <span className="mt-1.5 text-[10px] font-mono text-slate-500">
                      {idx}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
