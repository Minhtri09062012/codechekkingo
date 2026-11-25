import { APP_NAME, APP_TAGLINE } from './brand.ts';

export type NavGroup = 'learn' | 'practice' | 'me' | 'teacher';

export interface RouteMeta {
  key: string;
  pattern: string;
  title: string;
  shortTitle: string;
  iconName: string;
  group?: NavGroup;
  inMenu: boolean;
  exact?: boolean;
}

export interface MenuItem {
  key: string;
  to: string;
  title: string;
  iconName: string;
  group: NavGroup;
  badgeKey?: 'errorOverdue' | 'errorCount';
}

/**
 * QUY TẮC 18: ĐỊNH TUYẾN DUY NHẤT TRONG CODEBASE
 * Tất cả component và nút bấm PHẢI dùng các hàm trong `routes` này.
 * Không viết chuỗi đường dẫn tay ở bất kỳ đâu.
 */
export const routes = {
  home: () => '/',
  concept: (id?: string) => (id ? `/concept/${id}` : '/concept'),
  algorithm: (id?: string) => (id ? `/algorithm/${id}` : '/algorithm'),
  lesson: (kind: 'concept' | 'algorithm', id?: string) =>
    id ? `/${kind}/${id}` : `/${kind}`,
  problem: (id?: string) => (id ? `/problem/${id}` : '/problem'),
  exam: (setId?: string) => (setId ? `/exam/${setId}` : '/exam'),
  placement: () => '/placement',
  ide: () => '/ide',
  leaderboard: () => '/leaderboard',
  errors: () => '/errors',
  profile: () => '/profile',
  coach: () => '/coach',
  import: () => '/import',
  demoTable: () => '/demo/table',
};

export const ROUTE_CATALOG: Record<string, RouteMeta> = {
  home: {
    key: 'home',
    pattern: '/',
    title: `Trang chủ ${APP_NAME}`,
    shortTitle: 'Trang chủ',
    iconName: 'Home',
    inMenu: true,
    exact: true,
  },
  concept: {
    key: 'concept',
    pattern: '/concept',
    title: 'Học khái niệm lập trình',
    shortTitle: 'Khái niệm',
    iconName: 'BookOpen',
    group: 'learn',
    inMenu: true,
  },
  conceptDetail: {
    key: 'conceptDetail',
    pattern: '/concept/:id',
    title: 'Bài học khái niệm',
    shortTitle: 'Khái niệm',
    iconName: 'BookOpen',
    group: 'learn',
    inMenu: false,
  },
  algorithm: {
    key: 'algorithm',
    pattern: '/algorithm',
    title: 'Học thuật toán bằng mô phỏng',
    shortTitle: 'Thuật toán',
    iconName: 'Cpu',
    group: 'learn',
    inMenu: true,
  },
  algorithmDetail: {
    key: 'algorithmDetail',
    pattern: '/algorithm/:id',
    title: 'Mô phỏng thuật toán',
    shortTitle: 'Thuật toán',
    iconName: 'Cpu',
    group: 'learn',
    inMenu: false,
  },
  problem: {
    key: 'problem',
    pattern: '/problem',
    title: 'Hiểu bài tập & Luyện code',
    shortTitle: 'Hiểu bài tập',
    iconName: 'HelpCircle',
    group: 'learn',
    inMenu: true,
  },
  problemDetail: {
    key: 'problemDetail',
    pattern: '/problem/:id',
    title: 'Chi tiết bài tập',
    shortTitle: 'Bài tập',
    iconName: 'HelpCircle',
    group: 'learn',
    inMenu: false,
  },
  exam: {
    key: 'exam',
    pattern: '/exam',
    title: 'Phòng luyện thi HSG Tin',
    shortTitle: 'Luyện thi',
    iconName: 'Trophy',
    group: 'practice',
    inMenu: true,
  },
  examDetail: {
    key: 'examDetail',
    pattern: '/exam/:setId',
    title: 'Đang làm bài thi',
    shortTitle: 'Luyện thi',
    iconName: 'Trophy',
    group: 'practice',
    inMenu: false,
  },
  placement: {
    key: 'placement',
    pattern: '/placement',
    title: 'Test đầu vào thích ứng',
    shortTitle: 'Test đầu vào',
    iconName: 'Compass',
    group: 'practice',
    inMenu: true,
  },
  ide: {
    key: 'ide',
    pattern: '/ide',
    title: 'IDE Python Chuyên Nghiệp',
    shortTitle: 'IDE Python',
    iconName: 'Code2',
    group: 'practice',
    inMenu: true,
  },
  leaderboard: {
    key: 'leaderboard',
    pattern: '/leaderboard',
    title: 'Bảng xếp hạng Toàn hệ thống',
    shortTitle: 'Bảng xếp hạng',
    iconName: 'Trophy',
    group: 'practice',
    inMenu: true,
  },
  errors: {
    key: 'errors',
    pattern: '/errors',
    title: 'Sổ tay lỗi cá nhân',
    shortTitle: 'Sổ lỗi sai',
    iconName: 'AlertTriangle',
    group: 'me',
    inMenu: true,
  },
  profile: {
    key: 'profile',
    pattern: '/profile',
    title: 'Hồ sơ & Bản đồ năng lực',
    shortTitle: 'Hồ sơ',
    iconName: 'User',
    group: 'me',
    inMenu: true,
  },
  coach: {
    key: 'coach',
    pattern: '/coach',
    title: 'Bảng điều khiển Huấn luyện viên',
    shortTitle: 'Huấn luyện viên',
    iconName: 'Users',
    group: 'teacher',
    inMenu: true,
  },
  import: {
    key: 'import',
    pattern: '/import',
    title: 'Nhập đề bài & Kiểm định Pyodide',
    shortTitle: 'Nhập đề',
    iconName: 'FileCode',
    group: 'teacher',
    inMenu: true,
  },
  demoTable: {
    key: 'demoTable',
    pattern: '/demo/table',
    title: 'Demo Renderer Table',
    shortTitle: 'Demo Table',
    iconName: 'Table',
    inMenu: false,
  },
};

// Định nghĩa Menu phân nhóm
export const MAIN_MENU_GROUPS: {
  group: NavGroup;
  title: string;
  items: MenuItem[];
}[] = [
  {
    group: 'learn',
    title: 'Học',
    items: [
      {
        key: 'concept',
        to: routes.concept(),
        title: 'Học khái niệm',
        iconName: 'BookOpen',
        group: 'learn',
      },
      {
        key: 'algorithm',
        to: routes.algorithm(),
        title: 'Học thuật toán',
        iconName: 'Cpu',
        group: 'learn',
      },
      {
        key: 'problem',
        to: routes.problem(),
        title: 'Hiểu bài tập',
        iconName: 'HelpCircle',
        group: 'learn',
      },
    ],
  },
  {
    group: 'practice',
    title: 'Luyện',
    items: [
      {
        key: 'exam',
        to: routes.exam(),
        title: 'Luyện thi',
        iconName: 'Trophy',
        group: 'practice',
      },
      {
        key: 'placement',
        to: routes.placement(),
        title: 'Test đầu vào',
        iconName: 'Compass',
        group: 'practice',
      },
      {
        key: 'ide',
        to: routes.ide(),
        title: 'IDE Python',
        iconName: 'Code2',
        group: 'practice',
      },
      {
        key: 'leaderboard',
        to: routes.leaderboard(),
        title: 'Bảng xếp hạng',
        iconName: 'Trophy',
        group: 'practice',
      },
    ],
  },
  {
    group: 'me',
    title: 'Của em',
    items: [
      {
        key: 'errors',
        to: routes.errors(),
        title: 'Sổ lỗi sai',
        iconName: 'AlertTriangle',
        group: 'me',
        badgeKey: 'errorOverdue',
      },
      {
        key: 'profile',
        to: routes.profile(),
        title: 'Hồ sơ',
        iconName: 'User',
        group: 'me',
      },
    ],
  },
  {
    group: 'teacher',
    title: 'Giáo viên',
    items: [
      {
        key: 'coach',
        to: routes.coach(),
        title: 'Huấn luyện viên',
        iconName: 'Users',
        group: 'teacher',
      },
      {
        key: 'import',
        to: routes.import(),
        title: 'Nhập đề',
        iconName: 'FileCode',
        group: 'teacher',
      },
    ],
  },
];

/**
 * Tìm route metadata từ pathname hiện tại
 */
export function getRouteMetaByPath(pathname: string): RouteMeta | undefined {
  if (pathname === '/' || pathname === '') {
    return ROUTE_CATALOG.home;
  }

  // Exact matches first
  for (const meta of Object.values(ROUTE_CATALOG)) {
    if (meta.pattern === pathname) {
      return meta;
    }
  }

  // Parameterized matches
  if (pathname.startsWith('/concept/')) return ROUTE_CATALOG.conceptDetail;
  if (pathname.startsWith('/algorithm/')) return ROUTE_CATALOG.algorithmDetail;
  if (pathname.startsWith('/problem/')) return ROUTE_CATALOG.problemDetail;
  if (pathname.startsWith('/exam/')) return ROUTE_CATALOG.examDetail;

  return undefined;
}

/**
 * Tạo tiêu đề trang đầy đủ (Title) theo đường dẫn
 */
export function getPageTitle(pathname: string, customItemTitle?: string): string {
  if (customItemTitle) {
    return `${customItemTitle} – ${APP_NAME}`;
  }

  const meta = getRouteMetaByPath(pathname);
  if (meta) {
    return `${meta.title} – ${APP_NAME}`;
  }

  return `${APP_NAME} – ${APP_TAGLINE}`;
}

/**
 * Kiểm tra xem một đường dẫn có đang active không (hỗ trợ sub-routes)
 */
export function isPathActive(currentPath: string, targetPath: string): boolean {
  if (targetPath === '/') {
    return currentPath === '/' || currentPath === '';
  }
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

/**
 * Dev Check cho Quy tắc 18:
 * - Mỗi mục menu phải khớp một route đã đăng ký trong ROUTE_CATALOG
 * - Mỗi route (trừ * và route con có :id) phải có lối vào từ menu
 */
export function checkRoutesIntegrity(): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  const registeredPatterns = new Set(
    Object.values(ROUTE_CATALOG).map((r) => r.pattern)
  );

  // 1. Kiểm tra mọi menu item
  for (const group of MAIN_MENU_GROUPS) {
    for (const item of group.items) {
      const match = getRouteMetaByPath(item.to);
      if (!match) {
        errors.push(`[Dev Check Quy tắc 18] Menu "${item.title}" trỏ tới đường dẫn chưa đăng ký: ${item.to}`);
      }
    }
  }

  // 2. Kiểm tra các route chính có trong menu
  for (const meta of Object.values(ROUTE_CATALOG)) {
    if (meta.inMenu) {
      const inAnyGroup = MAIN_MENU_GROUPS.some((g) =>
        g.items.some((i) => i.key === meta.key)
      );
      if (!inAnyGroup && meta.key !== 'home') {
        errors.push(`[Dev Check Quy tắc 18] Route "${meta.pattern}" (${meta.title}) đánh dấu inMenu nhưng không có trong MAIN_MENU_GROUPS`);
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
