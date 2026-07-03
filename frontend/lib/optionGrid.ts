/**
 * Chia cột lưới đáp án theo số lượng cho cân đối:
 *   2 → 2 cột · 3 → 3 hàng (1 cột) · 4 → 2×2 · 6 → 3 cột · còn lại → 2 cột.
 */
export function optionGridCols(n: number): string {
  switch (n) {
    case 1:
      return 'grid-cols-1';
    case 3:
      return 'grid-cols-1';
    case 6:
      return 'grid-cols-2 md:grid-cols-3';
    default:
      return 'grid-cols-2';
  }
}
