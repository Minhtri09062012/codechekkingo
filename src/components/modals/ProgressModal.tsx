import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { ProgressState } from '../../core/types.ts';
import { catalog } from '../../core/catalog.ts';
import { EXPORT_PREFIX } from '../../core/brand.ts';
import { Download, Upload, X, CheckCircle, FileJson, AlertCircle } from 'lucide-react';

export const ProgressModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { state, dispatch } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.progress, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${EXPORT_PREFIX}-tiendo-${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Tệp không chứa dữ liệu JSON hợp lệ.');
        }

        const validIds = new Set(catalog.map((c) => c.id));
        const rawList: string[] = Array.isArray(parsed.understood)
          ? parsed.understood
          : Array.isArray(parsed.completedLessons)
          ? parsed.completedLessons
          : [];

        const validList = rawList.filter((id) => validIds.has(id));
        const droppedCount = rawList.length - validList.length;

        const updatedProgress: ProgressState = {
          version: 1,
          levels: {},
          solved: {},
          errorBook: [],
          ...parsed, // Giữ nguyên các trường lạ theo Quy tắc 14
          understood: validList,
        };

        dispatch({ type: 'IMPORT_PROGRESS', payload: updatedProgress });

        if (droppedCount > 0) {
          setImportStatus(
            `Đã nạp thành công tiến độ (${validList.length} bài). Đã tự động bỏ qua ${droppedCount} ID không còn tồn tại trong danh mục.`
          );
        } else {
          setImportStatus(`Đã nạp thành công tiến độ (${validList.length} bài đã hiểu).`);
        }
        setImportError(null);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Tệp JSON không hợp lệ.';
        setImportError(msg);
        setImportStatus(null);
      }
    };
    reader.readAsText(file);
  };

  const completedCount = state.progress.understood.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <FileJson className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base text-slate-100">Tiến độ học tập JSON</h3>
          </div>
          <button type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-5 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            Hệ thống không ép buộc lưu trữ cố định. Bạn có thể xuất tiến độ ra tệp JSON để lưu về máy hoặc nạp lại khi chuyển thiết bị.
          </p>

          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Tổng bài đã hiểu hiện tại:</span>
            <span className="text-lg font-bold text-emerald-400">{completedCount} bài</span>
          </div>

          {importStatus && (
            <div className="flex items-start gap-2 p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs rounded-xl">
              <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{importStatus}</span>
            </div>
          )}

          {importError && (
            <div className="flex items-start gap-2 p-3 bg-rose-950/50 border border-rose-800 text-rose-300 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{importError}</span>
            </div>
          )}

          <div className="flex flex-col gap-2.5 pt-2">
            <button type="button"
              onClick={handleExport}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm transition-colors cursor-pointer shadow-md shadow-blue-600/20"
            >
              <Download className="w-4 h-4" />
              Xuất tệp JSON (Tải về)
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />

            <button type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm border border-slate-700 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              Nhập từ tệp JSON đã lưu
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
