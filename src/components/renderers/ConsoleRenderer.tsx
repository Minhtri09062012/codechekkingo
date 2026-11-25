import React from 'react';
import { Step, TextSnapshot } from '../../core/types.ts';
import { Terminal, Keyboard, Monitor, FileCode } from 'lucide-react';

interface ConsoleRendererProps {
  step: Step;
}

export const ConsoleRenderer: React.FC<ConsoleRendererProps> = ({ step }) => {
  const snapshot = step.snapshot as TextSnapshot | undefined;
  const stdin = snapshot?.stdin || [];
  const stdinPos = snapshot?.stdinPos ?? 0;
  const stdout = snapshot?.stdout || [];
  const files = snapshot?.files || [];

  return (
    <div className="w-full p-4 sm:p-5 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-4 font-mono text-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Khung Stdin (Bàn phím nhập) */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <Keyboard className="w-3.5 h-3.5 text-blue-400" />
            Luồng dữ liệu vào (stdin)
          </div>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 min-h-[70px] space-y-1">
            {stdin.length === 0 ? (
              <span className="text-slate-600 italic">Không có dữ liệu stdin</span>
            ) : (
              stdin.map((line, idx) => (
                <div
                  key={idx}
                  className={`px-2 py-0.5 rounded ${
                    idx === stdinPos
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold'
                      : idx < stdinPos
                      ? 'text-slate-500 line-through'
                      : 'text-slate-300'
                  }`}
                >
                  <span className="text-slate-600 select-none mr-2">{idx + 1}:</span>
                  {line}
                  {idx === stdinPos && <span className="ml-2 text-[10px] text-blue-400 font-sans">← đang đọc</span>}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Khung Stdout (Màn hình in) */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <Monitor className="w-3.5 h-3.5 text-emerald-400" />
            Màn hình xuất (stdout)
          </div>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 min-h-[70px] space-y-1 text-emerald-300">
            {stdout.length === 0 ? (
              <span className="text-slate-600 italic">Chưa có kết quả in ra</span>
            ) : (
              stdout.map((line, idx) => (
                <div key={idx} className="flex items-start gap-1">
                  <span className="text-emerald-600 select-none">&gt;</span>
                  <span>{line}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tệp ảo nếu có */}
      {files.length > 0 && (
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
            <FileCode className="w-3.5 h-3.5 text-purple-400" />
            Tệp tin ảo (.INP / .OUT)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {files.map((file, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[11px] font-bold text-purple-300 pb-1 border-b border-slate-800/60 mb-1">
                  {file.name}
                </div>
                <pre className="text-slate-300 text-[11px] whitespace-pre-wrap">{file.content}</pre>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
