import React, { useState } from 'react';
import { TableRenderer } from '../renderers/TableRenderer.tsx';
import { Step, TableSnapshot } from '../../core/types.ts';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DemoTablePage: React.FC = () => {
  const [currentRow, setCurrentRow] = useState<number>(0);

  const truthTableSnapshot: TableSnapshot = {
    title: 'Bảng chân trị (Truth Table) - Demo Renderer "table"',
    headers: ['A', 'B', 'not A', 'A and B', 'A or B'],
    rows: [
      [false, false, true, false, false],
      [false, true, true, false, true],
      [true, false, false, false, true],
      [true, true, false, true, true],
    ],
    highlightRow: currentRow,
  };

  const demoStep: Step = {
    line: currentRow + 1,
    vars: {
      A: truthTableSnapshot.rows[currentRow][0],
      B: truthTableSnapshot.rows[currentRow][1],
      'not A': truthTableSnapshot.rows[currentRow][2],
      'A and B': truthTableSnapshot.rows[currentRow][3],
      'A or B': truthTableSnapshot.rows[currentRow][4],
    },
    highlights: [{ target: `row:${currentRow}`, indices: [], role: 'active' }],
    explain: `Đang xét hàng ${currentRow + 1}: A = ${truthTableSnapshot.rows[currentRow][0]}, B = ${truthTableSnapshot.rows[currentRow][1]}`,
    snapshot: truthTableSnapshot,
    ops: currentRow + 1,
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-100">
                Trang kiểm tra riêng Renderer 'table' (Bảng sự thật)
              </h1>
              <p className="text-xs text-slate-400">
                Kiểm tra khả năng hiển thị boolean, hàng active và layout responsive của TableRenderer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button type="button"
              onClick={() => setCurrentRow(0)}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </button>
            <button type="button"
              onClick={() => setCurrentRow((prev) => (prev + 1) % 4)}
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" /> Hàng tiếp theo
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
            <span className="font-bold text-blue-400">Giải thích bước hiện tại: </span>
            <span className="text-slate-200">{demoStep.explain}</span>
          </div>

          <TableRenderer step={demoStep} />
        </div>
      </div>
    </div>
  );
};
