/**
 * Helper đọc field JSON đa ngữ { vi, en } trong DB (Topic.title, Word.meaning,
 * Exercise.question...). Dùng chung cho mọi module — KHÔNG copy hàm này vào service.
 */

/** Đọc field JSON đa ngữ { vi, en } → chuỗi vi. */
export function vi(json: unknown, fallback = ''): string {
  if (!json) return fallback;
  if (typeof json === 'string') return json;
  const o = json as { vi?: string };
  return o.vi ?? fallback;
}

/** Đọc field JSON đa ngữ { vi: string[] } → mảng vi. */
export function viList(json: unknown): string[] {
  if (!json) return [];
  const o = json as { vi?: string[] };
  return Array.isArray(o.vi) ? o.vi : [];
}
