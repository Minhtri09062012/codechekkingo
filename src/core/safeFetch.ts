export type SafeJsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; isJson: boolean; message: string; rawText?: string };

/**
 * Đọc và phân tích JSON an toàn từ Response.
 * Tránh lỗi `SyntaxError: Unexpected token ... is not valid JSON` khi máy chủ/proxy trả về HTML hoặc văn bản thuần (ví dụ 404 "The page could not be found").
 */
export async function safeParseJson<T = any>(res: Response): Promise<SafeJsonResult<T>> {
  let rawText = '';
  try {
    rawText = await res.text();
  } catch {
    return {
      ok: false,
      status: res.status,
      isJson: false,
      message: 'Không thể đọc nội dung phản hồi từ máy chủ.',
    };
  }

  const trimmed = rawText.trim();
  const contentType = res.headers.get('content-type') || '';

  if (
    trimmed.startsWith('{') ||
    trimmed.startsWith('[') ||
    contentType.includes('application/json')
  ) {
    try {
      const data = JSON.parse(trimmed) as T;
      return { ok: true, data };
    } catch {
      return {
        ok: false,
        status: res.status,
        isJson: false,
        message: `Dữ liệu JSON từ máy chủ không hợp lệ (HTTP ${res.status}).`,
        rawText: trimmed.slice(0, 120),
      };
    }
  }

  const isNotFoundPage =
    res.status === 404 ||
    trimmed.toLowerCase().includes('page could not be found') ||
    trimmed.toLowerCase().includes('cannot post') ||
    trimmed.toLowerCase().includes('cannot get');

  return {
    ok: false,
    status: res.status,
    isJson: false,
    message: isNotFoundPage
      ? 'Dịch vụ API máy chủ chưa khả dụng tại địa chỉ này.'
      : `Máy chủ trả về phản hồi không phải JSON (HTTP ${res.status}).`,
    rawText: trimmed.slice(0, 120),
  };
}
