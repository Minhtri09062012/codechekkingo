import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import { appStore, UserProfile, IdeFile } from './server/store.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Auth Middleware
interface AuthenticatedRequest extends Request {
  user?: UserProfile;
  sessionToken?: string;
}

const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.headers['x-session-token'] as string) || (req.query.token as string);

  if (token) {
    const user = appStore.validateSession(token);
    if (user) {
      req.user = user;
      req.sessionToken = token;
    }
  }
  next();
};

app.use(authMiddleware);

// ==================== AUTH API ====================

// 1. Get OAuth Client Configuration
app.get('/api/auth/config', (req, res) => {
  res.json({
    googleClientId:
      process.env.GOOGLE_CLIENT_ID ||
      process.env.VITE_GOOGLE_CLIENT_ID ||
      '1048638647413-demo.apps.googleusercontent.com',
  });
});

// 2. Google OAuth Verification (ID token or access token)
app.post('/api/auth/google/verify', async (req: AuthenticatedRequest, res) => {
  try {
    const { idToken, accessToken } = req.body;

    if (!idToken && !accessToken) {
      return res.status(400).json({ error: 'Missing idToken or accessToken' });
    }

    let googleProfile: {
      googleId: string;
      email: string;
      name: string;
      avatar: string;
    } | null = null;

    if (idToken) {
      // Verify via Google tokeninfo
      const verifyRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
      );

      if (!verifyRes.ok) {
        const errText = await verifyRes.text();
        return res.status(401).json({
          error: 'TOKEN_EXPIRED',
          message: 'Token Google đã hết hạn hoặc không hợp lệ. Vui lòng thử lại.',
          details: errText,
        });
      }

      const payload = (await verifyRes.json()) as any;
      if (!payload.email) {
        return res.status(400).json({ error: 'Google account has no email' });
      }

      googleProfile = {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        avatar: payload.picture || '',
      };
    } else if (accessToken) {
      // Verify via Google userinfo
      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!userInfoRes.ok) {
        return res.status(401).json({
          error: 'TOKEN_EXPIRED',
          message: 'Phiên Google Access Token đã hết hạn.',
        });
      }

      const info = (await userInfoRes.json()) as any;
      googleProfile = {
        googleId: info.sub,
        email: info.email,
        name: info.name || info.email.split('@')[0],
        avatar: info.picture || '',
      };
    }

    if (!googleProfile) {
      return res.status(401).json({ error: 'Failed to verify Google identity' });
    }

    // Find or register new user
    const { user, isNew } = appStore.findOrCreateGoogleUser(googleProfile);
    const sessionToken = appStore.createSession(user.id);
    const files = appStore.getUserFiles(user.id);

    return res.json({
      success: true,
      token: sessionToken,
      user,
      files,
      isNew,
      message: isNew
        ? 'Tài khoản Google mới đã được tạo thành công (+50 XP chào mừng)!'
        : 'Đăng nhập Google thành công!',
    });
  } catch (err: any) {
    console.error('Google OAuth verify error:', err);
    return res.status(500).json({
      error: 'SERVER_ERROR',
      message: 'Lỗi xác thực OAuth từ phía máy chủ.',
      details: err?.message,
    });
  }
});

// 3. Current User Profile
app.get('/api/auth/me', (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Chưa đăng nhập' });
  }

  const files = appStore.getUserFiles(req.user.id);
  res.json({
    user: req.user,
    files,
  });
});

// 4. Logout
app.post('/api/auth/logout', (req: AuthenticatedRequest, res) => {
  if (req.sessionToken) {
    appStore.deleteSession(req.sessionToken);
  }
  res.json({ success: true, message: 'Đăng xuất thành công' });
});

// 5. Account Linking
app.post('/api/auth/link', async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Vui lòng đăng nhập trước khi liên kết' });
  }

  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'Missing idToken' });
  }

  try {
    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    );

    if (!verifyRes.ok) {
      return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Token không hợp lệ' });
    }

    const payload = (await verifyRes.json()) as any;
    const existing = appStore.getUserByGoogleId(payload.sub);
    if (existing && existing.id !== req.user.id) {
      return res.status(409).json({
        error: 'GOOGLE_ALREADY_LINKED',
        message: 'Tài khoản Google này đã được liên kết với một tài khoản khác trong hệ thống.',
      });
    }

    const updated = appStore.updateUser(req.user.id, {
      googleId: payload.sub,
      avatar: payload.picture || req.user.avatar,
    });

    res.json({ success: true, user: updated, message: 'Liên kết tài khoản Google thành công!' });
  } catch (err: any) {
    res.status(500).json({ error: 'LINK_FAILED', message: err?.message });
  }
});

// 6. Direct Real User Registration / Profile Creation (No Google Required)
app.post('/api/auth/register-real', (req: AuthenticatedRequest, res) => {
  const { name, email, avatar, school, initialProgress } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'INVALID_NAME', message: 'Vui lòng nhập họ và tên hoặc biệt danh thi đấu.' });
  }

  try {
    const { user, token, isNew } = appStore.registerRealUser({
      name,
      email,
      avatar,
      school,
      initialProgress,
    });
    const files = appStore.getUserFiles(user.id);

    return res.json({
      success: true,
      token,
      user,
      files,
      isNew,
      message: isNew
        ? `Chào mừng ${user.name} tham gia thi đấu thực tế (+50 XP)!`
        : `Chào mừng ${user.name} quay trở lại!`,
    });
  } catch (err: any) {
    console.error('Real user registration error:', err);
    return res.status(500).json({ error: 'REGISTER_FAILED', message: err?.message });
  }
});

// ==================== LEADERBOARD API ====================

app.get('/api/leaderboard', (req: AuthenticatedRequest, res) => {
  const timeframe = (req.query.timeframe as any) || 'all-time';
  const level = (req.query.level as string) || 'all';
  const search = (req.query.search as string) || '';
  const botFilter = (req.query.botFilter as any) || 'all';
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.max(1, Math.min(50, parseInt(req.query.limit as string) || 10));

  const result = appStore.getLeaderboard({
    timeframe,
    level,
    search,
    botFilter,
    currentUserId: req.user?.id,
    page,
    limit,
  });

  res.json(result);
});

// Clear or hide simulated bots
app.post('/api/leaderboard/clear-bots', (req: AuthenticatedRequest, res) => {
  const result = appStore.clearBots();
  res.json({
    success: true,
    ...result,
    message: `Đã dọn sạch ${result.removedCount} tài khoản bot mẫu. Bảng xếp hạng giờ đây chỉ dành cho người dùng thực!`,
  });
});

// Restore bots for benchmark
app.post('/api/leaderboard/restore-bots', (req: AuthenticatedRequest, res) => {
  const result = appStore.restoreBots();
  res.json({
    success: true,
    ...result,
    message: `Đã khôi phục ${result.restoredCount} tài khoản bot đối chuẩn HSG Tin học.`,
  });
});

app.get('/api/leaderboard/user/:id', (req, res) => {
  const user = appStore.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'NOT_FOUND', message: 'Không tìm thấy người dùng' });
  }

  res.json({
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    level: user.level,
    totalXp: user.totalXp,
    solvedCount: user.solvedCount,
    lessonsCount: user.lessonsCount,
    streak: user.streak,
    createdAt: user.createdAt,
    solvedProblems: user.solvedProblems,
  });
});

// ==================== XP AWARD API ====================

app.post('/api/xp/award', (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Cần đăng nhập để tích lũy XP vào hồ sơ' });
  }

  const { activityType, sourceId, details } = req.body;

  let xpToAdd = 0;
  if (activityType === 'problem_solved') {
    // Only award if full score was reached
    if (details?.score && details.score >= 100) {
      xpToAdd = 35;
    } else {
      xpToAdd = 15;
    }
  } else if (activityType === 'lesson_completed') {
    xpToAdd = 30;
  } else if (activityType === 'stage_completed') {
    xpToAdd = 15;
  } else if (activityType === 'quiz_passed') {
    xpToAdd = 20;
  } else if (activityType === 'exam_submitted') {
    xpToAdd = 50;
  } else if (activityType === 'ide_debug_session') {
    xpToAdd = 10;
  } else if (activityType === 'ide_run_debug') {
    xpToAdd = 5;
  }

  if (xpToAdd <= 0) {
    return res.json({ success: false, message: 'Hoạt động chưa đủ điều kiện nhận điểm thưởng' });
  }

  const awardResult = appStore.awardXp(req.user.id, xpToAdd, activityType, sourceId);
  if (!awardResult) {
    return res.status(500).json({ error: 'AWARD_FAILED' });
  }

  res.json({
    success: true,
    addedXp: xpToAdd,
    user: awardResult.user,
    message: `Chúc mừng bạn được cộng +${xpToAdd} XP!`,
  });
});

// ==================== IDE CLOUD STORAGE ====================

app.get('/api/ide/files', (req: AuthenticatedRequest, res) => {
  if (req.user) {
    const files = appStore.getUserFiles(req.user.id);
    return res.json({ files, isGuest: false });
  }
  return res.json({ files: appStore.getDefaultFiles(), isGuest: true });
});

app.post('/api/ide/files', (req: AuthenticatedRequest, res) => {
  const { files } = req.body;
  if (!Array.isArray(files)) {
    return res.status(400).json({ error: 'Files must be an array' });
  }

  if (req.user) {
    appStore.saveUserFiles(req.user.id, files);
    return res.json({ success: true, files, message: 'Đã lưu file lên đám mây' });
  }

  return res.json({ success: true, files, message: 'Đã lưu cục bộ (Hãy đăng nhập để đồng bộ)' });
});

// ==================== REAL PYTHON RUNNER & DEBUGGER ====================

// Standard run endpoint
app.post('/api/python/run', (req, res) => {
  const { code, input = '', timeLimitSec = 3 } = req.body;

  if (typeof code !== 'string') {
    return res.status(400).json({ error: 'Code is required' });
  }

  const startTime = Date.now();
  const pyProcess = spawn('python3', ['-c', `
import sys, io, json, traceback

def _format_user_error(e):
    if isinstance(e, SyntaxError):
        lines = [f'  File "<user_code>", line {e.lineno or 1}']
        if e.text:
            txt = e.text.rstrip('\\r\\n')
            lines.append(f'    {txt}')
            if e.offset and e.offset > 0:
                lines.append('    ' + (' ' * (e.offset - 1)) + '^')
        lines.append(f'{type(e).__name__}: {e.msg}')
        return '\\n'.join(lines)
    tb_list = traceback.extract_tb(e.__traceback__)
    user_frames = [f for f in tb_list if f.filename == '<user_code>']
    lines = []
    for f in user_frames:
        lines.append(f'  File "{f.filename}", line {f.lineno}, in {f.name}')
        if f.line:
            lines.append(f'    {f.line}')
    lines.append(f'{type(e).__name__}: {str(e)}')
    return '\\n'.join(lines)

payload = json.loads(sys.stdin.read() or '{}')
user_code = payload.get('code', '')
user_input = payload.get('input', '')

sys.stdin = io.StringIO(user_input)
out = io.StringIO()
sys.stdout = out
sys.stderr = out

clean_globals = {'__name__': '__main__'}
has_error = False
err_text = ''
try:
    exec(compile(user_code, '<user_code>', 'exec'), clean_globals)
except BaseException as e:
    has_error = True
    err_text = _format_user_error(e)
finally:
    sys.stdout = sys.__stdout__
    sys.stderr = sys.__stderr__
    sys.stdout.write(out.getvalue())
    if has_error:
        sys.stderr.write(err_text)
        sys.exit(1)
`]);

  let stdoutData = '';
  let stderrData = '';
  let killed = false;

  const timer = setTimeout(() => {
    killed = true;
    pyProcess.kill('SIGKILL');
  }, Math.min(timeLimitSec, 6) * 1000);

  pyProcess.stdout.on('data', (data) => {
    stdoutData += data.toString();
  });

  pyProcess.stderr.on('data', (data) => {
    stderrData += data.toString();
  });

  pyProcess.on('close', (exitCode) => {
    clearTimeout(timer);
    const elapsedMs = Date.now() - startTime;

    if (killed) {
      return res.json({
        success: false,
        status: 'timeout',
        error: 'Timeout: Quá thời gian thực thi cho phép (3s).',
        stdout: stdoutData,
        elapsedMs,
      });
    }

    return res.json({
      success: exitCode === 0,
      status: exitCode === 0 ? 'ok' : 'runtime',
      stdout: stdoutData,
      stderr: stderrData,
      error: stderrData || (exitCode !== 0 ? `Process exited with code ${exitCode}` : null),
      elapsedMs,
    });
  });

  pyProcess.stdin.write(JSON.stringify({ code, input }));
  pyProcess.stdin.end();
});

// Full Step-by-Step Execution Tracing (Debugger via sys.settrace)
app.post('/api/python/debug', (req, res) => {
  const { code, input = '', maxSteps = 1500 } = req.body;

  if (typeof code !== 'string') {
    return res.status(400).json({ error: 'Code is required' });
  }

  const startTime = Date.now();
  const tracerScript = path.resolve(process.cwd(), 'server', 'tracer.py');

  const pyProcess = spawn('python3', [tracerScript], {
    timeout: 5000,
  });

  let stdoutData = '';
  let stderrData = '';
  let killed = false;

  const timer = setTimeout(() => {
    killed = true;
    pyProcess.kill('SIGKILL');
  }, 5000);

  pyProcess.stdout.on('data', (data) => {
    stdoutData += data.toString();
  });

  pyProcess.stderr.on('data', (data) => {
    stderrData += data.toString();
  });

  pyProcess.on('close', (exitCode) => {
    clearTimeout(timer);
    const elapsedMs = Date.now() - startTime;

    if (killed) {
      return res.json({
        success: false,
        status: 'timeout',
        error: 'Timeout: Quá thời gian thu thập dữ liệu debugger (5s).',
        steps: [],
        finalOutput: '',
        elapsedMs,
      });
    }

    try {
      const parsed = JSON.parse(stdoutData.trim());
      return res.json({
        ...parsed,
        elapsedMs,
      });
    } catch (parseErr) {
      return res.json({
        success: false,
        status: 'error',
        error: stderrData || 'Lỗi khi phân tích dữ liệu gỡ lỗi từ tracer.',
        steps: [],
        finalOutput: stdoutData,
        elapsedMs,
      });
    }
  });

  const payload = JSON.stringify({ code, input, maxSteps });
  pyProcess.stdin.write(payload);
  pyProcess.stdin.end();
});

// Ensure unknown /api/* routes always return valid JSON
app.use('/api', (req, res) => {
  res.status(404).json({
    error: 'API_NOT_FOUND',
    message: `Không tìm thấy API: ${req.method} ${req.originalUrl}`,
  });
});

// ==================== SERVE FRONTEND ====================

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend & Vite running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
