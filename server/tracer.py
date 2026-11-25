import sys
import io
import json
import time
import traceback

def format_user_error(e):
    if isinstance(e, SyntaxError):
        lines = [f'  File "<user_code>", line {e.lineno or 1}']
        if e.text:
            txt = e.text.rstrip('\r\n')
            lines.append(f'    {txt}')
            if e.offset and e.offset > 0:
                lines.append('    ' + (' ' * (e.offset - 1)) + '^')
        lines.append(f'{type(e).__name__}: {e.msg}')
        return '\n'.join(lines)
    tb_list = traceback.extract_tb(e.__traceback__)
    user_frames = [f for f in tb_list if f.filename == '<user_code>']
    lines = []
    for f in user_frames:
        lines.append(f'  File "{f.filename}", line {f.lineno}, in {f.name}')
        if f.line:
            lines.append(f'    {f.line}')
    lines.append(f'{type(e).__name__}: {str(e)}')
    return '\n'.join(lines)

def classify_variable(name, val):
    t_name = type(val).__name__
    category = 'other'
    if t_name in ('int', 'float', 'complex'):
        category = 'number'
    elif t_name in ('str',):
        category = 'string'
    elif t_name in ('list', 'tuple'):
        category = 'list'
    elif t_name in ('dict',):
        category = 'dict'
    elif t_name in ('set', 'frozenset'):
        category = 'set'
    elif t_name in ('bool',):
        category = 'boolean'
    elif val is None:
        category = 'none'

    try:
        r = repr(val)
        if len(r) > 120:
            r = r[:117] + '...'
    except Exception:
        r = '<unprintable>'

    return {
        'name': name,
        'value': r,
        'type': t_name,
        'category': category
    }

def main():
    try:
        raw_input_data = sys.stdin.read()
        if not raw_input_data.strip():
            sys.stdout.write(json.dumps({'success': False, 'error': 'No input payload provided'}))
            return
        payload = json.loads(raw_input_data)
    except Exception as e:
        sys.stdout.write(json.dumps({'success': False, 'error': f'Invalid input payload: {e}'}))
        return

    code_str = payload.get('code', '')
    user_stdin = payload.get('input', '')
    max_steps = min(int(payload.get('maxSteps', 1500)), 3000)

    # Set up virtual stdin and stdout
    stdin_stream = io.StringIO(user_stdin)
    stdout_stream = io.StringIO()

    def mock_input(prompt=''):
        if prompt:
            stdout_stream.write(str(prompt))
        line = stdin_stream.readline()
        if not line:
            raise EOFError("EOF when reading a line")
        return line.rstrip('\r\n')

    # Intercept builtins
    safe_builtins = __builtins__
    if isinstance(safe_builtins, dict):
        safe_builtins = safe_builtins.copy()
        safe_builtins['input'] = mock_input
    else:
        # module
        safe_builtins_dict = safe_builtins.__dict__.copy()
        safe_builtins_dict['input'] = mock_input
        safe_builtins = safe_builtins_dict

    original_stdout = sys.stdout
    original_stderr = sys.stderr
    original_stdin = sys.stdin
    sys.stdout = stdout_stream
    sys.stderr = stdout_stream
    sys.stdin = stdin_stream

    steps = []
    step_count = 0
    start_time = time.time()
    last_locals = {}
    runtime_error = None

    def trace_callback(frame, event, arg):
        nonlocal step_count, last_locals
        if step_count >= max_steps:
            sys.settrace(None)
            return None

        co = frame.f_code
        if co.co_filename != '<user_code>':
            return trace_callback

        if event in ('line', 'call', 'return', 'exception'):
            step_count += 1

            # Extract call stack
            stack = []
            cur = frame
            while cur:
                if cur.f_code.co_filename == '<user_code>':
                    stack.append({
                        'func': cur.f_code.co_name,
                        'line': cur.f_lineno,
                        'file': 'main.py'
                    })
                cur = cur.f_back
            stack.reverse()

            # Extract local variables
            current_locals = {}
            for k, v in frame.f_locals.items():
                if k.startswith('_') or callable(v) or type(v).__name__ in ('module', 'function', 'type'):
                    continue
                current_locals[k] = classify_variable(k, v)

            # Extract globals
            current_globals = {}
            for k, v in frame.f_globals.items():
                if k.startswith('_') or callable(v) or type(v).__name__ in ('module', 'function', 'type') or k in current_locals:
                    continue
                current_globals[k] = classify_variable(k, v)

            # Changed variables
            changed_vars = {}
            for k, v in current_locals.items():
                prev = last_locals.get(k)
                if prev is None or prev['value'] != v['value']:
                    changed_vars[k] = {
                        'name': k,
                        'before': prev['value'] if prev else None,
                        'after': v['value'],
                        'type': v['type'],
                        'category': v['category']
                    }
            last_locals = current_locals.copy()

            extra_info = {}
            if event == 'return':
                extra_info['returnValue'] = repr(arg) if arg is not None else 'None'
            elif event == 'exception':
                exc_type, exc_val, _ = arg
                extra_info['exception'] = f"{exc_type.__name__}: {exc_val}"

            steps.append({
                'step': step_count,
                'line': frame.f_lineno,
                'func': frame.f_code.co_name,
                'event': event,
                'locals': current_locals,
                'globals': current_globals,
                'callStack': stack,
                'changedVars': changed_vars,
                'stdout': stdout_stream.getvalue(),
                **extra_info
            })

        return trace_callback

    try:
        compiled_code = compile(code_str, '<user_code>', 'exec')
        clean_globals = {
            '__name__': '__main__',
            '__builtins__': safe_builtins
        }
        sys.settrace(trace_callback)
        exec(compiled_code, clean_globals)
    except BaseException as e:
        runtime_error = format_user_error(e)
    finally:
        sys.settrace(None)
        sys.stdout = original_stdout
        sys.stderr = original_stderr
        sys.stdin = original_stdin

    elapsed_ms = int((time.time() - start_time) * 1000)

    result = {
        'success': True,
        'steps': steps,
        'finalOutput': stdout_stream.getvalue(),
        'runtimeError': runtime_error,
        'totalSteps': step_count,
        'elapsedMs': elapsed_ms
    }

    original_stdout.write(json.dumps(result, ensure_ascii=False))

if __name__ == '__main__':
    main()
