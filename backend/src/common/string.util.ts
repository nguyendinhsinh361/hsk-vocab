/** Viết hoa chữ cái đầu ("nhân" → "Nhân"). */
export function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
