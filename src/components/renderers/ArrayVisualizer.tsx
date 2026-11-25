import React from 'react';
import { Step } from '../../core/types.ts';

interface ArrayItem {
  value: number | string;
  index: number;
  role?: 'active' | 'compare' | 'swap' | 'done' | 'found' | 'visited';
}

interface Pointer {
  name: string;
  index: number;
  color: string;
}

interface ArrayVisualizerProps {
  array: (number | string)[];
  highlights?: Step['highlights'];
  pointers?: Pointer[];
  label?: string;
  highlightedIndices?: number[];
  disabledIndices?: number[];
}

export const ArrayVisualizer: React.FC<ArrayVisualizerProps> = ({
  array,
  highlights = [],
  pointers = [],
  label = 'Mảng dữ liệu',
  disabledIndices = [],
}) => {
  // Map index to role
  const indexRoleMap = new Map<number, 'active' | 'compare' | 'swap' | 'done' | 'found' | 'visited'>();
  for (const h of highlights) {
    for (const idx of h.indices) {
      indexRoleMap.set(idx, h.role);
    }
  }

  // Group pointers by index
  const pointerMap = new Map<number, Pointer[]>();
  for (const p of pointers) {
    if (p.index >= 0 && p.index < array.length) {
      const list = pointerMap.get(p.index) || [];
      list.push(p);
      pointerMap.set(p.index, list);
    }
  }

  const getRoleStyle = (role?: string) => {
    switch (role) {
      case 'active':
        return 'bg-blue-600/30 border-blue-400 text-blue-200 ring-2 ring-blue-500 scale-105';
      case 'compare':
        return 'bg-amber-600/30 border-amber-400 text-amber-200 ring-2 ring-amber-500 animate-pulse scale-105';
      case 'swap':
        return 'bg-purple-600/30 border-purple-400 text-purple-200 ring-2 ring-purple-500 scale-110';
      case 'done':
        return 'bg-emerald-950/60 border-emerald-500/80 text-emerald-300';
      case 'found':
        return 'bg-emerald-600/40 border-emerald-400 text-emerald-200 ring-4 ring-emerald-500 scale-110 shadow-lg shadow-emerald-500/30';
      case 'visited':
        return 'bg-slate-800/80 border-slate-600 text-slate-300';
      default:
        return 'bg-slate-900 border-slate-700/80 text-slate-100 hover:border-slate-500';
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full flex items-center justify-between text-xs font-medium text-slate-400 mb-2 px-1">
        <span>{label} (Độ dài: {array.length})</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Đang xét</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span> So sánh</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500"></span> Tìm thấy / Xong</span>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-6 pt-3 px-2 flex justify-start sm:justify-center">
        <div className="flex gap-2.5 sm:gap-3 items-end min-w-max">
          {array.map((val, idx) => {
            const role = indexRoleMap.get(idx);
            const style = getRoleStyle(role);
            const itemPointers = pointerMap.get(idx) || [];
            const isDisabled = disabledIndices.includes(idx);

            return (
              <div key={idx} className="flex flex-col items-center relative">
                {/* Top Pointers */}
                <div className="h-7 flex items-center justify-center gap-1 mb-1">
                  {itemPointers.map((p, pIdx) => (
                    <span
                      key={pIdx}
                      style={{ backgroundColor: p.color }}
                      className="px-2 py-0.5 text-[11px] font-bold text-white rounded-md shadow-sm uppercase tracking-wider animate-bounce"
                    >
                      {p.name}
                    </span>
                  ))}
                </div>

                {/* Array Box */}
                <div
                  className={`w-12 h-14 sm:w-14 sm:h-16 rounded-xl border-2 flex items-center justify-center text-lg sm:text-xl font-bold font-mono transition-all duration-300 shadow-md ${style} ${
                    isDisabled ? 'opacity-30 filter grayscale' : ''
                  }`}
                >
                  {val}
                </div>

                {/* Index label */}
                <span className="mt-1.5 text-xs font-mono text-slate-400">
                  [{idx}]
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
