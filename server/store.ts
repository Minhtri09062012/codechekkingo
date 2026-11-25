import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string;
  googleId?: string;
  isBot?: boolean;
  school?: string;
  totalXp: number;
  monthlyXp: number;
  weeklyXp: number;
  dailyXp: number;
  level: 'nen-tang' | 'co-ban' | 'trung-cap' | 'nang-cao';
  streak: number;
  lastActiveDate: string;
  solvedCount: number;
  lessonsCount: number;
  createdAt: string;
  updatedAt: string;
  solvedProblems: string[];
  completedLessons: string[];
}

export interface IdeFile {
  id: string;
  name: string;
  content: string;
  updatedAt: string;
}

export interface AppStoreData {
  users: Record<string, UserProfile>;
  sessions: Record<string, { userId: string; expiresAt: string }>;
  userFiles: Record<string, IdeFile[]>; // userId -> files
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'app_store.json');

const INITIAL_DEFAULT_FILES: IdeFile[] = [
  {
    id: 'f-main',
    name: 'main.py',
    content: `# Chào mừng bạn đến với Professional Python IDE!
# Hỗ trợ Execution Tracing, Breakpoints, Variables Inspector & Call Stack.

def tinh_tong_chu_so(n):
    tong = 0
    while n > 0:
        cs = n % 10
        tong += cs
        n //= 10
    return tong

def kiem_tra_so_dep(x):
    s = tinh_tong_chu_so(x)
    return s % 9 == 0

# Thử nghiệm với các giá trị
danh_sach = [18, 27, 34, 99, 108]
ket_qua = []

for num in danh_sach:
    if kiem_tra_so_dep(num):
        ket_qua.append(num)

print("Các số đẹp tìm thấy:", ket_qua)
`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'f-algo',
    name: 'binary_search.py',
    content: `def binary_search(arr, target):
    left = 0
    right = len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        print(f"Xét phạm vi [{left}, {right}], mid={mid}, val={arr[mid]}")
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
            
    return -1

mang = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
muc_tieu = 23
vitri = binary_search(mang, muc_tieu)
print(f"Tìm thấy {muc_tieu} tại vị trí: {vitri}")
`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'f-scratch',
    name: 'scratchpad.py',
    content: `# Nhập và xuất dữ liệu thử nghiệm
n = 5
tong = 0
for i in range(1, n + 1):
    tong += i
    print(f"Bước {i}: tong = {tong}")

print("Tổng cuối cùng:", tong)
`,
    updatedAt: new Date().toISOString(),
  },
];

const SEED_USERS: UserProfile[] = [
  {
    id: 'u-1',
    email: 'nguyentuananh.hsg@gmail.com',
    name: 'Nguyễn Tuấn Anh',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
    school: 'THPT Chuyên Hà Nội - Amsterdam',
    isBot: true,
    totalXp: 3850,
    monthlyXp: 1420,
    weeklyXp: 520,
    dailyXp: 120,
    level: 'nang-cao',
    streak: 28,
    lastActiveDate: new Date().toISOString(),
    solvedCount: 42,
    lessonsCount: 18,
    createdAt: '2026-08-10T00:00:00Z',
    updatedAt: new Date().toISOString(),
    solvedProblems: ['demkytu', 'cuasotruot', 'tongdoan', 'sodb', 'nhiphan', 'xeplich'],
    completedLessons: ['concept-01', 'concept-02', 'concept-03', 'concept-04', 'concept-05', 'algo-01-min-max'],
  },
  {
    id: 'u-2',
    email: 'tranminhduc.tin@gmail.com',
    name: 'Trần Minh Đức',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&h=120&q=80',
    school: 'THPT Chuyên Lê Hồng Phong',
    isBot: true,
    totalXp: 3240,
    monthlyXp: 1190,
    weeklyXp: 410,
    dailyXp: 95,
    level: 'nang-cao',
    streak: 19,
    lastActiveDate: new Date().toISOString(),
    solvedCount: 36,
    lessonsCount: 16,
    createdAt: '2026-08-15T00:00:00Z',
    updatedAt: new Date().toISOString(),
    solvedProblems: ['demkytu', 'cuasotruot', 'tongdoan', 'sodb'],
    completedLessons: ['concept-01', 'concept-02', 'concept-03', 'concept-05', 'algo-01-min-max'],
  },
  {
    id: 'u-3',
    email: 'lethuha.coder@gmail.com',
    name: 'Lê Thu Hà',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80',
    school: 'THPT Chuyên Khoa học Tự nhiên',
    isBot: true,
    totalXp: 2790,
    monthlyXp: 980,
    weeklyXp: 370,
    dailyXp: 80,
    level: 'trung-cap',
    streak: 15,
    lastActiveDate: new Date().toISOString(),
    solvedCount: 29,
    lessonsCount: 14,
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: new Date().toISOString(),
    solvedProblems: ['demkytu', 'tongdoan', 'sodb'],
    completedLessons: ['concept-01', 'concept-02', 'concept-03', 'concept-04'],
  },
  {
    id: 'u-4',
    email: 'phamhoangnam@gmail.com',
    name: 'Phạm Hoàng Nam',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    school: 'THPT Chuyên Lam Sơn',
    isBot: true,
    totalXp: 2410,
    monthlyXp: 850,
    weeklyXp: 290,
    dailyXp: 60,
    level: 'trung-cap',
    streak: 12,
    lastActiveDate: new Date().toISOString(),
    solvedCount: 24,
    lessonsCount: 12,
    createdAt: '2026-09-05T00:00:00Z',
    updatedAt: new Date().toISOString(),
    solvedProblems: ['demkytu', 'cuasotruot'],
    completedLessons: ['concept-01', 'concept-02', 'concept-03'],
  },
  {
    id: 'u-5',
    email: 'vuquynhanh.code@gmail.com',
    name: 'Vũ Quỳnh Anh',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&h=120&q=80',
    school: 'THCS Giảng Võ',
    isBot: true,
    totalXp: 2150,
    monthlyXp: 740,
    weeklyXp: 260,
    dailyXp: 50,
    level: 'co-ban',
    streak: 9,
    lastActiveDate: new Date().toISOString(),
    solvedCount: 20,
    lessonsCount: 11,
    createdAt: '2026-09-12T00:00:00Z',
    updatedAt: new Date().toISOString(),
    solvedProblems: ['demkytu', 'tongdoan'],
    completedLessons: ['concept-01', 'concept-02'],
  },
  {
    id: 'u-6',
    email: 'doandoankhoi@gmail.com',
    name: 'Đoàn Đăng Khôi',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80',
    school: 'THPT Chu Văn An',
    isBot: true,
    totalXp: 1820,
    monthlyXp: 630,
    weeklyXp: 210,
    dailyXp: 40,
    level: 'co-ban',
    streak: 7,
    lastActiveDate: new Date().toISOString(),
    solvedCount: 16,
    lessonsCount: 9,
    createdAt: '2026-09-18T00:00:00Z',
    updatedAt: new Date().toISOString(),
    solvedProblems: ['demkytu'],
    completedLessons: ['concept-01', 'concept-02'],
  },
  {
    id: 'u-7',
    email: 'hoangbaongoc@gmail.com',
    name: 'Hoàng Bảo Ngọc',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&h=120&q=80',
    school: 'THCS Cầu Giấy',
    isBot: true,
    totalXp: 1450,
    monthlyXp: 510,
    weeklyXp: 180,
    dailyXp: 35,
    level: 'nen-tang',
    streak: 5,
    lastActiveDate: new Date().toISOString(),
    solvedCount: 12,
    lessonsCount: 7,
    createdAt: '2026-09-22T00:00:00Z',
    updatedAt: new Date().toISOString(),
    solvedProblems: ['demkytu'],
    completedLessons: ['concept-01'],
  },
  {
    id: 'u-8',
    email: 'dinhminhtri@gmail.com',
    name: 'Đinh Minh Trí',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=120&h=120&q=80',
    school: 'THPT Chuyên Phan Bội Châu',
    isBot: true,
    totalXp: 1120,
    monthlyXp: 420,
    weeklyXp: 150,
    dailyXp: 30,
    level: 'nen-tang',
    streak: 4,
    lastActiveDate: new Date().toISOString(),
    solvedCount: 9,
    lessonsCount: 5,
    createdAt: '2026-09-26T00:00:00Z',
    updatedAt: new Date().toISOString(),
    solvedProblems: [],
    completedLessons: ['concept-01'],
  },
];

class AppStore {
  private data: AppStoreData = {
    users: {},
    sessions: {},
    userFiles: {},
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Migrate / mark any existing seed users with isBot: true
        let hasChanges = false;
        for (const [id, user] of Object.entries(this.data.users)) {
          if (['u-1', 'u-2', 'u-3', 'u-4', 'u-5', 'u-6', 'u-7', 'u-8'].includes(id)) {
            if (user.isBot !== true) {
              user.isBot = true;
              hasChanges = true;
            }
          }
        }
        if (hasChanges) {
          this.save();
        }
      } else {
        // Seed initial users
        for (const u of SEED_USERS) {
          this.data.users[u.id] = { ...u, isBot: true };
          this.data.userFiles[u.id] = [...INITIAL_DEFAULT_FILES];
        }
        this.save();
      }
    } catch (e) {
      console.warn('Failed to load DB file, initializing with seeds:', e);
      for (const u of SEED_USERS) {
        this.data.users[u.id] = { ...u, isBot: true };
        this.data.userFiles[u.id] = [...INITIAL_DEFAULT_FILES];
      }
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write app store:', e);
    }
  }

  // --- Users ---
  getUserById(id: string): UserProfile | undefined {
    return this.data.users[id];
  }

  getUserByEmail(email: string): UserProfile | undefined {
    return Object.values(this.data.users).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
  }

  getUserByGoogleId(googleId: string): UserProfile | undefined {
    return Object.values(this.data.users).find((u) => u.googleId === googleId);
  }

  findOrCreateGoogleUser(googleProfile: {
    googleId: string;
    email: string;
    name: string;
    avatar: string;
  }): { user: UserProfile; isNew: boolean } {
    let user = this.getUserByGoogleId(googleProfile.googleId);

    if (!user) {
      user = this.getUserByEmail(googleProfile.email);
      if (user) {
        // Link existing user
        user.googleId = googleProfile.googleId;
        if (!user.avatar || user.avatar.includes('unsplash')) {
          user.avatar = googleProfile.avatar || user.avatar;
        }
        user.updatedAt = new Date().toISOString();
        this.save();
        return { user, isNew: false };
      }
    }

    if (user) {
      // Existing user: refresh name/avatar if available
      if (googleProfile.name) user.name = googleProfile.name;
      if (googleProfile.avatar) user.avatar = googleProfile.avatar;
      user.updatedAt = new Date().toISOString();
      this.save();
      return { user, isNew: false };
    }

    // New User registration
    const newId = `u-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const newUser: UserProfile = {
      id: newId,
      email: googleProfile.email,
      name: googleProfile.name || googleProfile.email.split('@')[0],
      avatar:
        googleProfile.avatar ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(googleProfile.email)}`,
      googleId: googleProfile.googleId,
      isBot: false,
      school: '',
      totalXp: 50, // Welcome bonus XP
      monthlyXp: 50,
      weeklyXp: 50,
      dailyXp: 50,
      level: 'nen-tang',
      streak: 1,
      lastActiveDate: now,
      solvedCount: 0,
      lessonsCount: 0,
      createdAt: now,
      updatedAt: now,
      solvedProblems: [],
      completedLessons: [],
    };

    this.data.users[newId] = newUser;
    this.data.userFiles[newId] = JSON.parse(JSON.stringify(INITIAL_DEFAULT_FILES));
    this.save();

    return { user: newUser, isNew: true };
  }

  registerRealUser(data: {
    name: string;
    email?: string;
    avatar?: string;
    school?: string;
    initialProgress?: any;
  }): { user: UserProfile; token: string; isNew: boolean } {
    const cleanName = data.name.trim();
    const slug = cleanName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    const cleanEmail =
      data.email && data.email.trim()
        ? data.email.trim().toLowerCase()
        : `${slug || 'hocsinh'}_${Math.floor(1000 + Math.random() * 9000)}@codetrekking.edu.vn`;

    // Check if real user exists with this email or name
    let user = Object.values(this.data.users).find(
      (u) => !u.isBot && (u.email.toLowerCase() === cleanEmail || u.name.toLowerCase() === cleanName.toLowerCase())
    );

    const now = new Date().toISOString();

    if (!user) {
      const newId = `u-real-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;

      // Calculate initial XP from progress
      let initialXp = 50; // Welcome real user bonus
      let solvedProblems: string[] = [];
      let completedLessons: string[] = [];

      if (data.initialProgress) {
        if (Array.isArray(data.initialProgress.understood)) {
          completedLessons = [...data.initialProgress.understood];
          initialXp += completedLessons.length * 30;
        }
        if (data.initialProgress.solved && typeof data.initialProgress.solved === 'object') {
          solvedProblems = Object.keys(data.initialProgress.solved);
          initialXp += solvedProblems.length * 35;
        }
        if (data.initialProgress.placement) {
          initialXp += 40;
        }
      }

      let level: 'nen-tang' | 'co-ban' | 'trung-cap' | 'nang-cao' = 'nen-tang';
      if (initialXp >= 3000) level = 'nang-cao';
      else if (initialXp >= 2000) level = 'trung-cap';
      else if (initialXp >= 1000) level = 'co-ban';

      const avatarUrl =
        data.avatar ||
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cleanName)}`;

      user = {
        id: newId,
        name: cleanName,
        email: cleanEmail,
        avatar: avatarUrl,
        school: data.school?.trim() || 'Học sinh đam mê Tin học',
        isBot: false,
        totalXp: initialXp,
        monthlyXp: initialXp,
        weeklyXp: initialXp,
        dailyXp: initialXp,
        level,
        streak: 1,
        lastActiveDate: now,
        solvedCount: solvedProblems.length,
        lessonsCount: completedLessons.length,
        createdAt: now,
        updatedAt: now,
        solvedProblems,
        completedLessons,
      };

      this.data.users[newId] = user;
      this.data.userFiles[newId] = JSON.parse(JSON.stringify(INITIAL_DEFAULT_FILES));
      this.save();

      const token = this.createSession(user.id);
      return { user, token, isNew: true };
    } else {
      // Existing user: update avatar/school if provided
      if (data.avatar) user.avatar = data.avatar;
      if (data.school) user.school = data.school.trim();
      user.isBot = false;
      user.updatedAt = now;
      this.save();

      const token = this.createSession(user.id);
      return { user, token, isNew: false };
    }
  }

  clearBots(): { removedCount: number } {
    let count = 0;
    for (const [id, user] of Object.entries(this.data.users)) {
      if (user.isBot || ['u-1', 'u-2', 'u-3', 'u-4', 'u-5', 'u-6', 'u-7', 'u-8'].includes(id)) {
        delete this.data.users[id];
        delete this.data.userFiles[id];
        count++;
      }
    }
    this.save();
    return { removedCount: count };
  }

  restoreBots(): { restoredCount: number } {
    let count = 0;
    for (const u of SEED_USERS) {
      if (!this.data.users[u.id]) {
        this.data.users[u.id] = { ...u, isBot: true };
        this.data.userFiles[u.id] = [...INITIAL_DEFAULT_FILES];
        count++;
      }
    }
    this.save();
    return { restoredCount: count };
  }

  updateUser(id: string, updates: Partial<UserProfile>): UserProfile | null {
    const user = this.data.users[id];
    if (!user) return null;

    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return user;
  }

  // --- XP & Progression ---
  awardXp(
    userId: string,
    amount: number,
    activityType: string,
    sourceId?: string
  ): { user: UserProfile; addedXp: number } | null {
    const user = this.data.users[userId];
    if (!user) return null;

    user.totalXp += amount;
    user.monthlyXp += amount;
    user.weeklyXp += amount;
    user.dailyXp += amount;

    // Recalculate level
    if (user.totalXp >= 3000) user.level = 'nang-cao';
    else if (user.totalXp >= 2000) user.level = 'trung-cap';
    else if (user.totalXp >= 1000) user.level = 'co-ban';
    else user.level = 'nen-tang';

    // Activity tracking
    if (activityType === 'problem_solved' && sourceId && !user.solvedProblems.includes(sourceId)) {
      user.solvedProblems.push(sourceId);
      user.solvedCount = user.solvedProblems.length;
    }
    if (activityType === 'lesson_completed' && sourceId && !user.completedLessons.includes(sourceId)) {
      user.completedLessons.push(sourceId);
      user.lessonsCount = user.completedLessons.length;
    }

    // Streak update
    const today = new Date().toISOString().slice(0, 10);
    const lastActive = user.lastActiveDate.slice(0, 10);
    if (today !== lastActive) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (lastActive === yesterday) {
        user.streak += 1;
      } else {
        user.streak = 1;
      }
      user.lastActiveDate = new Date().toISOString();
    }

    user.updatedAt = new Date().toISOString();
    this.save();
    return { user, addedXp: amount };
  }

  // --- Leaderboard Queries ---
  getLeaderboard(params: {
    timeframe: 'all-time' | 'monthly' | 'weekly' | 'daily';
    level?: string;
    search?: string;
    botFilter?: 'all' | 'real_only' | 'bots_only';
    currentUserId?: string;
    page?: number;
    limit?: number;
  }) {
    const { timeframe, level, search, botFilter = 'all', currentUserId, page = 1, limit = 10 } = params;

    let users = Object.values(this.data.users);

    const totalRealUsers = users.filter((u) => !u.isBot).length;
    const totalBots = users.filter((u) => !!u.isBot).length;

    // Filter bots
    if (botFilter === 'real_only') {
      users = users.filter((u) => !u.isBot);
    } else if (botFilter === 'bots_only') {
      users = users.filter((u) => !!u.isBot);
    }

    // Filter by level
    if (level && level !== 'all') {
      users = users.filter((u) => u.level === level);
    }

    // Filter by search
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.school && u.school.toLowerCase().includes(q))
      );
    }

    // Sort according to timeframe XP
    users.sort((a, b) => {
      let xpA = a.totalXp;
      let xpB = b.totalXp;
      if (timeframe === 'monthly') {
        xpA = a.monthlyXp;
        xpB = b.monthlyXp;
      } else if (timeframe === 'weekly') {
        xpA = a.weeklyXp;
        xpB = b.weeklyXp;
      } else if (timeframe === 'daily') {
        xpA = a.dailyXp;
        xpB = b.dailyXp;
      }
      return xpB - xpA;
    });

    const totalUsers = users.length;
    const rankedUsers = users.map((u, idx) => ({
      rank: idx + 1,
      id: u.id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      school: u.school || '',
      isBot: !!u.isBot,
      xp:
        timeframe === 'monthly'
          ? u.monthlyXp
          : timeframe === 'weekly'
          ? u.weeklyXp
          : timeframe === 'daily'
          ? u.dailyXp
          : u.totalXp,
      solvedCount: u.solvedCount,
      lessonsCount: u.lessonsCount,
      level: u.level,
      streak: u.streak,
      isCurrentUser: u.id === currentUserId,
    }));

    let currentUserRank = null;
    if (currentUserId) {
      const found = rankedUsers.find((u) => u.id === currentUserId);
      if (found) {
        currentUserRank = found;
      }
    }

    const startIndex = (page - 1) * limit;
    const paginatedUsers = rankedUsers.slice(startIndex, startIndex + limit);

    return {
      users: paginatedUsers,
      totalUsers,
      totalRealUsers,
      totalBots,
      botFilter,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(totalUsers / limit)),
      currentUserRank,
      timeframe,
    };
  }

  // --- Sessions ---
  createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    this.data.sessions[token] = { userId, expiresAt };
    this.save();
    return token;
  }

  validateSession(token: string): UserProfile | null {
    const session = this.data.sessions[token];
    if (!session) return null;

    if (new Date(session.expiresAt).getTime() < Date.now()) {
      delete this.data.sessions[token];
      this.save();
      return null;
    }

    const user = this.data.users[session.userId];
    if (!user) {
      delete this.data.sessions[token];
      this.save();
      return null;
    }

    return user;
  }

  deleteSession(token: string): boolean {
    if (this.data.sessions[token]) {
      delete this.data.sessions[token];
      this.save();
      return true;
    }
    return false;
  }

  // --- User Files (IDE) ---
  getUserFiles(userId: string): IdeFile[] {
    if (!this.data.userFiles[userId] || this.data.userFiles[userId].length === 0) {
      this.data.userFiles[userId] = JSON.parse(JSON.stringify(INITIAL_DEFAULT_FILES));
      this.save();
    }
    return this.data.userFiles[userId];
  }

  saveUserFiles(userId: string, files: IdeFile[]) {
    this.data.userFiles[userId] = files;
    this.save();
    return files;
  }

  getDefaultFiles(): IdeFile[] {
    return JSON.parse(JSON.stringify(INITIAL_DEFAULT_FILES));
  }
}

export const appStore = new AppStore();
