import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { APP_NAME } from '../../core/brand.ts';

interface KeyboardShortcutsModalProps {
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ onClose }) => {
  const shortcuts = [
    { key: 'Alt + H', desc: 'Về Trang chủ' },
    { key: 'Alt + 1', desc: 'Mở Học khái niệm' },
    { key: 'Alt + 2', desc: 'Mở Học thuật toán' },
    { key: 'Alt + 3', desc: 'Mở Hiểu bài tập' },
    { key: 'Alt + 4', desc: 'Mở Luyện thi HSG' },
    { key: 'Alt + 5', desc: 'Mở Sổ tay lỗi sai' },
    { key: '?', desc: 'Bật / Tắt bảng phím tắt này' },
    { key: 'Esc', desc: 'Đóng bảng / Đóng menu thả xuống' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Phím tắt {APP_NAME}</h3>
              <p className="text-[11px] text-slate-400">Điều hướng nhanh toàn hệ thống</p>
            </div>
          </div>
          <button type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs"
            >
              <span className="text-slate-300">{sc.desc}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 font-mono text-[11px] font-bold text-slate-200 shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-1 text-center text-[11px] text-slate-500">
          * Phím tắt tự động bỏ qua khi bạn đang gõ trong ô nhập liệu hoặc trình soạn thảo code.
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsModal;
