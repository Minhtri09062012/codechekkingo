import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProblem, getLessonsOfProblem, createLearningSourceFromProblem, devWarnings } from '../../core/registry.ts';
import { Problem, LearningSource } from '../../core/types.ts';
import { routes } from '../../core/routes.ts';
import { UnderstandingPanel } from '../quiz/UnderstandingPanel.tsx';
import { ProblemAnalysisBlock } from '../problem/ProblemAnalysisBlock.tsx';
import { DiagnosticQuizModal } from '../problem/DiagnosticQuizModal.tsx';
import { useApp } from '../../context/AppContext.tsx';
import {
  ArrowLeft,
  BookOpen,
  FileCode,
  Layers,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  Cpu,
  Clock,
  Award,
  CheckCircle2,
  FileText,
  Lock,
} from 'lucide-react';

export const ProblemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { state } = useApp();

  const problem: Problem | undefined = useMemo(() => {
    if (!id) return undefined;
    return getProblem(id);
  }, [id]);

  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<1 | 2 | 3 | 4>(1);
  const [devSecurityLeak, setDevSecurityLeak] = useState<string | null>(null);

  useEffect(() => {
    setSelectedLevel(1);
    setDevSecurityLeak(null);
  }, [id]);

  // Tạo LearningSource từ Problem (chỉ chứa các lesson 'ready')
  const learningSource: LearningSource | null = useMemo(() => {
    if (!problem) return null;
    return createLearningSourceFromProblem(problem);
  }, [problem]);

  const readyLessons = useMemo(() => {
    if (!problem) return [];
    return getLessonsOfProblem(problem.id);
  }, [problem]);

  const problemWarnings = useMemo(() => {
    if (!problem) return [];
    return devWarnings.filter((w) => w.includes(`"${problem.id}"`));
  }, [problem]);

  // Quy tắc 4: Bảo mật đáp án - Quét DOM ở chế độ dev tìm chuỗi task.referenceSolution
  useEffect(() => {
    if (!problem?.task?.referenceSolution) return;
    const refCode = problem.task.referenceSolution.trim();
    if (refCode.length < 15) return;

    const timer = setTimeout(() => {
      const pageText = document.body.innerText;
      // Trích xuất 1 đoạn đặc trưng trong referenceSolution để kiểm tra xem có bị in ra DOM không
      const sampleSnippet = refCode.split('\n')[2]?.trim() || refCode.slice(0, 30);
      if (sampleSnippet.length > 8 && pageText.includes(sampleSnippet)) {
        setDevSecurityLeak(
          `[Bảo mật dev] Phát hiện task.referenceSolution của bài "${problem.id}" bị lộ trên giao diện HTML!`
        );
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [problem]);

  if (!problem || !learningSource) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <p className="text-sm text-slate-400">Không tìm thấy bài tập với mã: "{id}"</p>
        <Link
          to={routes.problem()}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
        >
          Quay lại danh sách bài tập
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col ${state.classroomMode ? 'text-lg' : ''}`}>
      {/* Dev Warning Banner nếu bài tập có trường bị tự sửa */}
      {problemWarnings.length > 0 && (
        <div className="bg-amber-950/90 border-b border-amber-500 p-3 px-6 text-xs text-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{problemWarnings.join(' | ')}</span>
        </div>
      )}

      {/* Dev Security Banner nếu vô tình lộ referenceSolution */}
      {devSecurityLeak && (
        <div className="bg-rose-950/90 border-b border-rose-500 p-3 px-6 text-xs text-rose-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{devSecurityLeak}</span>
        </div>
      )}

      {/* CỘT CHÍNH NẰM GIỮA MÀN HÌNH (RỘNG TỐI ĐA ~900px) */}
      <main className="flex-1 max-w-[900px] mx-auto w-full px-4 sm:px-6 py-6 pb-20 space-y-8">
        {/* Thanh điều hướng quay lại & Nhãn bài tập */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs">
          <Link
            to={routes.problem()}
            className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Danh sách bài tập</span>
          </Link>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Chuyên đề #{problem.topicNo}</span>
            <span className="text-slate-600">·</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
              Mức {problem.level}
            </span>
            {readyLessons.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium">
                Có {readyLessons.length} bài mô phỏng
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[11px]">
                Chưa có mô phỏng
              </span>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* MỤC A: ĐỀ BÀI ĐẦY ĐỦ (Statement, Định dạng I/O, Ràng buộc, Ví dụ, Subtasks) */}
        {/* ============================================================ */}
        <section className="p-5 sm:p-7 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-xl">
          <div className="space-y-1">
            <div className="text-xs font-mono text-purple-400 font-semibold uppercase tracking-wider">
              {problem.source || 'Đề thi Tin học trẻ / HSG Tin'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              {problem.title}
            </h1>
            {problem.task.ioMode.kind === 'file' && (
              <div className="flex items-center gap-3 pt-1 text-xs font-mono text-blue-300">
                <span>File vào: <strong className="text-slate-200">{problem.task.ioMode.inputFile}</strong></span>
                <span className="text-slate-600">|</span>
                <span>File ra: <strong className="text-slate-200">{problem.task.ioMode.outputFile}</strong></span>
              </div>
            )}
          </div>

          {/* Đề bài */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              Đề bài:
            </h2>
            <p className="text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-line">
              {problem.task.statement}
            </p>
          </div>

          {/* Định dạng vào và ra */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="font-bold text-blue-300 uppercase tracking-wider">Dữ liệu vào (Input):</span>
              <p className="text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                {problem.task.inputFormat}
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
              <span className="font-bold text-emerald-300 uppercase tracking-wider">Kết quả (Output):</span>
              <p className="text-slate-300 leading-relaxed font-sans whitespace-pre-line">
                {problem.task.outputFormat}
              </p>
            </div>
          </div>

          {/* Ràng buộc & Giới hạn */}
          {problem.task.constraints && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1 font-mono">
              <span className="font-bold text-amber-400 uppercase tracking-wider">Ràng buộc & Giới hạn thời gian:</span>
              <p className="text-slate-300">{problem.task.constraints}</p>
            </div>
          )}

          {/* Bảng Ví dụ */}
          {problem.task.examples.length > 0 && (
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider">Ví dụ minh họa:</span>
              <div className="space-y-2">
                {problem.task.examples.map((ex, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500">Đầu vào:</span>
                        <pre className="p-2 rounded-lg bg-slate-900 text-blue-300 overflow-x-auto text-xs mt-1">
                          {ex.input}
                        </pre>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">Đầu ra:</span>
                        <pre className="p-2 rounded-lg bg-slate-900 text-emerald-300 overflow-x-auto text-xs mt-1">
                          {ex.output}
                        </pre>
                      </div>
                    </div>
                    {ex.note && (
                      <div className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-900">
                        Giải thích: {ex.note}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phân nhóm Subtasks */}
          {problem.task.subtasks && problem.task.subtasks.length > 0 && (
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-purple-400" />
                Các nhóm điểm (Subtasks):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {problem.task.subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">Subtask #{st.id}</span>
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-bold">
                        {st.points} điểm
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{st.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ============================================================ */}
        {/* MỤC B: NÚT "CHẨN ĐOÁN CẤP ĐỘ NĂNG LỰC (3 CÂU)" */}
        {/* ============================================================ */}
        <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-slate-900/60 border border-blue-500/30 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1 max-w-lg">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Em chưa chắc mình nên bắt đầu từ cấp độ nào?
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Làm nhanh bài kiểm tra chẩn đoán 3 câu để hệ thống đánh giá mức độ hiểu bài và gợi ý cấp độ hỗ trợ thích hợp nhất.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDiagnosticModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs sm:text-sm hover:bg-blue-500 shadow-md shadow-blue-600/30 cursor-pointer active:scale-95 transition-all"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Làm bài chẩn đoán 3 câu</span>
          </button>
        </section>

        {/* ============================================================ */}
        {/* MỤC D: PHÂN TÍCH ĐỀ (BẮT BUỘC TRƯỚC KHI MỞ KHÓA VIẾT CODE) */}
        {/* ============================================================ */}
        <section>
          <ProblemAnalysisBlock problem={problem} />
        </section>

        {/* ============================================================ */}
        {/* MỤC C: UNDERSTANDING PANEL (HỖ TRỢ 4 CẤP ĐỘ THEO RUBRIC & MÔ PHỎNG) */}
        {/* ============================================================ */}
        <section id="problem-understanding-section" className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              Luyện tập các cấp độ hiểu bài
            </h2>
            {readyLessons.length === 0 && (
              <span className="text-xs text-amber-400 font-medium">
                (Bài chưa có mô phỏng: Cấp 2 và Cấp 4 sẽ bị làm mờ)
              </span>
            )}
          </div>

          <UnderstandingPanel
            source={learningSource}
            selectedLevel={selectedLevel}
            onSelectLevel={setSelectedLevel}
          />
        </section>

        {/* Modal chẩn đoán 3 câu */}
        {showDiagnosticModal && (
          <DiagnosticQuizModal
            problem={problem}
            onSelectLevel={(lvl) => {
              const canUseSim = readyLessons.length > 0;
              const targetLvl: 1 | 2 | 3 | 4 =
                !canUseSim && (lvl === 2 || lvl === 4) ? 3 : lvl;
              setSelectedLevel(targetLvl);
              const el = document.getElementById('problem-understanding-section');
              if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            onClose={() => setShowDiagnosticModal(false)}
          />
        )}
      </main>
    </div>
  );
};
