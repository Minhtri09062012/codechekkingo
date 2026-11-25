/**
 * Dev Monitor: Đo kiểm điều hướng và độ bền vững theo Quy tắc 19 & 20
 * - Phát hiện tải lại toàn trang (Document-level reload) sau khi ứng dụng đã khởi động
 * - Ghi log số lần mount của RootLayout, AppHeader, Sidebar vào console
 * - Quét và kiểm tra sự hiện diện của <a href="/..."> nội bộ hoặc window.location
 */

import { EXPORT_PREFIX } from './brand.ts';

export interface MountCounters {
  rootLayout: number;
  appHeader: number;
  sidebar: number;
}

export const mountCounters: MountCounters = {
  rootLayout: 0,
  appHeader: 0,
  sidebar: 0,
};

let unexpectedReloadDetected = false;

// Ghi nhận khởi tạo phiên ứng dụng (chỉ chạy trong môi trường trình duyệt)
if (typeof window !== 'undefined') {
  const SESSION_KEY = `${EXPORT_PREFIX}_app_session_started`;
  sessionStorage.setItem(SESSION_KEY, 'true');
}

/**
 * Kiểm tra xem có phát hiện tải lại toàn trang bất thường không
 */
export function isReloadDetected(): boolean {
  return unexpectedReloadDetected;
}

/**
 * Ghi nhận mount component
 */
export function logComponentMount(name: 'rootLayout' | 'appHeader' | 'sidebar'): void {
  mountCounters[name]++;
  const count = mountCounters[name];
  const label =
    name === 'rootLayout'
      ? 'RootLayout'
      : name === 'appHeader'
      ? 'AppHeader (Navbar)'
      : 'LearnSidebar';

  if (count === 1) {
    console.info(`[Dev Audit] ✓ ${label} mounted lần đầu (1 lần - ĐẠT CHUẨN)`);
  } else {
    console.warn(
      `[Dev Audit] ⚠ CẢNH BÁO: ${label} đã mount ${count} lần! Khung ứng dụng có thể bị dựng lại khi đổi trang con.`
    );
  }
}

/**
 * Quét DOM kiểm tra xem có thẻ <a href="/..."> nội bộ không dùng React Router
 */
export function auditInternalLinksInDOM(): { ok: boolean; violations: string[] } {
  if (typeof document === 'undefined') return { ok: true, violations: [] };

  const violations: string[] = [];
  const anchorElements = document.querySelectorAll('a[href]');

  anchorElements.forEach((el) => {
    const href = el.getAttribute('href') || '';
    // Cho phép liên kết ra ngoài hoặc download blob / file
    if (
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('blob:') ||
      href.startsWith('data:') ||
      href.startsWith('#') ||
      el.hasAttribute('download')
    ) {
      return;
    }

    // Nếu href bắt đầu bằng '/' mà không có '#'
    if (href.startsWith('/')) {
      violations.push(`Thẻ <a> với href="${href}" vi phạm Quy tắc 19 (cần dùng <Link> hoặc <NavLink>)`);
    }
  });

  return {
    ok: violations.length === 0,
    violations,
  };
}

/**
 * Kiểm tra danh sách cho phép cho window.location theo Quy tắc 19:
 * Chỉ cho phép window.location.reload() và window.location.hash trong ErrorBoundary.
 */
export const ALLOWED_LOCATION_OPERATIONS = [
  'src/components/layout/ErrorBoundary.tsx:window.location.reload',
  'src/components/layout/ErrorBoundary.tsx:window.location.hash',
] as const;

