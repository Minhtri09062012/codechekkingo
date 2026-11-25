import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useApp } from '../../context/AppContext.tsx';
import { GoogleSignInButton } from './GoogleSignInButton.tsx';
import { X, ShieldCheck, Cloud, Trophy, Zap, AlertCircle, User, Sparkles } from 'lucide-react';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=120&h=120&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=120&h=120&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=120&h=120&q=80',
];

export const GoogleLoginModal: React.FC = () => {
  const { isLoginModalOpen, closeLoginModal, user, logout, registerRealUser } = useAuth();
  const { state } = useApp();
  const [tab, setTab] = useState<'real_user' | 'google'>('real_user');
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  const handleRegisterReal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Vui lòng nhập tên của bạn để hiển thị trên Bảng xếp hạng!');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const res = await registerRealUser({
      name: name.trim(),
      school: school.trim() || 'Học sinh đam mê thuật toán',
      avatar: selectedAvatar,
      initialProgress: state.progress,
    });

    setIsSubmitting(false);

    if (res.success) {
      setSuccessMessage(res.message || 'Ghi danh thành công! Bạn đã có mặt trên bảng xếp hạng.');
      setTimeout(() => {
        closeLoginModal();
      }, 1000);
    } else {
      setErrorMessage(res.message || 'Không thể ghi danh, vui lòng thử lại.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={closeLoginModal}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl shadow-blue-950/40"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          type="button"
          onClick={closeLoginModal}
          className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {user ? (
          // Logged in State
          <div className="space-y-6 text-center">
            <div className="flex flex-col items-center">
              <div className="relative">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-20 h-20 rounded-full border-4 border-blue-500/30 object-cover shadow-lg"
                />
                <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>
              <h3 className="mt-4 text-xl font-bold text-white">{user.name}</h3>
              {user.school && <p className="text-xs text-blue-400 font-medium">{user.school}</p>}
              <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                <Zap className="w-3.5 h-3.5 fill-blue-400" />
                <span>{user.totalXp} XP</span>
                <span className="text-slate-600">•</span>
                <span className="capitalize">{user.level.replace('-', ' ')}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-left space-y-2 text-xs text-slate-300">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Chuỗi ngày học:</span>
                <span className="font-bold text-amber-400">🔥 {user.streak} ngày</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Bài tập đã giải:</span>
                <span className="font-bold text-emerald-400">{user.solvedCount} bài</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Bài học hoàn thành:</span>
                <span className="font-bold text-blue-400">{user.lessonsCount} bài</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeLoginModal}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors cursor-pointer"
              >
                Tiếp tục học
              </button>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  closeLoginModal();
                }}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-300 font-semibold text-sm transition-colors border border-slate-700 cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        ) : (
          // Logged Out State with 2 Tabs
          <div className="space-y-5">
            <div className="text-center space-y-1">
              <div className="inline-flex p-2.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-1">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Ghi Danh Vào Bảng Xếp Hạng
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm mx-auto">
                Tham gia thi đấu cùng người dùng thực tế, đua top và nhận ngay <strong className="text-amber-400">+50 XP</strong> chào mừng!
              </p>
            </div>

            {/* Mode switch tabs */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setTab('real_user');
                  setErrorMessage(null);
                }}
                className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === 'real_user'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Ghi danh tên thật</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('google');
                  setErrorMessage(null);
                }}
                className={`py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  tab === 'google'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Google OAuth</span>
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            {tab === 'real_user' ? (
              // Fast real user form
              <form onSubmit={handleRegisterReal} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Họ và tên hoặc biệt danh thi đấu <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Hoàng Minh Trí"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Trường học hoặc đơn vị dự thi (tuỳ chọn)
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: THCS / THPT Chuyên..."
                    value={school}
                    onChange={(e) => setSchool(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Chọn ảnh đại diện thi đấu:
                  </label>
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                    {AVATAR_OPTIONS.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedAvatar(img)}
                        className={`relative rounded-full p-0.5 transition-all cursor-pointer ${
                          selectedAvatar === img
                            ? 'ring-2 ring-blue-500 scale-105'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={img}
                          alt="avatar"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4 text-amber-300" />
                  <span>{isSubmitting ? 'Đang ghi danh...' : 'Ghi danh & Vào Top (+50 XP)'}</span>
                </button>
              </form>
            ) : (
              // Google OAuth
              <div className="space-y-4 pt-1">
                <div className="space-y-2">
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-800/40 border border-slate-800 text-xs">
                    <Cloud className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300">Tự động đồng bộ code IDE và dữ liệu lên máy chủ.</span>
                  </div>
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-800/40 border border-slate-800 text-xs">
                    <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span className="text-slate-300">Tích lũy XP sau mỗi bài thi giải thành công.</span>
                  </div>
                </div>

                <div className="pt-2">
                  <GoogleSignInButton
                    size="lg"
                    className="w-full"
                    onSuccess={() => {
                      setSuccessMessage('Đăng nhập thành công!');
                      setTimeout(() => {
                        closeLoginModal();
                      }, 800);
                    }}
                    onError={(err) => setErrorMessage(err)}
                  />
                </div>
              </div>
            )}

            <p className="text-[11px] text-center text-slate-500">
              Dành riêng cho học sinh luyện thi Tin học trẻ & HSG Tin học. Thông tin được lưu trữ bảo mật.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
