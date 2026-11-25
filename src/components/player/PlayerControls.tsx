import React, { useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface PlayerControlsProps {
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  speed: number;
  onPlayToggle: () => void;
  onNext: () => void;
  onPrev: () => void;
  onReset: () => void;
  onSeek: (index: number) => void;
  onSpeedChange: (speed: number) => void;
  finalOutput?: string;
  expectedOutput?: string;
  opsCount?: number;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  currentStepIndex,
  totalSteps,
  isPlaying,
  speed,
  onPlayToggle,
  onNext,
  onPrev,
  onReset,
  onSeek,
  onSpeedChange,
  finalOutput,
  expectedOutput,
  opsCount = 0,
}) => {
  // Bàn phím: Space (Play/Pause), ArrowLeft (Prev), ArrowRight (Next)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger when user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        onPlayToggle();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onPlayToggle, onPrev, onNext]);

  const speeds = [0.25, 0.5, 1, 2, 4];
  const isEnd = currentStepIndex >= totalSteps - 1 && totalSteps > 0;
  const isMatched =
    finalOutput !== undefined &&
    expectedOutput !== undefined &&
    finalOutput.trim() === expectedOutput.trim();

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5 shadow-xl">
      {/* Hàng trên: Thanh trượt timeline và tiến trình bước */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-300 font-mono">
          <span className="font-bold flex items-center gap-1.5">
            <span className="text-blue-400">Bước:</span>
            <span className="text-white text-sm">
              {totalSteps > 0 ? currentStepIndex + 1 : 0}
            </span>
            <span className="text-slate-500">/ {totalSteps}</span>
          </span>

          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Phép tính:</span>
            <span className="font-bold text-amber-300">{opsCount}</span>
          </span>
        </div>

        {/* Thanh kéo timeline */}
        <input
          type="range"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={currentStepIndex}
          onChange={(e) => onSeek(Number(e.target.value))}
          disabled={totalSteps <= 1}
          className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
        />
      </div>

      {/* Hàng nút điều khiển & Tốc độ */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Bộ nút tua / phát / lùi */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Về đầu */}
          <button type="button"
            onClick={onReset}
            disabled={currentStepIndex === 0}
            title="Về bước đầu tiên"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Bước lùi (Left arrow) */}
          <button type="button"
            onClick={onPrev}
            disabled={currentStepIndex <= 0}
            title="Bước lùi (←)"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Nút Play / Pause lớn */}
          <button type="button"
            onClick={onPlayToggle}
            title={isPlaying ? 'Tạm dừng (Space)' : 'Phát tiếp (Space)'}
            className={`px-5 py-2 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-md ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>Tạm dừng</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>{isEnd ? 'Chạy lại' : 'Tự động chạy'}</span>
              </>
            )}
          </button>

          {/* Bước tiếp (Right arrow) */}
          <button type="button"
            onClick={onNext}
            disabled={isEnd}
            title="Bước tiếp (→)"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Nút chọn Tốc độ */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <span className="text-[10px] text-slate-500 px-1 font-sans hidden sm:inline">
            Tốc độ:
          </span>
          {speeds.map((s) => (
            <button type="button"
              key={s}
              onClick={() => onSpeedChange(s)}
              className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                speed === s
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>

      {/* Khung kết quả hiển thị khi kết thúc bước cuối */}
      {isEnd && finalOutput !== undefined && (
        <div
          className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm transition-all ${
            isMatched
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
              : 'bg-amber-950/60 border-amber-500/50 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {isMatched ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
            )}
            <div>
              <span className="font-bold">Kết quả mô phỏng (Output): </span>
              <span className="font-mono font-bold text-white px-2 py-0.5 rounded bg-black/40">
                {finalOutput}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span>Đối chiếu chuẩn:</span>
            <span className="font-bold text-white">{expectedOutput}</span>
            {isMatched && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-sans font-bold text-[11px] border border-emerald-500/40">
                ✓ Khớp chuẩn 100%
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
