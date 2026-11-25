// Mã nguồn chạy bên trong Web Worker của Pyodide
// Nạp Pyodide qua CDN jsDelivr v0.26.4

const PY_FORMAT_HELPER = String.raw`
def _format_user_error(e, filename='<stdin>'):
    if isinstance(e, SyntaxError):
        lines = [f'  File "{filename}", line {e.lineno or 1}']
        if e.text:
            txt = e.text.rstrip('\r\n')
            lines.append(f'    {txt}')
            if e.offset and e.offset > 0:
                lines.append('    ' + (' ' * (e.offset - 1)) + '^')
        lines.append(f'{type(e).__name__}: {e.msg}')
        return '\n'.join(lines)
    tb_list = traceback.extract_tb(e.__traceback__)
    user_frames = [f for f in tb_list if f.filename in ('solution.py', '<stdin>', '<user_code>')]
    lines = []
    for f in user_frames:
        lines.append(f'  File "{f.filename}", line {f.lineno}, in {f.name}')
        if f.line:
            lines.append(f'    {f.line}')
    lines.append(f'{type(e).__name__}: {str(e)}')
    return '\n'.join(lines)
`;

const RUNNER_FILE_PY = String.raw`
import sys, io, os, json, traceback
${PY_FORMAT_HELPER}

# Ghi input vào virtual file
with open(__input_file__, 'w', encoding='utf-8') as f:
    f.write(__test_input__)

# Xóa output cũ nếu có
if os.path.exists(__output_file__):
    try:
        os.remove(__output_file__)
    except Exception:
        pass

_stdout_buf = io.StringIO()
sys.stdout = _stdout_buf
sys.stderr = _stdout_buf

_clean_globals = {
    '__name__': '__main__',
    '__file__': 'solution.py'
}

_err_msg = None
_result_out = ''
try:
    _code_obj = compile(__user_code__, 'solution.py', 'exec')
    exec(_code_obj, _clean_globals)
    if not os.path.exists(__output_file__):
        raise FileNotFoundError(f"Không tìm thấy tệp đầu ra '{__output_file__}'. Hãy đảm bảo code ghi kết quả vào đúng tên tệp quy định.")
    with open(__output_file__, 'r', encoding='utf-8') as f:
        _result_out = f.read()
    if len(_result_out) > __max_output_len__:
        _result_out = _result_out[:__max_output_len__] + "\n... [Đầu ra bị cắt bớt do quá dài]"
except BaseException as e:
    _err_msg = _format_user_error(e, 'solution.py')

json.dumps({
    "ok": _err_msg is None,
    "output": _result_out,
    "error": _err_msg
}, ensure_ascii=False)
`;

const RUNNER_STDIO_PY = String.raw`
import sys, io, builtins, json, traceback
${PY_FORMAT_HELPER}

_in_stream = io.StringIO(__test_input__)
def _mock_input(prompt=''):
    if prompt:
        _out_stream.write(str(prompt))
    line = _in_stream.readline()
    if not line:
        raise EOFError("EOF when reading a line")
    return line.rstrip('\r\n')

sys.stdin = _in_stream
builtins.input = _mock_input
_out_stream = io.StringIO()
sys.stdout = _out_stream
sys.stderr = _out_stream

_clean_globals = {
    '__name__': '__main__',
    '__file__': '<stdin>'
}

_err_msg = None
_result_out = ''
try:
    _code_obj = compile(__user_code__, '<stdin>', 'exec')
    exec(_code_obj, _clean_globals)
    _result_out = _out_stream.getvalue()
    if len(_result_out) > __max_output_len__:
        _result_out = _result_out[:__max_output_len__] + "\n... [Đầu ra bị cắt bớt do quá dài]"
except BaseException as e:
    _err_msg = _format_user_error(e, '<stdin>')

json.dumps({
    "ok": _err_msg is None,
    "output": _result_out,
    "error": _err_msg
}, ensure_ascii=False)
`;

const TRACER_PY = String.raw`
import sys, io, builtins, json, traceback
${PY_FORMAT_HELPER}

_in_stream = io.StringIO(__test_input__)
def _mock_input(prompt=''):
    if prompt:
        _out_stream.write(str(prompt))
    line = _in_stream.readline()
    if not line:
        raise EOFError("EOF when reading a line")
    return line.rstrip('\r\n')

sys.stdin = _in_stream
builtins.input = _mock_input
_out_stream = io.StringIO()
sys.stdout = _out_stream

_steps = []
_step_count = 0
_ops_count = 0

def _truncate_val(val, max_len=40):
    try:
        r = repr(val)
        if len(r) > max_len:
            return r[:max_len-3] + '...'
        return r
    except:
        return '<?>'

def _extract_vars(locals_dict):
    res = {}
    for k, v in locals_dict.items():
        if k.startswith('_') or callable(v) or type(v).__name__ in ('module', 'function', 'type'):
            continue
        if isinstance(v, (int, float, bool, str, list, tuple, dict, set)) or v is None:
            res[k] = _truncate_val(v, 40)
    return res

def _find_lists(locals_dict):
    arr_names = []
    for k, v in locals_dict.items():
        if not k.startswith('_') and isinstance(v, (list, tuple)):
            arr_names.append(k)
    return arr_names

def _trace_dispatch(frame, event, arg):
    global _step_count, _ops_count
    if _step_count >= __max_steps__:
        sys.settrace(None)
        return None

    if event == 'line':
        co = frame.f_code
        if co.co_filename == '<user_code>':
            _step_count += 1
            _ops_count += 1
            line_no = frame.f_lineno
            f_vars = _extract_vars(frame.f_locals)
            arrs = _find_lists(frame.f_locals)

            _steps.append({
                "line": line_no,
                "vars": f_vars,
                "ops": _ops_count,
                "arrays": arrs,
                "explain": f"Dòng {line_no}"
            })
    return _trace_dispatch

sys.settrace(_trace_dispatch)
_runtime_error = None
try:
    _code_obj = compile(__user_code__, '<user_code>', 'exec')
    exec(_code_obj, {'__name__': '__main__'})
except BaseException as e:
    _runtime_error = _format_user_error(e, '<user_code>')
finally:
    sys.settrace(None)

_final_output = _out_stream.getvalue()

json.dumps({
    "steps": _steps,
    "finalOutput": _final_output,
    "runtimeError": _runtime_error,
    "totalOps": _ops_count
}, ensure_ascii=False)
`;

export const PYODIDE_WORKER_SCRIPT = `
let pyodide = null;
let isLoading = false;
let loadError = null;

async function initPyodide() {
  if (pyodide) return pyodide;
  if (isLoading) {
    while (isLoading) {
      await new Promise((r) => setTimeout(r, 100));
    }
    if (pyodide) return pyodide;
    throw loadError || new Error("Không thể khởi tạo Pyodide");
  }

  isLoading = true;
  loadError = null;
  try {
    importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");
    // @ts-ignore
    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.4/full/",
    });
    isLoading = false;
    return pyodide;
  } catch (err) {
    isLoading = false;
    loadError = err;
    throw new Error(
      "Không thể nạp trình chạy Python Pyodide từ CDN. Vui lòng kiểm tra kết nối mạng Internet để tải môi trường biên dịch."
    );
  }
}

const RUNNER_FILE_PY = ${JSON.stringify(RUNNER_FILE_PY)};
const RUNNER_STDIO_PY = ${JSON.stringify(RUNNER_STDIO_PY)};
const TRACER_PY = ${JSON.stringify(TRACER_PY)};

self.onmessage = async (e) => {
  const { id, type, payload } = e.data;

  if (type === "INIT") {
    try {
      await initPyodide();
      self.postMessage({ id, type: "INIT_OK" });
    } catch (err) {
      self.postMessage({
        id,
        type: "INIT_ERROR",
        error: err && err.message ? err.message : String(err),
      });
    }
    return;
  }

  if (type === "EXEC_TEST") {
    try {
      const py = await initPyodide();
      self.postMessage({ id, type: "EXEC_STARTED" });
      const { code, input, ioMode, maxOutputLen = 50000 } = payload;

      py.globals.set("__test_input__", input || "");
      py.globals.set("__user_code__", code || "");
      py.globals.set("__max_output_len__", maxOutputLen);

      let runnerPython = RUNNER_STDIO_PY;
      if (ioMode && ioMode.kind === "file") {
        py.globals.set("__input_file__", ioMode.inputFile);
        py.globals.set("__output_file__", ioMode.outputFile);
        runnerPython = RUNNER_FILE_PY;
      }

      const rawJson = py.runPython(runnerPython);
      const parsed = JSON.parse(String(rawJson || '{}'));
      if (parsed.ok) {
        self.postMessage({
          id,
          type: "EXEC_TEST_OK",
          output: String(parsed.output !== undefined ? parsed.output : ""),
        });
      } else {
        self.postMessage({
          id,
          type: "EXEC_TEST_ERROR",
          error: String(parsed.error || "Lỗi thực thi Python"),
        });
      }
    } catch (err) {
      self.postMessage({
        id,
        type: "EXEC_TEST_ERROR",
        error: err && err.message ? err.message : String(err),
      });
    }
    return;
  }

  if (type === "EXEC_TRACE") {
    try {
      const py = await initPyodide();
      self.postMessage({ id, type: "EXEC_STARTED" });
      const { code, input, maxSteps = 500 } = payload;

      py.globals.set("__test_input__", input || "");
      py.globals.set("__user_code__", code || "");
      py.globals.set("__max_steps__", maxSteps);

      const traceJson = py.runPython(TRACER_PY);
      const parsed = JSON.parse(traceJson);
      self.postMessage({
        id,
        type: "EXEC_TRACE_OK",
        data: parsed,
      });
    } catch (err) {
      self.postMessage({
        id,
        type: "EXEC_TRACE_ERROR",
        error: err && err.message ? err.message : String(err),
      });
    }
    return;
  }
};
`;
