import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { useApp } from '../../context/AppContext.tsx';
import { useAuth } from '../../context/AuthContext.tsx';
import { catalog } from '../../core/catalog.ts';
import { getProblems, getLessonTopicNo, getLesson } from '../../core/registry.ts';
import { TOPIC_NAMES } from '../../core/types.ts';
import { ProgressModal } from '../modals/ProgressModal.tsx';
import {
  User,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  FileJson,
  Layers,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  TrendingUp,
  Download,
  Upload,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { state } = useApp();
  const { user, openLoginModal } = useAuth();
  const [showProgressModal, setShowProgressModal] = useState<boolean>(false);

  const understood = state.progress.understood || [];
  const solved = state.progress.solved || {};
  const levels = state.progress.levels || {};
  const errorBook = state.progress.errorBook || [];
  const placement = state.progress.placement;

  // 1. Thống kê tổng quan
  const totalUnderstood = understood.length;
  const solvedList = Object.entries(solved);
  const totalSolved = solvedList.length;
  const avgScore =
    totalSolved > 0
      ? Math.round(solvedList.reduce((acc, [, v]) => acc + v.bestScore, 0) / totalSolved)
      : 0;

  // Tổng số lần xin gợi ý (hintLevel) và số lần thử (attempts)
  let totalHints = 0;
  let totalAttempts = 0;
  const levelUsageCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };

  for (const [key, val] of Object.entries(levels)) {
    const parts = key.split('|');
    const lvlNum = Number(parts[1]);
    if (lvlNum >= 1 && lvlNum <= 4) {
      levelUsageCounts[lvlNum] += (val.attempts > 0 ? 1 : 0);
    }
    totalHints += (val.hintLevel > 1 ? val.hintLevel - 1 : 0);
    totalAttempts += val.attempts;
  }

  // 2. Dữ liệu biểu đồ RADAR năng lực theo 11 chuyên đề
  const radarData = useMemo(() => {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((topicNo) => {
      // Đếm số bài đã hiểu thuộc chuyên đề
      const understoodInTopic = understood.filter((id) => getLessonTopicNo(id) === topicNo).length;

      // Tính điểm bài tập thuộc chuyên đề
      const problemsInTopic = getProblems().filter((p) => p.topicNo === topicNo);
      let probScoreSum = 0;
      let probCount = 0;
      for (const p of problemsInTopic) {
        if (solved[p.id]) {
          probScoreSum += solved[p.id].bestScore;
          probCount++;
        }
      }
      const avgProb = probCount > 0 ? probScoreSum / probCount : 0;

      // Điểm từ placement nếu có
      let placementScore = 0;
      if (placement?.topicMastery) {
        const mastery = placement.topicMastery[topicNo];
        if (mastery === 'mastered') placementScore = 90;
        else if (mastery === 'review') placementScore = 55;
        else placementScore = 20;
      }

      // Tổng hợp năng lực chuyên đề (thang 0-100)
      let combined = 0;
      if (placementScore > 0) {
        combined = Math.round(
          placementScore * 0.4 +
          Math.min(100, understoodInTopic * 25) * 0.3 +
          avgProb * 0.3
        );
      } else {
        combined = Math.round(
          Math.min(100, understoodInTopic * 35) * 0.5 +
          avgProb * 0.5
        );
      }

      // Đảm bảo trong khoảng 0-100
      combined = Math.min(100, Math.max(0, combined));

      return {
        topicNo,
        topicName: `CĐ ${topicNo}`,
        fullName: TOPIC_NAMES[topicNo],
        score: combined,
      };
    });
  }, [understood, solved, placement]);

  // 3. Phân bổ bài đã hiểu theo nhóm trong catalog
  const groupStats = useMemo(() => {
    const map = new Map<string, { total: number; done: number; kind: 'concept' | 'algorithm' }>();

    for (const entry of catalog) {
      const groupKey = `${entry.kind === 'concept' ? 'Khái niệm' : 'Thuật toán'}: ${entry.group}`;
      if (!map.has(groupKey)) {
        map.set(groupKey, { total: 0, done: 0, kind: entry.kind });
      }
      const g = map.get(groupKey)!;
      g.total++;
      if (understood.includes(entry.id)) {
        g.done++;
      }
    }

    return Array.from(map.entries()).map(([name, data]) => ({
      name,
      ...data,
      pct: Math.round((data.done / data.total) * 100),
    }));
  }, [understood]);

  // 4. Thống kê loại lỗi hay mắc nhất
  const errorStats = useMemo(() => {
    const counts: Record<string, number> = {
      'wrong-algorithm': 0,
      'wrong-edge': 0,
      'wrong-format': 0,
      timeout: 0,
      runtime: 0,
    };

    for (const e of errorBook) {
      if (counts[e.type] !== undefined) {
        counts[e.type]++;
      }
    }

    return [
      { name: 'Sai thuật toán', key: 'wrong-algorithm', count: counts['wrong-algorithm'], color: '#f43f5e' },
      { name: 'Sai trường hợp biên', key: 'wrong-edge', count: counts['wrong-edge'], color: '#f59e0b' },
      { name: 'Sai định dạng', key: 'wrong-format', count: counts['wrong-format'], color: '#3b82f6' },
      { name: 'Quá thời gian (TLE)', key: 'timeout', count: counts.timeout, color: '#a855f7' },
      { name: 'Lỗi thực thi (Runtime)', key: 'runtime', count: counts.runtime, color: '#ef4444' },
    ];
  }, [errorBook]);

  return (
    <div className={`flex-1 flex flex-col ${state.classroomMode ? 'text-lg' : ''}`}>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        {/* Header Hồ sơ */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Hồ sơ học sinh (Student Profile)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              Tổng quan năng lực & Tiến độ học tập
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Theo dõi sự tiến bộ qua 11 chuyên đề Tin học trẻ & HSG Tin, mức độ sử dụng cấp độ hỗ trợ và phân tích lỗi sai cá nhân.
            </p>
          </div>

          {/* Nút Xuất/Nhập JSON */}
          <div className="flex items-center gap-2.5">
            <button type="button"
              onClick={() => setShowProgressModal(true)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer"
            >
              <FileJson className="w-4 h-4" />
              <span>Xuất / Nhập JSON tiến độ</span>
            </button>
          </div>
        </div>

        {/* THẺ TÀI KHOẢN GOOGLE & XP HỆ THỐNG */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/30 border border-blue-500/30 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          {user ? (
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-16 h-16 rounded-full border-2 border-blue-400 object-cover shadow-lg"
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="text-lg font-bold text-white">{user.name}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    Đã liên kết Google
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">{user.email}</p>
                <div className="flex items-center justify-center sm:justify-start gap-3 pt-1 text-xs">
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 fill-amber-400" />
                    {user.totalXp} XP Toàn hệ thống
                  </span>
                  <span className="text-slate-600">•</span>
                  <span className="text-orange-400 font-bold">
                    🔥 Chuỗi {user.streak} ngày
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <User className="w-7 h-7" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-white">Chưa kết nối tài khoản Google</h3>
                <p className="text-xs text-slate-400 max-w-md">
                  Đăng nhập để đồng bộ tiến độ, lưu code trên đám mây và nhận ngay <strong className="text-amber-400">+50 XP</strong> ghi danh Bảng xếp hạng.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <Link
                to="/leaderboard"
                className="px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Award className="w-4 h-4 text-amber-400" />
                <span>Xem Bảng xếp hạng 🏆</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={openLoginModal}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-lg shadow-blue-600/30 cursor-pointer flex items-center gap-2"
              >
                <span>Đăng nhập Google</span>
              </button>
            )}
          </div>
        </div>

        {/* THẺ CHỈ SỐ TỔNG QUAN */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-1 shadow-lg">
            <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Bài đã hiểu</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-100 font-mono">
              {totalUnderstood} <span className="text-xs font-normal text-slate-500">bài</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-1 shadow-lg">
            <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Điểm TB bài tập</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {avgScore} <span className="text-xs font-normal text-slate-500">/ 100</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-1 shadow-lg">
            <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-amber-400" />
              <span>Số lần xin gợi ý</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
              {totalHints} <span className="text-xs font-normal text-slate-500">lần ({totalAttempts} lượt nộp)</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-1 shadow-lg">
            <div className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Lỗi trong sổ</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono">
              {errorBook.length} <span className="text-xs font-normal text-slate-500">lỗi</span>
            </div>
          </div>
        </div>

        {/* BIỂU ĐỒ RADAR NĂNG LỰC THEO 11 CHUYÊN ĐỀ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span>Biểu đồ Radar năng lực theo 11 chuyên đề</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Tính toán tích hợp từ bài đã hiểu, điểm bài tập và kết quả bài test thích ứng.
                </p>
              </div>
              <Link
                to="/placement"
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer border border-slate-700 flex items-center gap-1"
              >
                <span>Kiểm tra lại</span>
              </Link>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="75%">
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="topicName" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={{ fontSize: 9 }} />
                  <Radar
                    name="Năng lực"
                    dataKey="score"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.45}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    formatter={(val: any, _name: any, item: any) => [
                      `${val}/100 điểm (${item.payload.fullName})`,
                      'Năng lực',
                    ]}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Chú giải chuyên đề */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400">
              {radarData.map((d) => (
                <div key={d.topicNo} className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60">
                  <span className="truncate">{d.topicNo}. {d.fullName}</span>
                  <span className="font-mono font-bold text-blue-400 ml-1 shrink-0">{d.score}đ</span>
                </div>
              ))}
            </div>
          </div>

          {/* CỘT PHẢI: CẤP ĐỘ ĐÃ DÙNG VÀ PHÂN BỔ LOẠI LỖI */}
          <div className="lg:col-span-5 space-y-6">
            {/* Thống kê 4 cấp độ hỗ trợ đã dùng */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Cấp độ hỗ trợ đã trải nghiệm</span>
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  { lvl: 1, label: 'Cấp 1: Khái niệm & Đọc hiểu', desc: 'Đọc hiểu và trả lời câu hỏi lý thuyết', count: levelUsageCounts[1], color: 'bg-blue-500' },
                  { lvl: 2, label: 'Cấp 2: Dự đoán đầu ra', desc: 'Đọc code mẫu và dự đoán các biến số', count: levelUsageCounts[2], color: 'bg-emerald-500' },
                  { lvl: 3, label: 'Cấp 3: Giàn giáo khuyết', desc: 'Điền từ khóa và hoàn thiện từng chặng', count: levelUsageCounts[3], color: 'bg-amber-500' },
                  { lvl: 4, label: 'Cấp 4: Code độc lập', desc: 'Tự viết code hoàn chỉnh từ đầu', count: levelUsageCounts[4], color: 'bg-purple-500' },
                ].map((item) => (
                  <div key={item.lvl} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{item.label}</span>
                      <span className="font-mono text-slate-400 font-bold">{item.count} bài</span>
                    </div>
                    <p className="text-[11px] text-slate-500">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Phân bổ loại lỗi */}
            <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-xl">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Phân bổ loại lỗi hay gặp</span>
              </h3>

              <div className="space-y-2">
                {errorStats.map((item) => {
                  const pct = errorBook.length > 0 ? Math.round((item.count / errorBook.length) * 100) : 0;
                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300">{item.name}</span>
                        <span className="font-mono text-slate-400">{item.count} ({pct}%)</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* THỐNG KÊ TIẾN ĐỘ BÀI ĐÃ HIỂU THEO TỪNG NHÓM */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Tiến độ hoàn thành bài học theo từng nhóm</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {groupStats.map((g) => (
              <div
                key={g.name}
                className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 truncate pr-2">{g.name}</span>
                  <span className="font-mono text-slate-400 shrink-0">{g.done}/{g.total}</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${g.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BẢNG ĐIỂM CÁC BÀI TẬP ĐÃ GIẢI */}
        <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
          <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Bảng điểm các bài tập đã nộp ({totalSolved} bài)</span>
          </h3>

          {totalSolved === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Chưa có bài tập nào được nộp bài. Em hãy vào mục "Hiểu bài tập" hoặc "Luyện thi" để bắt đầu!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">Mã bài</th>
                    <th className="py-2.5 px-3">Điểm cao nhất</th>
                    <th className="py-2.5 px-3">Số lần nộp</th>
                    <th className="py-2.5 px-3">Lần nộp cuối</th>
                    <th className="py-2.5 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {solvedList.map(([probId, data]) => (
                    <tr key={probId} className="hover:bg-slate-950/40">
                      <td className="py-2.5 px-3 font-bold text-slate-200">{probId.toUpperCase()}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-black ${
                            data.bestScore === 100
                              ? 'text-emerald-400'
                              : data.bestScore > 0
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {data.bestScore}/100 đ
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{data.attempts} lần</td>
                      <td className="py-2.5 px-3 text-slate-500 font-sans text-[11px]">
                        {data.lastAt ? new Date(data.lastAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-sans">
                        <Link
                          to={`/problem/${probId}`}
                          className="px-3 py-1 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/30 text-xs font-bold"
                        >
                          Làm lại
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {showProgressModal && <ProgressModal onClose={() => setShowProgressModal(false)} />}
    </div>
  );
};

export default ProfilePage;
