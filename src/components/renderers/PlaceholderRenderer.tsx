import React from 'react';
import { Step } from '../../core/types.ts';
import { Cpu } from 'lucide-react';

interface PlaceholderRendererProps {
  step: Step;
  kind?: string;
}

export const PlaceholderRenderer: React.FC<PlaceholderRendererProps> = ({ kind = 'chưa xác định' }) => {
  return (
    <div className="w-full p-8 bg-slate-950/60 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
      <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center">
        <Cpu className="w-5 h-5" />
      </div>
      <p className="text-sm font-bold text-slate-300">
        Renderer "{kind}" chưa có
      </p>
      <p className="text-xs text-slate-500 max-w-sm">
        Hình thái trực quan này sẽ được bổ sung ở Prompt 3 và Prompt 4.
      </p>
    </div>
  );
};
