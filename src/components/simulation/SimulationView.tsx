import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lesson, Step } from '../../core/types.ts';
import { RegisteredLesson } from '../../core/registry.ts';
import { resolveRenderer } from '../renderers/index.tsx';
import { PlayerControls } from '../player/PlayerControls.tsx';
import {
  Code2,
  Table,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Key,
  Layers,
} from 'lucide-react';

interface SimulationViewProps {
  lesson: Lesson | RegisteredLesson;
  input?: unknown;
  steps?: Step[];
  autoPlay?: boolean;
}

export const SimulationView: React.FC<SimulationViewProps> = ({
  lesson,
  input,
  steps: externalSteps,
  autoPlay = true,
}) => {
  // Extract lesson content
  const content = 'content' in lesson ? lesson.content : (lesson as Lesson);
  const codeLines = content?.code || [];
  const lineNotes = content?.lineNotes || [];

  // 1. Generate or use passed steps
  const simulationSteps: Step[] = useMemo(() => {
    if (externalSteps && externalSteps.length > 0) {
      return externalSteps;
    }
    if (content && typeof content.generateSteps === 'function' && input !== undefined) {
      try {
        const raw = content.generateSteps(input);
        // Rule 2 & 3: Limit max 500 steps
        return raw.slice(0, 500);
      } catch (err) {
        console.error('Lỗi khi chạy generateSteps:', err);
        return [];
      }
    }
    return [];
  }, [externalSteps, content, input]);

  // Expected reference output
  const expectedOutput = useMemo(() => {
    if (content && typeof content.reference === 'function' && input !== undefined) {
      try {
        return content.reference(input);
      } catch (err) {
        console.error('Lỗi khi tính reference:', err);
        return undefined;
      }
    }
    return undefined;
  }, [content, input]);

  // Player State
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [speed, setSpeed] = useState<number>(1);

  // When input or steps change, reset to step 0 and auto-play
  useEffect(() => {
    setCurrentStepIndex(0);
    setIsPlaying(autoPlay && simulationSteps.length > 1);
  }, [simulationSteps, autoPlay]);

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return;
    if (currentStepIndex >= simulationSteps.length - 1) {
      setIsPlaying(false);
      return;
    }

    const intervalTime = Math.max(100, Math.round(1000 / speed));
    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => {
        if (prev < simulationSteps.length - 1) {
          return prev + 1;
        } else {
          setIsPlaying(false);
          return prev;
        }
      });
    }, intervalTime);

    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, simulationSteps.length, speed]);

  const currentStep: Step | undefined = simulationSteps[currentStepIndex];
  const prevStep: Step | undefined =
    currentStepIndex > 0 ? simulationSteps[currentStepIndex - 1] : undefined;

  // Final output
  const lastStep = simulationSteps[simulationSteps.length - 1];
  const finalOutput = lastStep?.output;

  // Track changed vars for flashing highlight (Region C)
  const changedVars = useMemo(() => {
    if (!currentStep) return new Set<string>();
    const currentVars = currentStep.vars || {};
    const prevVars = prevStep?.vars || {};
    const changed = new Set<string>();

    for (const [key, val] of Object.entries(currentVars)) {
      if (prevVars[key] !== val) {
        changed.add(key);
      }
    }
    return changed;
  }, [currentStep, prevStep]);

  // Resolve active renderer
  const RendererComponent = useMemo(() => {
    return resolveRenderer(lesson);
  }, [lesson]);

  if (simulationSteps.length === 0) {
    return (
      <div className="w-full p-8 rounded-2xl bg-slate-900/50 border border-slate-800 text-center space-y-3">
        <Info className="w-8 h-8 text-slate-500 mx-auto" />
        <p className="text-sm font-semibold text-slate-300">
          Chưa có bước mô phỏng nào cho dữ liệu hiện tại
        </p>
        <p className="text-xs text-slate-500">
          Vui lòng kiểm tra dữ liệu nhập ở phần B và bấm "Chạy" hoặc chọn một dữ liệu mẫu.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* 4 VÙNG ĐỒNG BỘ:
          (a) Trực quan (Renderer)
          (b) Code Python đánh số dòng, tô sáng
          (c) Bảng biến Step.vars
          (d) Khung giải thích bước này
      */}

      {/* VÙNG (d): Giải thích bước này = Step.explain */}
      {currentStep && (
        <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 flex items-start gap-3 shadow-md">
          <div className="w-7 h-7 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
            {currentStep.key ? (
              <Key className="w-4 h-4 text-amber-400" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                Bước {currentStepIndex + 1}/{simulationSteps.length}: Dòng {currentStep.line}
              </span>
              {currentStep.key && (
                <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  Bước mấu chốt (Key Step)
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              {currentStep.explain}
            </p>
          </div>
        </div>
      )}

      {/* VÙNG (a): Trực quan hóa = Renderer */}
      {currentStep && (
        <div className="w-full">
          <RendererComponent step={currentStep} />
        </div>
      )}

      {/* BỐ CỤC 2 CỘT: (b) Code Python và (c) Bảng biến */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* VÙNG (b): Code Python (7 cột) */}
        <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col space-y-2 shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400">
            <span className="font-bold flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-emerald-400" />
              Mã nguồn Python 3
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              Đang chạy dòng {currentStep?.line ?? 1}
            </span>
          </div>

          <div className="overflow-x-auto py-1 font-mono text-xs sm:text-sm leading-relaxed space-y-0.5">
            {codeLines.map((lineText, idx) => {
              const lineNo = idx + 1;
              const isActive = currentStep?.line === lineNo;
              const note = lineNotes[idx];

              return (
                <div
                  key={lineNo}
                  className={`group flex items-start px-2 py-1 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600/25 border-l-4 border-blue-500 text-white font-semibold'
                      : 'hover:bg-slate-900/60 text-slate-300'
                  }`}
                >
                  {/* Số dòng */}
                  <span
                    className={`w-7 text-right select-none pr-3 flex-shrink-0 text-xs ${
                      isActive ? 'text-blue-400 font-bold' : 'text-slate-600'
                    }`}
                  >
                    {lineNo}
                  </span>

                  {/* Nội dung dòng code */}
                  <span className="flex-1 whitespace-pre">{lineText}</span>

                  {/* Chú thích dòng tiếng Việt */}
                  {note && (
                    <span
                      title={note}
                      className="hidden sm:inline-block ml-3 text-[11px] font-sans text-slate-500 italic max-w-[200px] truncate"
                    >
                      # {note}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* VÙNG (c): Bảng biến Step.vars (5 cột) */}
        <div className="lg:col-span-5 bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col space-y-2 shadow-inner">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs text-slate-400">
            <span className="font-bold flex items-center gap-1.5">
              <Table className="w-4 h-4 text-purple-400" />
              Bảng biến trạng thái (Variables)
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              {Object.keys(currentStep?.vars || {}).length} biến
            </span>
          </div>

          <div className="overflow-x-auto">
            {Object.keys(currentStep?.vars || {}).length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-600 italic">
                Chưa có biến nào được ghi nhận tại bước này
              </div>
            ) : (
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-500 uppercase">
                    <th className="py-2 px-2.5">Biến</th>
                    <th className="py-2 px-2.5">Giá trị</th>
                    <th className="py-2 px-2.5 text-right">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {Object.entries(currentStep?.vars || {}).map(([vName, vVal]) => {
                    const isChanged = changedVars.has(vName);
                    const displayVal = vVal === null ? 'None' : String(vVal);

                    return (
                      <tr
                        key={vName}
                        className={`transition-colors ${
                          isChanged
                            ? 'bg-amber-500/15 text-amber-200'
                            : 'hover:bg-slate-900/40 text-slate-300'
                        }`}
                      >
                        <td className="py-2 px-2.5 font-bold text-blue-400">{vName}</td>
                        <td className="py-2 px-2.5">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              isChanged
                                ? 'bg-amber-400 text-slate-950 font-black animate-pulse'
                                : 'bg-slate-900 text-slate-100'
                            }`}
                          >
                            {displayVal}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-right text-[10px] text-slate-500 font-sans">
                          {isChanged ? (
                            <span className="text-amber-400 font-bold">Vừa đổi</span>
                          ) : (
                            'Giữ nguyên'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* THANH ĐIỀU KHIỂN PLAYER */}
      <PlayerControls
        currentStepIndex={currentStepIndex}
        totalSteps={simulationSteps.length}
        isPlaying={isPlaying}
        speed={speed}
        onPlayToggle={() => setIsPlaying((prev) => !prev)}
        onNext={() => {
          setIsPlaying(false);
          setCurrentStepIndex((prev) => Math.min(simulationSteps.length - 1, prev + 1));
        }}
        onPrev={() => {
          setIsPlaying(false);
          setCurrentStepIndex((prev) => Math.max(0, prev - 1));
        }}
        onReset={() => {
          setIsPlaying(false);
          setCurrentStepIndex(0);
        }}
        onSeek={(idx) => {
          setIsPlaying(false);
          setCurrentStepIndex(idx);
        }}
        onSpeedChange={(newSpeed) => setSpeed(newSpeed)}
        finalOutput={finalOutput}
        expectedOutput={expectedOutput}
        opsCount={currentStep?.ops || 0}
      />
    </div>
  );
};
