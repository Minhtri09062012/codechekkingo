import React from 'react';
import { motion } from 'framer-motion';
import { Step, TableSnapshot } from '../../core/types.ts';
import { Table as TableIcon, Check, X } from 'lucide-react';

interface TableRendererProps {
  step: Step;
}

export const TableRenderer: React.FC<TableRendererProps> = ({ step }) => {
  const snapshot = step.snapshot as TableSnapshot | undefined;
  const headers = snapshot?.headers || [];
  const rows = snapshot?.rows || [];
  const title = snapshot?.title;
  const activeRow = snapshot?.highlightRow;
  const activeCol = snapshot?.highlightCol;

  // Highlights check
  const getCellRole = (r: number, c: number) => {
    for (const h of step.highlights || []) {
      if (h.target === `row:${r}`) return h.role;
      if (h.target === `cell:${r}:${c}`) return h.role;
      if (h.target === 'table' && h.indices.includes(r * headers.length + c)) return h.role;
    }
    if (r === activeRow && (activeCol === undefined || c === activeCol)) {
      return 'active';
    }
    return null;
  };

  const getRoleClasses = (role: string | null) => {
    switch (role) {
      case 'active':
        return 'bg-blue-600/25 border-blue-500 text-blue-200';
      case 'compare':
        return 'bg-amber-500/25 border-amber-400 text-amber-200';
      case 'swap':
        return 'bg-rose-600/25 border-rose-500 text-rose-200';
      case 'done':
      case 'found':
        return 'bg-emerald-600/25 border-emerald-500 text-emerald-200';
      case 'visited':
        return 'bg-slate-800/40 text-slate-500';
      default:
        return 'text-slate-300';
    }
  };

  const formatCellValue = (val: string | number | boolean) => {
    if (typeof val === 'boolean') {
      return val ? (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
          <Check className="w-3 h-3 text-emerald-400" /> True
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold">
          <X className="w-3 h-3 text-rose-400" /> False
        </span>
      );
    }
    if (val === 'True' || val === 'T') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
          <Check className="w-3 h-3 text-emerald-400" /> True
        </span>
      );
    }
    if (val === 'False' || val === 'F') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-bold">
          <X className="w-3 h-3 text-rose-400" /> False
        </span>
      );
    }
    return String(val);
  };

  if (rows.length === 0 && headers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-500 text-xs">
        <TableIcon className="w-8 h-8 mb-2 opacity-40" />
        Chưa có bảng dữ liệu nào được khởi tạo tại bước này
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs shadow-lg">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[11px] text-slate-400">
        <span className="font-bold flex items-center gap-1.5 text-slate-300">
          <TableIcon className="w-3.5 h-3.5 text-amber-400" />
          {title || 'Bảng dữ liệu / Bảng sự thật (Truth Table)'}
        </span>
        <span className="text-[10px] text-slate-500">
          {rows.length} hàng × {headers.length} cột
        </span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-900/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900 border-b border-slate-800 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              <th className="py-2.5 px-3 w-10 text-center text-slate-600">#</th>
              {headers.map((h, idx) => (
                <th
                  key={idx}
                  className={`py-2.5 px-3 ${
                    activeCol === idx ? 'text-blue-300 bg-blue-950/40' : ''
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {rows.map((row, rIdx) => {
              const isRowActive = activeRow === rIdx;
              return (
                <motion.tr
                  key={rIdx}
                  layout
                  className={`transition-colors ${
                    isRowActive
                      ? 'bg-blue-950/40 font-semibold'
                      : 'hover:bg-slate-800/30'
                  }`}
                >
                  <td className="py-2 px-3 text-center text-slate-600 select-none text-[10px]">
                    {rIdx + 1}
                  </td>
                  {row.map((cellVal, cIdx) => {
                    const role = getCellRole(rIdx, cIdx);
                    const roleClasses = getRoleClasses(role);
                    return (
                      <td
                        key={cIdx}
                        className={`py-2 px-3 transition-colors ${roleClasses}`}
                      >
                        {formatCellValue(cellVal)}
                      </td>
                    );
                  })}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
