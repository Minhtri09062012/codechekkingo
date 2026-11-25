import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import { oneDark } from '@codemirror/theme-one-dark';
import { useApp } from '../../context/AppContext.tsx';
import { Problem, TOPIC_NAMES, TestCase } from '../../core/types.ts';
import { registerSessionProblem } from '../../core/registry.ts';
import { runPythonTest } from '../../runner/pyRunner.ts';
import { normalizeOutput } from '../../runner/testSuite.ts';
import {
  FileCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Save,
  Download,
  FileJson,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

const sampleProblemJson: Problem = {
  id: 'tongday',
  title: 'Tính tổng dãy số (TONGDAY)',
  topicNo: 1,
  level: 'A',
  source: 'Đề thi Tin học trẻ',
  tags: ['Mảng', 'Duyệt mảng', 'Tính tổng'],
  task: {
    kind: 'code',
    statement: 'Cho một dãy số nguyên gồm N phần tử A_1, A_2, ..., A_N. Hãy tính tổng tất cả các phần tử trong dãy.',
    inputFormat: 'Dòng 1: Số nguyên N (1 <= N <= 10^5).\\nDòng 2: N số nguyên cách nhau bởi khoảng trắng.',
    outputFormat: 'In ra một số nguyên duy nhất là tổng của dãy số.',
    constraints: '1 <= N <= 10^5; |A_i| <= 10^9',
    ioMode: { kind: 'stdio' },
    examples: [
      {
        input: '4\n1 2 3 4',
        output: '10',
        note: '1 + 2 + 3 + 4 = 10',
      },
    ],
    tests: [
      { input: '4\n1 2 3 4', output: '10', label: 'Ví dụ mẫu', isPublic: true, subtask: 1 },
      { input: '1\n0', output: '0', label: 'Biên 1 phần tử là 0', isPublic: true, subtask: 1 },
      { input: '3\n-5 -2 -1', output: '-8', label: 'Biên toàn số âm', isPublic: false, subtask: 2 },
      { input: '5\n10 20 30 40 50', output: '150', label: 'Dãy số dương lớn', isPublic: false, subtask: 2 },
    ],
    starterCode: `# Đọc N và dãy A từ stdin, tính tổng và in ra\nimport sys\n\ndef solve():\n    pass\n\nif __name__ == '__main__':\n    solve()\n`,
    referenceSolution: `import sys\n\ndef solve():\n    data = sys.stdin.read().split()\n    if not data:\n        return\n    n = int(data[0])\n    arr = [int(x) for x in data[1:1+n]]\n    print(sum(arr))\n\nif __name__ == '__main__':\n    solve()\n`,
    analysis: {
      maxN: 'N <= 10^5',
      expectedComplexities: ['O(N) thời gian', 'O(1) bộ nhớ'],
    },
    subtasks: [
      { id: 1, points: 50, description: 'N <= 1000' },
      { id: 2, points: 50, description: 'N <= 10^5' },
    ],
  },
  rubric: {
    keyIdeas: [
      {
        id: 'idea-read-input',
        description: 'Đọc toàn bộ dữ liệu qua sys.stdin.read()',
        keywords: ['sys.stdin.read', 'split'],
      },
      {
        id: 'idea-sum-array',
        description: 'Tính tổng các phần tử trong danh sách',
        keywords: ['sum', 'tính tổng'],
      },
    ],
    commonMistakes: ['Quên chuyển đổi xâu sang số nguyên int()', 'Tràn bộ nhớ do đọc từng dòng quá chậm'],
    hintsByIdea: {
      'idea-read-input': [
        'Bậc 1: Sử dụng sys.stdin.read().split() để đọc nhanh.',
        'Bậc 2: Chuyển các phần tử sang kiểu int.',
        'Bậc 3: Lấy mảng arr = [int(x) for x in data[1:1+n]].',
        'Bậc 4: data = sys.stdin.read().split()\narr = [int(x) for x in data[1:1+int(data[0])]]',
      ],
      'idea-sum-array': [
        'Bậc 1: Dùng hàm sum() tích hợp sẵn của Python.',
        'Bậc 2: print(sum(arr)).',
        'Bậc 3: print(sum(arr)).',
        'Bậc 4: print(sum(arr))',
      ],
    },
  },
  lessonIds: [],
  simPresets: [],
};

export const ImportProblemPage: React.FC = () => {
  const { state } = useApp();
  const navigate = useNavigate();

  const [inputMode, setInputMode] = useState<'json' | 'form'>('json');
  const [jsonText, setJsonText] = useState<string>(
    JSON.stringify(sampleProblemJson, null, 2)
  );

  // Các preset thử nghiệm kiểm định
  const loadPreset = (type: 'valid' | 'missing-tests' | 'wrong-output' | 'runtime' | 'json-syntax') => {
    setValidationResult(null);
    setSavedToSession(false);

    if (type === 'valid') {
      setJsonText(JSON.stringify(sampleProblemJson, null, 2));
    } else if (type === 'missing-tests') {
      const invalid = {
        ...sampleProblemJson,
        id: 'loi-thieu-test',
        title: 'Đề bài lỗi: Chỉ có 1 test (Thiếu test)',
        task: {
          ...sampleProblemJson.task,
          tests: [
            { input: '4\n1 2 3 4', output: '10', label: 'Test duy nhất', isPublic: true },
          ],
        },
      };
      setJsonText(JSON.stringify(invalid, null, 2));
    } else if (type === 'wrong-output') {
      const invalid = {
        ...sampleProblemJson,
        id: 'loi-dap-an',
        title: 'Đề bài lỗi: ReferenceSolution in sai kết quả',
        task: {
          ...sampleProblemJson.task,
          referenceSolution: `import sys\n\ndef solve():\n    data = sys.stdin.read().split()\n    if not data:\n        return\n    # LỖI CỐ Ý: In sai kết quả gấp đôi\n    n = int(data[0])\n    arr = [int(x) for x in data[1:1+n]]\n    print(sum(arr) * 2)\n\nif __name__ == '__main__':\n    solve()\n`,
        },
      };
      setJsonText(JSON.stringify(invalid, null, 2));
    } else if (type === 'runtime') {
      const invalid = {
        ...sampleProblemJson,
        id: 'loi-runtime',
        title: 'Đề bài lỗi: Code chuẩn bị ZeroDivisionError',
        task: {
          ...sampleProblemJson.task,
          referenceSolution: `import sys\n\ndef solve():\n    # LỖI CỐ Ý: Phép chia cho 0\n    x = 10 / 0\n    print(x)\n\nif __name__ == '__main__':\n    solve()\n`,
        },
      };
      setJsonText(JSON.stringify(invalid, null, 2));
    } else if (type === 'json-syntax') {
      setJsonText(`{\n  "id": "loi-cu-phap",\n  "title": "Lỗi thiếu dấu ngoặc nhọn kết thúc"\n  "task": { "tests": [] }\n`);
    }
  };

  // Form State
  const [formId, setFormId] = useState('tongday');
  const [formTitle, setFormTitle] = useState('Tính tổng dãy số (TONGDAY)');
  const [formTopicNo, setFormTopicNo] = useState(1);
  const [formLevel, setFormLevel] = useState<'A' | 'B' | 'C' | 'HSG'>('A');
  const [formSource, setFormSource] = useState('Đề thi Tin học trẻ');
  const [formTags, setFormTags] = useState('Mảng, Duyệt mảng, Tính tổng');
  const [formStatement, setFormStatement] = useState(
    'Cho một dãy số nguyên gồm N phần tử A_1, A_2, ..., A_N. Hãy tính tổng tất cả các phần tử trong dãy.'
  );
  const [formInputFormat, setFormInputFormat] = useState(
    'Dòng 1: Số nguyên N (1 <= N <= 10^5).\nDòng 2: N số nguyên cách nhau bởi khoảng trắng.'
  );
  const [formOutputFormat, setFormOutputFormat] = useState(
    'In ra một số nguyên duy nhất là tổng của dãy số.'
  );
  const [formConstraints, setFormConstraints] = useState('1 <= N <= 10^5; |A_i| <= 10^9');
  const [formStarterCode, setFormStarterCode] = useState(
    '# Đọc N và dãy A từ stdin, tính tổng và in ra\nimport sys\n\ndef solve():\n    pass\n\nif __name__ == "__main__":\n    solve()\n'
  );
  const [formRefSolution, setFormRefSolution] = useState(
    'import sys\n\ndef solve():\n    data = sys.stdin.read().split()\n    if not data:\n        return\n    n = int(data[0])\n    arr = [int(x) for x in data[1:1+n]]\n    print(sum(arr))\n\nif __name__ == "__main__":\n    solve()\n'
  );

  // Tests
  const [tests, setTests] = useState<TestCase[]>([
    { input: '4\n1 2 3 4', output: '10', label: 'Ví dụ mẫu', isPublic: true, subtask: 1 },
    { input: '1\n0', output: '0', label: 'Biên 1 phần tử là 0', isPublic: true, subtask: 1 },
    { input: '3\n-5 -2 -1', output: '-8', label: 'Biên toàn số âm', isPublic: false, subtask: 2 },
    { input: '5\n10 20 30 40 50', output: '150', label: 'Dãy số dương lớn', isPublic: false, subtask: 2 },
  ]);

  // Trạng thái kiểm tra Pyodide
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<{
    success: boolean;
    problemObj?: Problem;
    errorMsg?: string;
    details?: string[];
  } | null>(null);

  const [savedToSession, setSavedToSession] = useState<boolean>(false);

  // Tạo đối tượng Problem từ Form
  const buildProblemFromForm = (): Problem => {
    return {
      id: formId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''),
      title: formTitle.trim(),
      topicNo: formTopicNo,
      level: formLevel,
      source: formSource.trim(),
      tags: formTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .filter((t) => !t.toUpperCase().includes('HSG')),
      task: {
        kind: 'code',
        statement: formStatement,
        inputFormat: formInputFormat,
        outputFormat: formOutputFormat,
        constraints: formConstraints,
        ioMode: { kind: 'stdio' },
        examples: tests.slice(0, 1).map((t) => ({
          input: t.input,
          output: t.output,
          note: t.label,
        })),
        tests,
        starterCode: formStarterCode,
        referenceSolution: formRefSolution,
        analysis: {
          maxN: '10^5',
          expectedComplexities: ['O(N)'],
        },
        subtasks: [
          { id: 1, points: 50, description: 'Subtask 1' },
          { id: 2, points: 50, description: 'Subtask 2' },
        ],
      },
      rubric: {
        keyIdeas: [
          { id: 'idea-1', description: 'Đọc dữ liệu và xử lý', keywords: ['input', 'solve'] },
        ],
        commonMistakes: [],
        hintsByIdea: {
          'idea-1': ['Gợi ý bậc 1', 'Gợi ý bậc 2', 'Gợi ý bậc 3', 'Gợi ý bậc 4'],
        },
      },
      lessonIds: [],
      simPresets: [],
    };
  };

  // Kiểm tra tính hợp lệ & Chạy kiểm thử Pyodide
  const handleValidateAndTest = async () => {
    setIsValidating(true);
    setValidationResult(null);
    setSavedToSession(false);

    try {
      let prob: Problem;

      if (inputMode === 'json') {
        try {
          prob = JSON.parse(jsonText);
        } catch (e: any) {
          setValidationResult({
            success: false,
            errorMsg: `Lỗi cú pháp JSON: ${e.message}`,
          });
          return;
        }
      } else {
        prob = buildProblemFromForm();
      }

      // Kiểm tra các trường bắt buộc
      const missingFields: string[] = [];
      if (!prob.id) missingFields.push('id');
      if (!prob.title) missingFields.push('title');
      if (!prob.task?.statement) missingFields.push('task.statement');
      if (!prob.task?.inputFormat) missingFields.push('task.inputFormat');
      if (!prob.task?.outputFormat) missingFields.push('task.outputFormat');
      if (!prob.task?.referenceSolution) missingFields.push('task.referenceSolution');

      if (!Array.isArray(prob.task?.tests) || prob.task.tests.length < 3) {
        missingFields.push('task.tests (cần tối thiểu >= 3 tests gồm ví dụ, biên, ngẫu nhiên)');
      }

      if (missingFields.length > 0) {
        setValidationResult({
          success: false,
          errorMsg: `Thiếu các trường bắt buộc: ${missingFields.join(', ')}`,
        });
        return;
      }

      // CHẠY KIỂM THỬ THỰC TẾ REFERENCE SOLUTION BẰNG PYODIDE
      const testCases = prob.task.tests;
      const refCode = prob.task.referenceSolution;
      const details: string[] = [];

      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const res = await runPythonTest(
          refCode,
          tc.input,
          prob.task.ioMode,
          prob.task.timeLimitSec || 3
        );

        if (res.status !== 'ok') {
          setValidationResult({
            success: false,
            errorMsg: `Lỗi khi chạy referenceSolution ở Test #${i + 1} (${tc.label || 'Test'}): ${
              res.error?.errorType || res.status
            }`,
            details: [res.error?.message || ''],
          });
          return;
        }

        const normActual = normalizeOutput(res.output);
        const normExpected = normalizeOutput(tc.output);

        if (normActual !== normExpected) {
          setValidationResult({
            success: false,
            errorMsg: `ReferenceSolution cho ra kết quả khác với đáp án ở Test #${i + 1} (${tc.label || 'Test'})!`,
            details: [
              `Input: ${tc.input.replace(/\n/g, ' ')}`,
              `Kết quả code chuẩn ra: "${normActual}"`,
              `Đáp án mong muốn: "${normExpected}"`,
            ],
          });
          return;
        }

        details.push(`✓ Test #${i + 1} (${tc.label || 'Test'}): Khớp hoàn toàn (${res.elapsedMs}ms)`);
      }

      // Thành công hoàn toàn
      setValidationResult({
        success: true,
        problemObj: prob,
        details,
      });
    } catch (err: any) {
      setValidationResult({
        success: false,
        errorMsg: `Lỗi bất ngờ trong quá trình kiểm tra: ${err?.message || err}`,
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Lưu vào bộ nhớ phiên
  const handleSaveToSession = () => {
    if (!validationResult?.problemObj) return;
    registerSessionProblem(validationResult.problemObj);
    setSavedToSession(true);
  };

  // Xuất file TypeScript .ts
  const handleExportTSFile = () => {
    if (!validationResult?.problemObj) return;
    const p = validationResult.problemObj;

    const fileContent = `import { Problem } from '../core/types.ts';

export const problem: Problem = ${JSON.stringify(p, null, 2)};

export default problem;
`;

    const blob = new Blob([fileContent], { type: 'text/typescript;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${p.id}.ts`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex-1 flex flex-col ${state.classroomMode ? 'text-lg' : ''}`}>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Header Nhập đề */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" />
                Công cụ Nhập đề & Kiểm định tự động
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              Thêm bài tập mới & Xuất mã nguồn TypeScript
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Dán JSON chuẩn hoặc điền form trực quan. Hệ thống sẽ tự động dùng Pyodide chạy mã chuẩn <code className="text-blue-300">referenceSolution</code> trên toàn bộ test để đảm bảo đề bài hoàn hảo không lỗi trước khi lưu vào phiên hoặc xuất file.
            </p>
          </div>

          {/* Chọn chế độ nhập */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button type="button"
              onClick={() => setInputMode('json')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                inputMode === 'json' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dán JSON
            </button>
            <button type="button"
              onClick={() => setInputMode('form')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                inputMode === 'form' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Điền biểu mẫu
            </button>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CHẾ ĐỘ 1: DÁN JSON */}
        {/* ============================================================ */}
        {inputMode === 'json' && (
          <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-bold text-slate-200">Mã JSON Problem (Tuân thủ hợp đồng src/core/types.ts):</span>
              
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-slate-400 mr-1">Thử nghiệm nhanh:</span>
                <button type="button"
                  onClick={() => loadPreset('valid')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold cursor-pointer"
                  title="Đề chuẩn đầy đủ tests, code chuẩn chạy đúng 100%"
                >
                  ✓ Đề chuẩn (Hợp lệ)
                </button>
                <button type="button"
                  onClick={() => loadPreset('missing-tests')}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold cursor-pointer"
                  title="Chỉ có 1 test, vi phạm quy tắc cần >= 3 tests"
                >
                  ⚠ Thiếu test
                </button>
                <button type="button"
                  onClick={() => loadPreset('wrong-output')}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-semibold cursor-pointer"
                  title="ReferenceSolution in ra sai kết quả so với đáp án test"
                >
                  ⚠ Code sai đáp án
                </button>
                <button type="button"
                  onClick={() => loadPreset('runtime')}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-semibold cursor-pointer"
                  title="ReferenceSolution bị lỗi ZeroDivisionError khi chạy"
                >
                  ⚠ Lỗi Runtime
                </button>
                <button type="button"
                  onClick={() => loadPreset('json-syntax')}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-semibold cursor-pointer"
                  title="Cú pháp JSON bị hỏng, thiếu dấu đóng ngoặc"
                >
                  ⚠ Cú pháp JSON
                </button>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden border border-slate-800 shadow-inner">
              <CodeMirror
                value={jsonText}
                height="360px"
                theme={oneDark}
                extensions={[]}
                onChange={(val) => setJsonText(val)}
              />
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* CHẾ ĐỘ 2: ĐIỀN BIỂU MẪU */}
        {/* ============================================================ */}
        {inputMode === 'form' && (
          <div className="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-5 shadow-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Mã bài (ID không dấu):</label>
                <input
                  type="text"
                  value={formId}
                  onChange={(e) => setFormId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Tiêu đề bài:</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Chuyên đề (1-11):</label>
                <select
                  value={formTopicNo}
                  onChange={(e) => setFormTopicNo(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((no) => (
                    <option key={no} value={no}>
                      #{no}: {TOPIC_NAMES[no]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Mức độ:</label>
                <select
                  value={formLevel}
                  onChange={(e) => setFormLevel(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200"
                >
                  <option value="A">Bảng A (Cơ bản)</option>
                  <option value="B">Bảng B (Trung cấp)</option>
                  <option value="C">Bảng C (Nâng cao)</option>
                  <option value="HSG">Đội tuyển HSG</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-300">Nội dung đề bài (Statement):</label>
              <textarea
                value={formStatement}
                onChange={(e) => setFormStatement(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Định dạng đầu vào:</label>
                <input
                  type="text"
                  value={formInputFormat}
                  onChange={(e) => setFormInputFormat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Định dạng đầu ra:</label>
                <input
                  type="text"
                  value={formOutputFormat}
                  onChange={(e) => setFormOutputFormat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200"
                />
              </div>
            </div>

            {/* Reference Solution Code */}
            <div className="space-y-1.5 text-xs">
              <label className="font-bold text-slate-300">
                Code chuẩn tham chiếu (referenceSolution - Dùng để chấm, không hiển thị cho học sinh):
              </label>
              <div className="rounded-xl overflow-hidden border border-slate-700">
                <CodeMirror
                  value={formRefSolution}
                  height="160px"
                  theme={oneDark}
                  extensions={[python()]}
                  onChange={(val) => setFormRefSolution(val)}
                />
              </div>
            </div>
          </div>
        )}

        {/* NÚT KIỂM ĐỊNH HỢP LỆ VÀ CHẠY THỬ PYODIDE */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button type="button"
            onClick={handleValidateAndTest}
            disabled={isValidating}
            className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 cursor-pointer"
          >
            {isValidating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Đang kiểm tra & chạy Pyodide...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Kiểm tra hợp lệ & Chạy thử Pyodide</span>
              </>
            )}
          </button>
        </div>

        {/* KẾT QUẢ KIỂM ĐỊNH */}
        {validationResult && (
          <div
            className={`p-6 rounded-3xl border space-y-4 shadow-xl ${
              validationResult.success
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-3">
              {validationResult.success ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
              )}
              <div>
                <h3 className="font-bold text-base">
                  {validationResult.success
                    ? 'Kiểm định thành công 100%! Đề bài và code chuẩn hợp lệ tuyệt đối.'
                    : 'Kiểm định thất bại! Cần chỉnh sửa lại đề hoặc code chuẩn.'}
                </h3>
                {validationResult.errorMsg && (
                  <p className="text-xs text-rose-300 mt-1 font-mono">
                    {validationResult.errorMsg}
                  </p>
                )}
              </div>
            </div>

            {/* Chi tiết từng test */}
            {validationResult.details && validationResult.details.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1 text-xs font-mono">
                {validationResult.details.map((d, idx) => (
                  <div key={idx} className="text-slate-300">
                    {d}
                  </div>
                ))}
              </div>
            )}

            {/* CÁC THAO TÁC KHI HỢP LỆ */}
            {validationResult.success && validationResult.problemObj && (
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button type="button"
                  onClick={handleSaveToSession}
                  disabled={savedToSession}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{savedToSession ? 'Đã lưu vào bộ nhớ phiên!' : 'Lưu vào bộ nhớ phiên'}</span>
                </button>

                {savedToSession && (
                  <Link
                    to={`/problem/${validationResult.problemObj.id}`}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all flex items-center gap-2"
                  >
                    <span>Làm bài ngay tại /problem/{validationResult.problemObj.id}</span>
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}

                <button type="button"
                  onClick={handleExportTSFile}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs sm:text-sm border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-blue-400" />
                  <span>Xuất file {validationResult.problemObj.id}.ts</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ImportProblemPage;
