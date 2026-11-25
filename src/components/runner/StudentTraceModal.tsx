import React, { useState, useMemo, useEffect } from 'react';
import { Step, Lesson } from '../../core/types.ts';
import { RegisteredLesson } from '../../core/registry.ts';
import { SimulationView } from '../simulation/SimulationView.tsx';
import {
  X,
  Play,
  RotateCcw,
  Split,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Cpu,
} from 'lucide-react';

interface StudentTraceModalProps {
  studentCode: string;
  testInput: string;
  steps: Step[];
  finalOutput: string;
  expectedOutput: string;
  runtimeError?: string;
  standardLesson?: Lesson | RegisteredLesson;
  onClose: () => void;
}

export const StudentTraceModal: React.FC<StudentTraceModalProps> = ({
  studentCode,
  testInput,
  steps,
  finalOutput,
  expectedOutput,
  runtimeError,
  standardLesson,
  onClose,
}) => {
  const [splitView, setSplitView] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Kiểm tra xem trong các bước có biến dạng mảng (list/tuple) không để chọn renderer 'array' hay 'vars'
  const hasArrayVar = useMemo(() => {
    return steps.some((s) =>
      Object.values(s.vars || {}).some(
        (v) => typeof v === 'string' && (v.startsWith('[') || v.startsWith('('))
      )
    );
  }, [steps]);

  // Tạo đối tượng RegisteredLesson giả lập cho mã nguồn của học sinh
  const studentVirtualLesson: RegisteredLesson = useMemo(() => {
    const lines = studentCode.split('\n');
    return {
      id: 'student-trace-run',
      kind: 'concept',
      order: 999,
      group: 'Mã nguồn của em',
      groupOrder: 999,
      title: 'Mô phỏng từng dòng lệnh code của em',
      summary: `Mô phỏng với dữ liệu test: "${testInput}"`,
      level: 'nen-tang',
      contest: 'core',
      prerequisites: [],
      rendererKind: hasArrayVar ? 'array' : 'vars',
      status: 'ready',
      content: {
        id: 'student-trace-run',
        explanation: [],
        sample: {
          statement: 'Mô phỏng bộ test thực thi',
          constraints: '500 bước tối đa',
          maxSimSize: '500 bước',
          fields: [],
          defaultInput: {},
          presets: [],
          parse: () => ({ ok: true, value: testInput }),
          toStdin: () => testInput,
        },
        code: lines,
        lineNotes: lines.map((_, i) => `Dòng ${i + 1} mã nguồn học sinh`),
        generateSteps: () => steps,
        reference: () => expectedOutput,
        rubric: { keyIdeas: [], commonMistakes: [], hintsByIdea: {} },
        task: {
          kind: 'code',
          statement: '',
          inputFormat: '',
          outputFormat: '',
          constraints: '',
          examples: [],
          ioMode: { kind: 'stdio' },
          referenceSolution: '',
          tests: [],
          analysis: { maxN: '10^5', expectedComplexities: ['O(N)'] },
          starterCode: studentCode,
        },
        stages: [],
      },
    };
  }, [studentCode, testInput, steps, expectedOutput, hasArrayVar]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-6xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-500 flex items-center justify-center text-purple-300">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Mô phỏng từng dòng code của em trên test này</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {steps.length} bước
                </span>
              </h2>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Input: <span className="text-slate-200">"{testInput}"</span> | Output thực tế:{' '}
                <span className="text-amber-300 font-bold">"{finalOutput.trim()}"</span> | Đáp án:{' '}
                <span className="text-emerald-400 font-bold">"{expectedOutput.trim()}"</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Nút Đặt cạnh mô phỏng chuẩn nếu có lesson ready */}
            {standardLesson && (
              <button
                type="button"
                onClick={() => setSplitView(!splitView)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  splitView
                    ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/20'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Split className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {splitView ? 'Tắt so sánh 2 bên' : 'Đặt cạnh mô phỏng chuẩn'}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Nội dung mô phỏng */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {runtimeError && (
            <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-xs text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>Chương trình dừng sớm do lỗi thực thi: {runtimeError}</span>
            </div>
          )}

          {steps.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Code2 className="w-8 h-8 text-slate-500 mx-auto opacity-50" />
              <p className="text-sm">Không thể thu thập các bước chạy (có thể do lỗi cú pháp trước khi chạy).</p>
            </div>
          ) : splitView && standardLesson ? (
            /* Chế độ chia đôi 2 bên: Code học sinh & Mô phỏng chuẩn */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="text-xs font-bold text-purple-300 flex items-center gap-1.5 px-2">
                  <Code2 className="w-3.5 h-3.5" />
                  Mã nguồn của em:
                </div>
                <div className="rounded-2xl border border-purple-500/30 overflow-hidden bg-slate-950/60 p-2">
                  <SimulationView
                    lesson={studentVirtualLesson}
                    steps={steps}
                    autoPlay={false}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 px-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mô phỏng thuật toán chuẩn:
                </div>
                <div className="rounded-2xl border border-emerald-500/30 overflow-hidden bg-slate-950/60 p-2">
                  <SimulationView
                    lesson={standardLesson}
                    autoPlay={false}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Chế độ 1 màn hình rộng */
            <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/60 p-2">
              <SimulationView
                lesson={studentVirtualLesson}
                steps={steps}
                autoPlay={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
