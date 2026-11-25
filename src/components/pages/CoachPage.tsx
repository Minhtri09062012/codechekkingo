import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
} from 'recharts';
import { useApp } from '../../context/AppContext.tsx';
import { ProgressState, TOPIC_NAMES, ErrorEntry } from '../../core/types.ts';
import { getLessonTopicNo, getProblems, getLesson, getProblem } from '../../core/registry.ts';
import { SAMPLE_STUDENTS } from '../../data/sampleStudents.ts';
import { APP_NAME, EXPORT_PREFIX } from '../../core/brand.ts';
import {
  Users,
  User,
  Upload,
  Download,
  Award,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  Eye,
  Trash2,
  TrendingUp,
  FileSpreadsheet,
  X,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface StudentRecord {
  id: string;
  name: string;
  filename: string;
  progress: ProgressState;
  understoodCount: number;
  avgScore: number;
  errorCount: number;
  topicScores: Record<number, number>;
}

export const CoachPage: React.FC = () => {
  const { state } = useApp();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'name' | 'understood' | 'avgScore' | 'errors'>('avgScore');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Tính toán năng lực 11 chuyên đề cho một tiến độ
  const computeStudentTopicScores = (prog: ProgressState): Record<number, number> => {
    const understood = prog.understood || [];
    const solved = prog.solved || {};
    const placement = prog.placement;

    const scores: Record<number, number> = {};

    for (let t = 1; t <= 11; t++) {
      const understoodInTopic = understood.filter((id) => getLessonTopicNo(id) === t).length;
      const problemsInTopic = getProblems().filter((p) => p.topicNo === t);

      let probScoreSum = 0;
      let probCount = 0;
      for (const p of problemsInTopic) {
        if (solved[p.id]) {
          probScoreSum += solved[p.id].bestScore;
          probCount++;
        }
      }
      const avgProb = probCount > 0 ? probScoreSum / probCount : 0;

      let placementScore = 0;
      if (placement?.topicMastery) {
        const mastery = placement.topicMastery[t];
        if (mastery === 'mastered') placementScore = 90;
        else if (mastery === 'review') placementScore = 55;
        else placementScore = 20;
      }

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

      scores[t] = Math.min(100, Math.max(0, combined));
    }

    return scores;
  };

  // Tự động thêm học sinh hiện tại nếu chưa có học sinh nào
  React.useEffect(() => {
    if (students.length === 0 && (state.progress.understood.length > 0 || Object.keys(state.progress.solved).length > 0)) {
      const currentScores = computeStudentTopicScores(state.progress);
      const solvedList = Object.values(state.progress.solved || {});
      const avg =
        solvedList.length > 0
          ? Math.round(solvedList.reduce((acc, v) => acc + v.bestScore, 0) / solvedList.length)
          : 0;

      setStudents([
        {
          id: 'current-session-student',
          name: 'Học sinh hiện tại (Máy này)',
          filename: 'current_session.json',
          progress: state.progress,
          understoodCount: state.progress.understood.length,
          avgScore: avg,
          errorCount: state.progress.errorBook?.length || 0,
          topicScores: currentScores,
        },
      ]);
    }
  }, []);

  // Xử lý nạp nhiều file JSON
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newRecords: StudentRecord[] = [];

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content) as ProgressState;

          // Chuẩn hóa tên học sinh từ tên file
          let studentName = file.name.replace(/\.json$/i, '');
          studentName = studentName.replace(/[_-]/g, ' ');

          const understood = Array.isArray(parsed.understood) ? parsed.understood : [];
          const solved = parsed.solved || {};
          const solvedList = Object.values(solved);
          const avg =
            solvedList.length > 0
              ? Math.round(solvedList.reduce((acc, v) => acc + v.bestScore, 0) / solvedList.length)
              : 0;

          const topicScores = computeStudentTopicScores(parsed);

          const record: StudentRecord = {
            id: `${file.name}-${Date.now()}-${Math.random()}`,
            name: studentName,
            filename: file.name,
            progress: parsed,
            understoodCount: understood.length,
            avgScore: avg,
            errorCount: parsed.errorBook?.length || 0,
            topicScores,
          };

          setStudents((prev) => {
            // Loại bỏ nếu trùng file
            const filtered = prev.filter((p) => p.filename !== file.name);
            return [...filtered, record];
          });
        } catch (err) {
          console.error(`Không thể đọc file ${file.name}:`, err);
        }
      };
      reader.readAsText(file);
    });

    e.target.value = '';
  };

  // Đổi tên hiển thị học sinh
  const handleRenameStudent = (id: string, newName: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, name: newName } : s))
    );
  };

  // Xóa một học sinh
  const handleDeleteStudent = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    if (selectedStudentId === id) setSelectedStudentId(null);
  };

  // Sắp xếp danh sách
  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      let diff = 0;
      if (sortField === 'name') diff = a.name.localeCompare(b.name);
      else if (sortField === 'understood') diff = a.understoodCount - b.understoodCount;
      else if (sortField === 'avgScore') diff = a.avgScore - b.avgScore;
      else if (sortField === 'errors') diff = a.errorCount - b.errorCount;
      return sortAsc ? diff : -diff;
    });
  }, [students, sortField, sortAsc]);

  // Học sinh đang được chọn để xem chi tiết
  const selectedStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Dữ liệu Radar của học sinh được chọn
  const selectedRadarData = useMemo(() => {
    if (!selectedStudent) return [];
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((t) => ({
      topicNo: t,
      topicName: `CĐ ${t}`,
      fullName: TOPIC_NAMES[t],
      score: selectedStudent.topicScores[t] || 0,
    }));
  }, [selectedStudent]);

  // Xuất báo cáo CSV cả đội (UTF-8 BOM)
  const handleExportCSV = () => {
    if (students.length === 0) return;

    const titleRow = `"Báo cáo đội tuyển – ${APP_NAME} (${new Date().toLocaleDateString('vi-VN')})"`;
    const headers = [
      'Họ và tên',
      'Tên file',
      'Số bài đã hiểu',
      'Điểm TB bài tập',
      'Số lỗi đã mắc',
      ...Array.from({ length: 11 }, (_, i) => `CĐ ${i + 1} (${TOPIC_NAMES[i + 1]})`),
    ];

    const rows = students.map((s) => [
      `"${s.name}"`,
      `"${s.filename}"`,
      s.understoodCount,
      s.avgScore,
      s.errorCount,
      ...Array.from({ length: 11 }, (_, i) => s.topicScores[i + 1] || 0),
    ]);

    const csvContent = '\uFEFF' + [titleRow, headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${EXPORT_PREFIX}-baocao-doituyen-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Nạp trực tiếp 3 học sinh mẫu cho Huấn luyện viên
  const handleLoadSampleStudents = () => {
    const loaded: StudentRecord[] = SAMPLE_STUDENTS.map((sample) => {
      const parsed = sample.progress;
      const understood = parsed.understood || [];
      const solvedList = Object.values(parsed.solved || {});
      const avg =
        solvedList.length > 0
          ? Math.round(solvedList.reduce((acc, v) => acc + v.bestScore, 0) / solvedList.length)
          : 0;
      const topicScores = computeStudentTopicScores(parsed);

      return {
        id: `sample-${sample.filename}`,
        name: sample.name,
        filename: sample.filename,
        progress: parsed,
        understoodCount: understood.length,
        avgScore: avg,
        errorCount: parsed.errorBook?.length || 0,
        topicScores,
      };
    });

    setStudents(loaded);
    setSelectedStudentId(loaded[0].id);
  };

  // Tải 3 file JSON mẫu về máy học sinh/giáo viên
  const handleDownloadSampleFiles = () => {
    SAMPLE_STUDENTS.forEach((sample, idx) => {
      setTimeout(() => {
        const jsonStr = JSON.stringify(sample.progress, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = sample.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, idx * 200);
    });
  };

  return (
    <div className={`flex-1 flex flex-col ${state.classroomMode ? 'text-lg' : ''}`}>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-8">
        {/* Header Huấn luyện viên */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Dành cho Huấn luyện viên / Giáo viên bồi dưỡng
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {students.length} học sinh
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              Quản lý đội tuyển & So sánh năng lực học sinh
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Nhập nhiều file tiến độ JSON của các học sinh (hoàn toàn chạy ở trình duyệt, không cần server) để so sánh bảng năng lực 11 chuyên đề, xem sổ lỗi từng bạn và xuất báo cáo CSV.
            </p>
          </div>

          {/* Nút hành động */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button type="button"
              onClick={handleLoadSampleStudents}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              title="Nạp ngay 3 học sinh mẫu thực tế để thử nghiệm bảng so sánh"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Nạp 3 học sinh mẫu</span>
            </button>

            <button type="button"
              onClick={handleDownloadSampleFiles}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs sm:text-sm border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Tải 3 file JSON mẫu về máy để kiểm tra tính năng nạp file từ máy tính"
            >
              <Download className="w-4 h-4" />
              <span>Tải 3 JSON mẫu</span>
            </button>

            <label className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all flex items-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Nạp file JSON học sinh</span>
              <input
                type="file"
                multiple
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {students.length > 0 && (
              <button type="button"
                onClick={handleExportCSV}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Xuất CSV báo cáo</span>
              </button>
            )}
          </div>
        </div>

        {/* BẢNG SO SÁNH CẢ ĐỘI THEO 11 CHUYÊN ĐỀ */}
        {students.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-5">
            <Users className="w-12 h-12 text-slate-500 mx-auto" />
            <h3 className="text-base sm:text-lg font-bold text-slate-200">
              Chưa có dữ liệu học sinh nào
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Thầy cô hãy bấm nút <strong>"Nạp file JSON học sinh"</strong> để nạp các file tiến độ (.json) của học sinh, hoặc bấm nút dưới đây để nạp nhanh 3 học sinh mẫu:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button type="button"
                onClick={handleLoadSampleStudents}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Nạp ngay 3 học sinh mẫu</span>
              </button>
              <button type="button"
                onClick={handleDownloadSampleFiles}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Tải 3 file JSON mẫu về máy</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>Bảng so sánh năng lực toàn đội</span>
              </h2>
              <div className="text-xs text-slate-400">
                Bấm vào dòng học sinh để xem chi tiết hồ sơ & sổ lỗi
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80 text-slate-400 font-bold">
                      <th
                        className="py-3 px-3 cursor-pointer hover:text-white"
                        onClick={() => {
                          setSortField('name');
                          setSortAsc(!sortAsc);
                        }}
                      >
                        Học sinh
                      </th>
                      <th
                        className="py-3 px-3 cursor-pointer hover:text-white text-center"
                        onClick={() => {
                          setSortField('understood');
                          setSortAsc(!sortAsc);
                        }}
                      >
                        Bài hiểu
                      </th>
                      <th
                        className="py-3 px-3 cursor-pointer hover:text-white text-center"
                        onClick={() => {
                          setSortField('avgScore');
                          setSortAsc(!sortAsc);
                        }}
                      >
                        Điểm TB
                      </th>
                      <th
                        className="py-3 px-3 cursor-pointer hover:text-white text-center"
                        onClick={() => {
                          setSortField('errors');
                          setSortAsc(!sortAsc);
                        }}
                      >
                        Lỗi
                      </th>
                      {/* Cột 11 chuyên đề */}
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((t) => (
                        <th
                          key={t}
                          className="py-3 px-2 text-center font-mono text-[10px]"
                          title={`Chuyên đề ${t}: ${TOPIC_NAMES[t]}`}
                        >
                          CĐ {t}
                        </th>
                      ))}
                      <th className="py-3 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {sortedStudents.map((st) => (
                      <tr
                        key={st.id}
                        className={`hover:bg-slate-800/40 cursor-pointer transition-colors ${
                          selectedStudentId === st.id ? 'bg-blue-600/10 border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => setSelectedStudentId(st.id)}
                      >
                        <td className="py-3 px-3 font-sans font-bold text-slate-100 flex items-center gap-2">
                          <input
                            type="text"
                            value={st.name}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleRenameStudent(st.id, e.target.value)}
                            className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-blue-500 focus:bg-slate-950 px-1 py-0.5 rounded text-xs font-bold text-slate-100 focus:outline-none"
                            title="Bấm để sửa tên học sinh"
                          />
                        </td>
                        <td className="py-3 px-3 text-center text-blue-300">
                          {st.understoodCount} bài
                        </td>
                        <td className="py-3 px-3 text-center font-black">
                          <span
                            className={
                              st.avgScore >= 80
                                ? 'text-emerald-400'
                                : st.avgScore >= 50
                                ? 'text-amber-400'
                                : 'text-slate-400'
                            }
                          >
                            {st.avgScore}đ
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center text-rose-400">
                          {st.errorCount}
                        </td>

                        {/* Điểm từng chuyên đề */}
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((t) => {
                          const score = st.topicScores[t] || 0;
                          return (
                            <td key={t} className="py-3 px-2 text-center">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  score >= 80
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : score >= 50
                                    ? 'bg-amber-500/20 text-amber-300'
                                    : 'bg-slate-950/60 text-slate-500'
                                }`}
                              >
                                {score}
                              </span>
                            </td>
                          );
                        })}

                        <td className="py-3 px-3 text-right font-sans">
                          <div className="flex items-center justify-end gap-1.5">
                            <button type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudentId(st.id);
                              }}
                              className="p-1 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600/30"
                              title="Xem chi tiết hồ sơ"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteStudent(st.id);
                              }}
                              className="p-1 rounded-lg bg-rose-600/20 text-rose-300 hover:bg-rose-600/30"
                              title="Xóa học sinh này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODAL / PANEL CHI TIẾT HỌC SINH ĐƯỢC CHỌN */}
        {selectedStudent && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-100">
                    Hồ sơ chi tiết: {selectedStudent.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Tập tin: {selectedStudent.filename}
                  </p>
                </div>
              </div>

              <button type="button"
                onClick={() => setSelectedStudentId(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* RADAR NĂNG LỰC CỦA HỌC SINH */}
              <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="font-bold text-sm text-slate-200 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  <span>Biểu đồ radar năng lực</span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={selectedRadarData} outerRadius="75%">
                      <PolarGrid stroke="#334155" />
                      <PolarAngleAxis dataKey="topicName" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={{ fontSize: 9 }} />
                      <Radar
                        name="Năng lực"
                        dataKey="score"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.4}
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
              </div>

              {/* SỔ LỖI SAI (ERRORBOOK) CỦA HỌC SINH */}
              <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-slate-200 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-rose-400" />
                    <span>Sổ lỗi sai ({selectedStudent.progress.errorBook?.length || 0} lỗi)</span>
                  </div>
                </div>

                {(!selectedStudent.progress.errorBook || selectedStudent.progress.errorBook.length === 0) ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    Học sinh này chưa ghi nhận lỗi nào trong sổ lỗi.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selectedStudent.progress.errorBook.map((err, idx) => {
                      const prob = getProblem(err.sourceId);
                      const les = getLesson(err.sourceId);
                      const title = prob?.title || les?.title || err.sourceId;
                      const isFixed = (selectedStudent.progress.solved[err.sourceId]?.bestScore ?? 0) === 100;

                      return (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200">{title}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                                isFixed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {isFixed ? 'Đã khắc phục' : err.type}
                            </span>
                          </div>
                          <div className="text-slate-400 text-[11px] font-mono">
                            Test: {err.testLabel} · Ngày: {err.at ? new Date(err.at).toLocaleDateString('vi-VN') : '—'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CoachPage;
