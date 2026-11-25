import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { useApp } from '../../context/AppContext.tsx';
import { safeParseJson } from '../../core/safeFetch.ts';
import {
  Trophy,
  Flame,
  Award,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Zap,
  CheckCircle,
  BookOpen,
  X,
  Sparkles,
  Crown,
  Medal,
  TrendingUp,
  UserCheck,
  Bot,
  Trash2,
  RotateCcw,
  RefreshCw,
  School,
  Code,
  ArrowRight,
} from 'lucide-react';

interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  email: string;
  avatar: string;
  school?: string;
  isBot?: boolean;
  xp: number;
  solvedCount: number;
  lessonsCount: number;
  level: 'nen-tang' | 'co-ban' | 'trung-cap' | 'nang-cao';
  streak: number;
  isCurrentUser?: boolean;
}

export const LeaderboardPage: React.FC = () => {
  const { user: currentUser, openLoginModal, registerRealUser } = useAuth();
  const { state: appState } = useApp();
  const [timeframe, setTimeframe] = useState<'all-time' | 'monthly' | 'weekly' | 'daily'>('all-time');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [botFilter, setBotFilter] = useState<'real_only' | 'all' | 'bots_only'>('real_only');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Quick enroll state
  const [quickName, setQuickName] = useState<string>('');
  const [quickSchool, setQuickSchool] = useState<string>('');
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [confirmClearBots, setConfirmClearBots] = useState<boolean>(false);

  const [leaderboardData, setLeaderboardData] = useState<{
    users: LeaderboardUser[];
    totalUsers: number;
    totalRealUsers?: number;
    totalBots?: number;
    totalPages: number;
    currentUserRank: LeaderboardUser | null;
  }>({
    users: [],
    totalUsers: 0,
    totalRealUsers: 0,
    totalBots: 0,
    totalPages: 1,
    currentUserRank: null,
  });

  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);

  // Fetch data from backend
  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        timeframe,
        level: levelFilter,
        botFilter,
        search: searchQuery,
        page: page.toString(),
        limit: '10',
      });

      const token = localStorage.getItem('codetrekking_auth_token');
      const res = await fetch(`/api/leaderboard?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const parsed = await safeParseJson(res);
        if (parsed.ok) {
          const data = parsed.data;
          setLeaderboardData({
            users: data.users || [],
            totalUsers: data.totalUsers || 0,
            totalRealUsers: data.totalRealUsers || 0,
            totalBots: data.totalBots || 0,
            totalPages: data.totalPages || 1,
            currentUserRank: data.currentUserRank || null,
          });
        }
      }
    } catch (err) {
      console.warn('Failed to load leaderboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe, levelFilter, botFilter, searchQuery, page]);

  // Handle Quick Enroll
  const handleQuickEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;

    setIsEnrolling(true);
    const res = await registerRealUser({
      name: quickName.trim(),
      school: quickSchool.trim() || 'Học sinh đam mê Tin học',
      initialProgress: appState.progress,
    });
    setIsEnrolling(false);

    if (res.success) {
      setActionMessage(`🎉 Chào mừng ${quickName.trim()}! Bạn đã có mặt trên bảng xếp hạng với +50 XP!`);
      setQuickName('');
      setQuickSchool('');
      setBotFilter('real_only');
      setPage(1);
      fetchLeaderboard();
      setTimeout(() => setActionMessage(null), 5000);
    } else {
      setActionMessage(res.message || 'Lỗi khi ghi danh.');
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  // Handle Clear Bots
  const handleClearBots = async () => {
    setConfirmClearBots(false);
    try {
      const res = await fetch('/api/leaderboard/clear-bots', { method: 'POST' });
      const parsed = await safeParseJson(res);
      if (parsed.ok) {
        setActionMessage(parsed.data.message || 'Đã dọn sạch các bot mô phỏng!');
        setBotFilter('real_only');
        fetchLeaderboard();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Restore Bots
  const handleRestoreBots = async () => {
    try {
      const res = await fetch('/api/leaderboard/restore-bots', { method: 'POST' });
      const parsed = await safeParseJson(res);
      if (parsed.ok) {
        setActionMessage(parsed.data.message || 'Đã nạp lại bot đối chuẩn HSG!');
        fetchLeaderboard();
        setTimeout(() => setActionMessage(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Level badge styling
  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'nang-cao':
        return { label: 'Nâng cao', bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30' };
      case 'trung-cap':
        return { label: 'Trung cấp', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
      case 'co-ban':
        return { label: 'Cơ bản', bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
      default:
        return { label: 'Nền tảng', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
    }
  };

  // Split top 3 if on page 1 without search filter
  const isDefaultView = page === 1 && !searchQuery && levelFilter === 'all';
  const top1 = isDefaultView ? leaderboardData.users[0] : null;
  const top2 = isDefaultView ? leaderboardData.users[1] : null;
  const top3 = isDefaultView ? leaderboardData.users[2] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-28">
      {/* Toast Notification */}
      {actionMessage && (
        <div className="fixed top-20 right-4 z-50 p-4 rounded-2xl bg-blue-600/90 text-white border border-blue-400 shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-3 max-w-md">
          <Sparkles className="w-5 h-5 text-amber-300 shrink-0" />
          <span className="text-xs sm:text-sm font-semibold">{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="p-1 hover:bg-blue-700 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-gradient-to-b from-blue-950/40 via-slate-900/60 to-slate-950 px-4 py-8 sm:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative max-w-6xl mx-auto flex flex-col items-center text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Đấu Trường Thuật Toán & Xếp Hạng Học Sinh Thực Tế</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white">
            Bảng Xếp Hạng <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">Đấu Trường</span>
          </h1>

          <p className="max-w-xl text-sm sm:text-base text-slate-400">
            Tích lũy XP khi giải đúng bài tập, vượt qua các chặng mô phỏng thuật toán và duy trì chuỗi học tập hàng ngày.
          </p>

          {/* Mode Switch Tabs: Real Users vs All/Bots */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setBotFilter('real_only');
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-lg ${
                botFilter === 'real_only'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/50'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-300" />
              <span>Chỉ Người Dùng Thực Tế</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-950/60 text-[11px] font-mono text-emerald-300">
                {leaderboardData.totalRealUsers ?? 0}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setBotFilter('all');
                setPage(1);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-lg ${
                botFilter === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-600/30 ring-2 ring-blue-400/50'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Bot className="w-4 h-4 text-blue-300" />
              <span>Kèm Bot Mẫu HSG Tin</span>
              <span className="px-2 py-0.5 rounded-full bg-slate-950/60 text-[11px] font-mono text-blue-300">
                {leaderboardData.totalBots ?? 0} bots
              </span>
            </button>
          </div>

          {/* Bot Management Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs pt-1">
            {confirmClearBots ? (
              <div className="inline-flex items-center gap-2 bg-rose-950/50 border border-rose-500/40 rounded-xl px-2.5 py-1">
                <span className="text-rose-200">Xóa toàn bộ bot mẫu?</span>
                <button
                  type="button"
                  onClick={handleClearBots}
                  className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer"
                >
                  Xác nhận
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearBots(false)}
                  className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  Hủy
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearBots(true)}
                className="inline-flex items-center gap-1.5 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer py-1 px-2.5 rounded-xl hover:bg-slate-900"
                title="Xóa vĩnh viễn các bot mẫu để bảng xếp hạng 100% thuần người thật"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Dọn sạch Bot mẫu</span>
              </button>
            )}
            <span className="text-slate-700">•</span>
            <button
              type="button"
              onClick={handleRestoreBots}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer py-1 px-2.5 rounded-xl hover:bg-slate-900"
              title="Khôi phục lại các mốc điểm chuẩn bot HSG"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Khôi phục Bot đối chuẩn</span>
            </button>
            <span className="text-slate-700">•</span>
            <button
              type="button"
              onClick={fetchLeaderboard}
              className="inline-flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer py-1 px-2.5 rounded-xl hover:bg-slate-900"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Làm mới</span>
            </button>
          </div>

          {/* Timeframe Tabs */}
          <div className="mt-3 flex flex-wrap justify-center p-1 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
            {[
              { id: 'all-time', label: 'Toàn thời gian', icon: Trophy },
              { id: 'monthly', label: 'Hằng tháng', icon: Medal },
              { id: 'weekly', label: 'Hằng tuần', icon: TrendingUp },
              { id: 'daily', label: 'Hằng ngày', icon: Flame },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = timeframe === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setTimeframe(tab.id as any);
                    setPage(1);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
        {/* Quick Enroll Card for Unregistered / Guest Users */}
        {!currentUser && (
          <div className="relative overflow-hidden rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-blue-950/30 p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center lg:text-left max-w-xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Dành riêng cho bạn (Người dùng thật)</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Ghi Danh Đua Top Người Thật Ngay!
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Bạn đang ở chế độ khách. Nhập tên của bạn bên dưới để tạo hồ sơ thật, nhận ngay <strong className="text-amber-400">+50 XP chào mừng</strong> và xuất hiện ngay trên Bảng Xếp Hạng toàn quốc!
                </p>
              </div>

              <form onSubmit={handleQuickEnroll} className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="text"
                  required
                  placeholder="Họ và tên của bạn..."
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  className="w-full sm:w-56 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <input
                  type="text"
                  placeholder="Trường / Lớp (tuỳ chọn)..."
                  value={quickSchool}
                  onChange={(e) => setQuickSchool(e.target.value)}
                  className="w-full sm:w-56 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  disabled={isEnrolling}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all cursor-pointer shrink-0 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Trophy className="w-4 h-4 text-amber-300" />
                  <span>{isEnrolling ? 'Đang ghi danh...' : 'Vào Bảng Xếp Hạng 🚀'}</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Top 3 Podium (Only on page 1 without search/filter and when users exist) */}
        {isDefaultView && top1 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 items-end">
            {/* Rank 2 - Silver */}
            {top2 && (
              <div
                onClick={() => setSelectedUser(top2)}
                className="group relative order-2 md:order-1 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-slate-700/80 p-6 flex flex-col items-center text-center transition-all hover:scale-[1.02] hover:border-slate-400 cursor-pointer shadow-xl shadow-slate-950/50"
              >
                <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-slate-400/20 border border-slate-400/40 text-slate-300 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <span>🥈 HẠNG 2</span>
                </div>
                <div className="relative mt-2">
                  <img
                    src={top2.avatar}
                    alt={top2.name}
                    className="w-20 h-20 rounded-full border-4 border-slate-400 object-cover shadow-lg"
                  />
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center font-bold text-xs text-white">
                    2
                  </div>
                </div>
                <h3 className="mt-4 text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                  {top2.name}
                </h3>
                {top2.school && (
                  <span className="text-[11px] text-slate-400 mt-0.5 font-medium flex items-center gap-1">
                    <School className="w-3 h-3 text-slate-500" />
                    <span>{top2.school}</span>
                  </span>
                )}
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getLevelBadge(top2.level).bg}`}>
                    {getLevelBadge(top2.level).label}
                  </span>
                  {top2.isBot ? (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                      🤖 Bot HSG
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      🟢 Người thật
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-lg font-black text-amber-400">
                  <Zap className="w-5 h-5 fill-amber-400" />
                  <span>{top2.xp.toLocaleString()} XP</span>
                </div>
                <div className="mt-3 w-full grid grid-cols-2 gap-2 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                  <div>
                    <span className="text-slate-500 block text-[10px]">ĐÃ GIẢI</span>
                    <span className="font-bold text-slate-200">{top2.solvedCount} bài</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">CHUỖI NGÀY</span>
                    <span className="font-bold text-amber-400">🔥 {top2.streak} ngày</span>
                  </div>
                </div>
              </div>
            )}

            {/* Rank 1 - Gold (Center, elevated) */}
            <div
              onClick={() => setSelectedUser(top1)}
              className="group relative order-1 md:order-2 rounded-3xl bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-950 border-2 border-amber-500/80 p-8 flex flex-col items-center text-center transition-all hover:scale-[1.03] hover:border-amber-400 cursor-pointer shadow-2xl shadow-amber-500/20 md:-translate-y-4"
            >
              <div className="absolute -top-4 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-lg shadow-amber-500/30">
                <Crown className="w-4 h-4 fill-slate-950" />
                <span>QUÁN QUÂN</span>
              </div>
              <div className="relative mt-2">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 blur-sm opacity-60 group-hover:opacity-100 transition-opacity" />
                <img
                  src={top1.avatar}
                  alt={top1.name}
                  className="relative w-24 h-24 rounded-full border-4 border-amber-400 object-cover shadow-2xl"
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 flex items-center justify-center font-black text-sm text-slate-950 shadow-md">
                  1
                </div>
              </div>
              <h3 className="mt-4 text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                {top1.name}
              </h3>
              {top1.school && (
                <span className="text-xs text-amber-300/80 mt-0.5 font-medium flex items-center gap-1">
                  <School className="w-3.5 h-3.5 text-amber-400" />
                  <span>{top1.school}</span>
                </span>
              )}
              <div className="mt-2 flex items-center gap-1.5">
                <span className={`px-3 py-0.5 rounded-full text-xs font-bold border ${getLevelBadge(top1.level).bg}`}>
                  {getLevelBadge(top1.level).label}
                </span>
                {top1.isBot ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold">
                    🤖 Bot HSG
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                    🟢 Người thật
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-2xl font-black text-amber-400">
                <Sparkles className="w-6 h-6 fill-amber-400" />
                <span>{top1.xp.toLocaleString()} XP</span>
              </div>
              <div className="mt-4 w-full grid grid-cols-2 gap-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                <div>
                  <span className="text-slate-500 block text-[10px]">ĐÃ GIẢI</span>
                  <span className="font-bold text-emerald-400">{top1.solvedCount} bài tập</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">CHUỖI NGÀY</span>
                  <span className="font-bold text-amber-400">🔥 {top1.streak} ngày</span>
                </div>
              </div>
            </div>

            {/* Rank 3 - Bronze */}
            {top3 && (
              <div
                onClick={() => setSelectedUser(top3)}
                className="group relative order-3 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border border-amber-700/60 p-6 flex flex-col items-center text-center transition-all hover:scale-[1.02] hover:border-amber-600 cursor-pointer shadow-xl shadow-slate-950/50"
              >
                <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-amber-700/20 border border-amber-700/40 text-amber-400 text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <span>🥉 HẠNG 3</span>
                </div>
                <div className="relative mt-2">
                  <img
                    src={top3.avatar}
                    alt={top3.name}
                    className="w-20 h-20 rounded-full border-4 border-amber-700 object-cover shadow-lg"
                  />
                  <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-slate-800 border-2 border-amber-700 flex items-center justify-center font-bold text-xs text-white">
                    3
                  </div>
                </div>
                <h3 className="mt-4 text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                  {top3.name}
                </h3>
                {top3.school && (
                  <span className="text-[11px] text-slate-400 mt-0.5 font-medium flex items-center gap-1">
                    <School className="w-3 h-3 text-slate-500" />
                    <span>{top3.school}</span>
                  </span>
                )}
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={`mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getLevelBadge(top3.level).bg}`}>
                    {getLevelBadge(top3.level).label}
                  </span>
                  {top3.isBot ? (
                    <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold">
                      🤖 Bot HSG
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                      🟢 Người thật
                    </span>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-1.5 text-lg font-black text-amber-400">
                  <Zap className="w-5 h-5 fill-amber-400" />
                  <span>{top3.xp.toLocaleString()} XP</span>
                </div>
                <div className="mt-3 w-full grid grid-cols-2 gap-2 text-xs text-slate-400 border-t border-slate-800/80 pt-3">
                  <div>
                    <span className="text-slate-500 block text-[10px]">ĐÃ GIẢI</span>
                    <span className="font-bold text-slate-200">{top3.solvedCount} bài</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">CHUỖI NGÀY</span>
                    <span className="font-bold text-amber-400">🔥 {top3.streak} ngày</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800">
          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh hoặc trường..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Level Filter */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <span className="text-xs text-slate-400 mr-1 hidden sm:inline">Cấp độ:</span>
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'nen-tang', label: 'Nền tảng' },
              { id: 'co-ban', label: 'Cơ bản' },
              { id: 'trung-cap', label: 'Trung cấp' },
              { id: 'nang-cao', label: 'Nâng cao' },
            ].map((lvl) => (
              <button
                key={lvl.id}
                type="button"
                onClick={() => {
                  setLevelFilter(lvl.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  levelFilter === lvl.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {lvl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Real User Empty State Prompt (When real_only has 0 users) */}
        {!loading && leaderboardData.users.length === 0 && botFilter === 'real_only' && (
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/80 border border-slate-800 text-center space-y-5">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
              <Crown className="w-8 h-8" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
              <h3 className="text-xl font-bold text-white">Chưa có ai chiếm giữ Top 1 Người Thật!</h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Hãy là người đầu tiên ghi danh hoặc giải ngay 1 bài tập Python để dẫn đầu Bảng Vàng toàn quốc.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                to="/problem"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <Code className="w-4 h-4" />
                <span>Giải bài tập (+35 XP)</span>
              </Link>
              <Link
                to="/exam"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>Thi đấu HSG Tin (+50 XP)</span>
              </Link>
              <button
                type="button"
                onClick={() => setBotFilter('all')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm transition-all cursor-pointer border border-slate-700"
              >
                <Bot className="w-4 h-4 text-blue-400" />
                <span>Xem Bot đối chuẩn</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Leaderboard Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 shadow-xl backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4 sm:px-6 text-center w-16">Thứ hạng</th>
                  <th className="py-4 px-4 sm:px-6">Học sinh</th>
                  <th className="py-4 px-4 hidden md:table-cell">Cấp độ</th>
                  <th className="py-4 px-4 text-center hidden sm:table-cell">Chuỗi ngày</th>
                  <th className="py-4 px-4 text-center hidden sm:table-cell">Đã giải</th>
                  <th className="py-4 px-4 text-center hidden lg:table-cell">Bài học</th>
                  <th className="py-4 px-4 sm:px-6 text-right">Tổng XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Đang tải danh sách bảng xếp hạng...
                    </td>
                  </tr>
                ) : leaderboardData.users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Không tìm thấy người dùng phù hợp với tiêu chí lọc.
                    </td>
                  </tr>
                ) : (
                  leaderboardData.users.map((item) => {
                    const isSelf = currentUser && item.id === currentUser.id;
                    const badge = getLevelBadge(item.level);

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedUser(item)}
                        className={`group transition-colors hover:bg-slate-800/50 cursor-pointer ${
                          isSelf
                            ? 'bg-blue-600/15 border-l-4 border-l-blue-500 hover:bg-blue-600/20'
                            : ''
                        }`}
                      >
                        {/* Rank */}
                        <td className="py-4 px-4 sm:px-6 text-center font-black">
                          {item.rank === 1 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-400/20 text-amber-400 text-sm font-black border border-amber-400/30">
                              🥇
                            </span>
                          ) : item.rank === 2 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300/20 text-slate-200 text-sm font-black border border-slate-300/30">
                              🥈
                            </span>
                          ) : item.rank === 3 ? (
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-500 text-sm font-black border border-amber-700/30">
                              🥉
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-sm">#{item.rank}</span>
                          )}
                        </td>

                        {/* User Profile */}
                        <td className="py-4 px-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.avatar}
                              alt={item.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                                  {item.name}
                                </span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.5 rounded bg-blue-500 text-slate-950 font-bold text-[10px]">
                                    BẠN
                                  </span>
                                )}
                                {item.isBot ? (
                                  <span className="px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold text-[10px]">
                                    🤖 Bot HSG
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-[10px]">
                                    🟢 Người thật
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                {item.school ? (
                                  <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                                    <School className="w-3 h-3 text-slate-500" />
                                    <span>{item.school}</span>
                                  </span>
                                ) : (
                                  <span className="text-xs text-slate-500 font-mono hidden sm:inline-block">
                                    {item.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Level */}
                        <td className="py-4 px-4 hidden md:table-cell">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg}`}>
                            {badge.label}
                          </span>
                        </td>

                        {/* Streak */}
                        <td className="py-4 px-4 text-center hidden sm:table-cell font-bold text-amber-400">
                          🔥 {item.streak} ngày
                        </td>

                        {/* Solved */}
                        <td className="py-4 px-4 text-center hidden sm:table-cell font-medium text-emerald-400">
                          {item.solvedCount} bài
                        </td>

                        {/* Lessons */}
                        <td className="py-4 px-4 text-center hidden lg:table-cell font-medium text-blue-400">
                          {item.lessonsCount} bài
                        </td>

                        {/* XP */}
                        <td className="py-4 px-4 sm:px-6 text-right font-black text-amber-400">
                          <div className="inline-flex items-center gap-1">
                            <Zap className="w-4 h-4 fill-amber-400" />
                            <span>{item.xp.toLocaleString()} XP</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {leaderboardData.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/40 text-xs">
              <span className="text-slate-400">
                Hiển thị trang <span className="font-bold text-white">{page}</span> / {leaderboardData.totalPages} (Tổng số {leaderboardData.totalUsers} thành viên)
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  aria-label="Trang trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={page >= leaderboardData.totalPages}
                  onClick={() => setPage((p) => Math.min(leaderboardData.totalPages, p + 1))}
                  className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
                  aria-label="Trang sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sticky Bottom Bar for Current User */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-blue-500/30 bg-slate-950/95 backdrop-blur-md px-4 py-3 shadow-2xl">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {currentUser ? (
            <div className="flex items-center gap-3 w-full justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  className="w-10 h-10 rounded-full border-2 border-blue-500 object-cover"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{currentUser.name}</span>
                    <span className="text-xs text-blue-400 font-bold">
                      {leaderboardData.currentUserRank
                        ? `Hạng #${leaderboardData.currentUserRank.rank}`
                        : 'Đang xếp hạng...'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Bạn đang có <span className="font-bold text-amber-400">{currentUser.totalXp} XP</span> • Chuỗi 🔥 {currentUser.streak} ngày
                  </p>
                </div>
              </div>

              <div className="hidden sm:block text-right text-xs">
                <span className="text-emerald-400 font-semibold">
                  Hoàn thành thêm bài tập để bứt phá lên Top đầu! 🚀
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
                <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  Bạn đang ở chế độ khách. Hãy ghi danh tên thật để xuất hiện trên Bảng Xếp Hạng và nhận ngay <strong className="text-amber-400">+50 XP</strong>!
                </span>
              </div>
              <button
                type="button"
                onClick={openLoginModal}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm transition-all cursor-pointer shrink-0 shadow-lg shadow-emerald-600/30 flex items-center gap-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>Ghi danh thi đấu ngay</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Player Detail Modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <img
                  src={selectedUser.avatar}
                  alt={selectedUser.name}
                  className="w-24 h-24 rounded-full border-4 border-blue-500/40 object-cover shadow-2xl"
                />
                <div className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-slate-950 border border-slate-700 text-xs font-black text-amber-400">
                  #{selectedUser.rank}
                </div>
              </div>

              <h3 className="mt-4 text-xl font-bold text-white">{selectedUser.name}</h3>
              {selectedUser.school && (
                <p className="text-xs text-blue-400 font-medium mt-0.5 flex items-center gap-1">
                  <School className="w-3.5 h-3.5" />
                  <span>{selectedUser.school}</span>
                </p>
              )}
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {selectedUser.email.replace(/(.{3})(.*)(@.*)/, '$1***$3')}
              </p>

              <div className="mt-2 flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getLevelBadge(selectedUser.level).bg}`}>
                  {getLevelBadge(selectedUser.level).label}
                </span>
                {selectedUser.isBot ? (
                  <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold">
                    🤖 Bot Đối Chuẩn HSG
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                    🟢 Người Dùng Thực Tế
                  </span>
                )}
              </div>

              {/* Stats Grid */}
              <div className="mt-6 w-full grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Tổng XP</span>
                  <span className="text-base font-black text-amber-400">{selectedUser.xp}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Chuỗi học</span>
                  <span className="text-base font-black text-orange-400">🔥 {selectedUser.streak} ngày</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Bài tập</span>
                  <span className="text-base font-black text-emerald-400">{selectedUser.solvedCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Bài học</span>
                  <span className="text-base font-black text-blue-400">{selectedUser.lessonsCount}</span>
                </div>
              </div>

              <div className="mt-6 w-full p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-200">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Huy hiệu đạt được:</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px]">
                    🎖️ Chiến Binh Thuật Toán
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]">
                    ⚡ Chăm Chỉ Liên Tục
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 text-[11px]">
                    💡 Bậc Thầy Debug
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
