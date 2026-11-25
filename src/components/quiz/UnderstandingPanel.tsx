import React, { useState, useEffect } from 'react';
import { LearningSource } from '../../core/types.ts';
import { useGate } from '../../hooks/useGate.ts';
import { useApp } from '../../context/AppContext.tsx';
import { Level1ConceptPanel } from './Level1ConceptPanel.tsx';
import { Level2PredictionPanel } from './Level2PredictionPanel.tsx';
import { Level3ScaffoldPanel } from './Level3ScaffoldPanel.tsx';
import { Level4BeginnerPanel } from './Level4BeginnerPanel.tsx';
import { CodeRunner } from '../runner/CodeRunner.tsx';
import {
  FileCode,
  Eye,
  Layers,
  Sparkles,
  Lock,
  Unlock,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Code2,
} from 'lucide-react';

interface UnderstandingPanelProps {
  source: LearningSource;
  selectedLevel?: 1 | 2 | 3 | 4;
  onSelectLevel?: (lvl: 1 | 2 | 3 | 4) => void;
}

export const UnderstandingPanel: React.FC<UnderstandingPanelProps> = ({
  source,
  selectedLevel: controlledLevel,
  onSelectLevel,
}) => {
  const { state } = useApp();
  const [internalLevel, setInternalLevel] = useState<1 | 2 | 3 | 4>(controlledLevel || 1);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [codePromptNotice, setCodePromptNotice] = useState<string | null>(null);
  const [showCodeRunner, setShowCodeRunner] = useState<boolean>(false);

  const selectedLevel = controlledLevel ?? internalLevel;
  const setSelectedLevel = (lvl: 1 | 2 | 3 | 4) => {
    setInternalLevel(lvl);
    if (onSelectLevel) onSelectLevel(lvl);
  };

  useEffect(() => {
    setActiveLessonIndex(0);
    setCodePromptNotice(null);
  }, [source.id]);

  const hasSimulation = source.lessons.length > 0;
  const gate = useGate(source.id, selectedLevel, source);

  const levelsConfig = [
    {
      level: 1 as const,
      title: 'Cấp 1: Hiểu đề, mơ hồ triển khai',
      desc: 'Mô tả cách giải bằng lời/giả mã, hệ thống chấm theo Rubric và gợi ý bậc tăng dần',
      icon: FileCode,
      disabled: false,
    },
    {
      level: 2 as const,
      title: 'Cấp 2: Hiểu đề, chưa hình dung thuật toán',
      desc: 'Quan sát ô nhớ biến đổi (ẩn code), dự đoán dòng lệnh & biến số then chốt',
      icon: Eye,
      disabled: !hasSimulation,
      disabledReason: 'Bài tập này chưa có mô phỏng, hãy chọn Cấp 1 hoặc Cấp 3.',
    },
    {
      level: 3 as const,
      title: 'Cấp 3: Chưa hiểu đề, có nền tảng',
      desc: 'Đi từng bước: B1 Hiểu đề -> B2 Tự kiểm tra -> B3 Lần theo giải -> B4 Điền khuyết',
      icon: Layers,
      disabled: false,
    },
    {
      level: 4 as const,
      title: 'Cấp 4: Học sinh mới học',
      desc: 'Chạy từng dòng code mẫu, 3 lớp giải thích, ví dụ minh họa đời thường & thử thách đổi đề',
      icon: Sparkles,
      disabled: !hasSimulation,
      disabledReason: 'Bài tập này chưa có mô phỏng, hãy chọn Cấp 1 hoặc Cấp 3.',
    },
  ];

  const handleWriteCodeClick = () => {
    if (!gate.codeUnlocked) {
      setCodePromptNotice(gate.reason);
    } else {
      setShowCodeRunner(true);
      setCodePromptNotice(null);
      // Cuộn xuống CodeRunner nếu cần
      const elem = document.getElementById('code-runner-section');
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header: Tiêu đề + Nút "Viết code" với trạng thái khóa/mở */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Kiểm tra độ hiểu theo năng lực
            </span>
            <span className="text-xs text-slate-400 font-mono">
              #{source.id}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100">
            {source.title}
          </h2>
        </div>

        {/* Nút Viết code */}
        <div className="flex flex-col items-end gap-1">
          <button type="button"
            onClick={handleWriteCodeClick}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md cursor-pointer ${
              gate.codeUnlocked
                ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-emerald-600/30 active:scale-95'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
            }`}
          >
            {gate.codeUnlocked ? (
              <>
                <Code2 className="w-4 h-4 text-emerald-300" />
                <span>Viết code (Đã mở khóa)</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Viết code (Đang khóa)</span>
              </>
            )}
          </button>
          <span className="text-[11px] text-slate-500 max-w-xs text-right truncate">
            {gate.reason}
          </span>
        </div>
      </div>

      {/* Thông báo popup khi bấm Viết code */}
      {codePromptNotice && (
        <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/40 text-xs text-blue-200 flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-400 flex-shrink-0" />
            <span>{codePromptNotice}</span>
          </div>
          <button type="button"
            onClick={() => setCodePromptNotice(null)}
            className="text-xs text-blue-400 hover:text-white underline"
          >
            Đã hiểu
          </button>
        </div>
      )}

      {/* 2. Trường hợp nhiều bài mô phỏng: Hiện các tab con */}
      {source.lessons.length > 1 && (
        <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-2">
          <div className="text-xs font-semibold text-slate-400">
            Chọn mô phỏng thuật toán liên quan:
          </div>
          <div className="flex flex-wrap gap-2">
            {source.lessons.map((les, idx) => (
              <button type="button"
                key={les.id}
                onClick={() => setActiveLessonIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeLessonIndex === idx
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                #{idx + 1} {les.id}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Thanh chọn 4 cấp độ (mỗi cấp mô tả 1 dòng) */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
          Chọn cấp độ phù hợp với tình trạng học tập của em:
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {levelsConfig.map((item) => {
            const isSelected = selectedLevel === item.level;
            const isDisabled = item.disabled;

            return (
              <button type="button"
                key={item.level}
                disabled={isDisabled}
                onClick={() => setSelectedLevel(item.level)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 shadow-md shadow-blue-500/10'
                    : isDisabled
                    ? 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-60 cursor-not-allowed'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between pb-1">
                  <div className="flex items-center gap-2">
                    <item.icon
                      className={`w-4 h-4 ${
                        isSelected ? 'text-blue-400' : isDisabled ? 'text-slate-600' : 'text-slate-400'
                      }`}
                    />
                    <span
                      className={`text-xs font-bold ${
                        isSelected ? 'text-blue-200' : isDisabled ? 'text-slate-500' : 'text-slate-200'
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 shadow-sm shadow-blue-400" />
                  )}
                </div>

                <p
                  className={`text-[11px] leading-relaxed line-clamp-2 ${
                    isSelected ? 'text-blue-300/90' : isDisabled ? 'text-slate-600' : 'text-slate-400'
                  }`}
                >
                  {isDisabled ? item.disabledReason : item.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Nội dung của Cấp độ được chọn */}
      <div className="pt-2">
        {selectedLevel === 1 && (
          <Level1ConceptPanel
            key={`${source.id}-${activeLessonIndex}`}
            source={source}
            activeLessonIndex={activeLessonIndex}
          />
        )}

        {selectedLevel === 2 && (
          <Level2PredictionPanel
            key={`${source.id}-${activeLessonIndex}`}
            source={source}
            activeLessonIndex={activeLessonIndex}
          />
        )}

        {selectedLevel === 3 && (
          <Level3ScaffoldPanel
            key={`${source.id}-${activeLessonIndex}`}
            source={source}
            activeLessonIndex={activeLessonIndex}
          />
        )}

        {selectedLevel === 4 && (
          <Level4BeginnerPanel
            key={`${source.id}-${activeLessonIndex}`}
            source={source}
            activeLessonIndex={activeLessonIndex}
          />
        )}
      </div>

      {/* 5. CỔNG VIẾT CODE & CHẤM PYODIDE (Prompt 7) */}
      <div id="code-runner-section" className="pt-6 border-t border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-600/30 border border-emerald-500 text-emerald-400 text-xs flex items-center justify-center font-bold">
              ✓
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-100">
              Trình biên dịch & Chấm mã nguồn Python (Cấp {selectedLevel})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {gate.codeUnlocked ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Unlock className="w-3.5 h-3.5" /> Đã mở khóa
              </span>
            ) : (
              <span className="text-amber-400 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Đang khóa
              </span>
            )}
          </span>
        </div>

        <CodeRunner source={source} level={selectedLevel} />
      </div>
    </div>
  );
};
