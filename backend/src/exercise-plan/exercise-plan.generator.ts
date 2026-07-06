/**
 * THUẬT TOÁN SINH BÀI TẬP — cài đặt spec "BNPD - Logic bài tập (Final - BS).xlsx".
 *
 * Sheet 06 — Công thức theo từ (× 2 chế độ):
 *   ┌──────────┬───────────────────────────────┬───────────────────────────────┐
 *   │ Loại từ  │ GỐC TỪ (ROOT)                 │ CHỦ ĐỀ (TOPIC — không D1/D2)  │
 *   ├──────────┼───────────────────────────────┼───────────────────────────────┤
 *   │ M1       │ D1 → C                        │ A → C                         │
 *   │ M2       │ A → D1 (thiếu thì B) → C      │ A → B → C                     │
 *   │ M3       │ A1(cảnh báo) → B → A2/A3 → C  │ (giữ nguyên)                  │
 *   │ ★ Đã học │ C1/C3 (sai → hàng đợi ôn)     │ (giữ nguyên)                  │
 *   │ Kết thúc │ D2 × n pattern + D3 ×1 (cuối) │ D3 ×1; >8 từ → chia 3–5 cặp   │
 *   └──────────┴───────────────────────────────┴───────────────────────────────┘
 *
 * Sheet 07 — Quy tắc không trùng:
 *   - 2 từ LIỀN KỀ có bài cùng nhóm chức năng → phải KHÁC dạng bài.
 *   - Vòng xoay: A: A1→A3→A4→A2 · B: B1→B2→B3 · C: C1→C3→C4→C2.
 *   - C5 không vào vòng xoay level 1–2 (level 3+ mới dùng).
 *   - M3 bắt buộc A1 (kèm cảnh báo) — không xoay, được phép trùng giữa 2 từ M3.
 *   - D1 cố định cho M1/M2 (ROOT) — chấp nhận trùng dạng (nội dung khác nhau).
 *   - M3 nhóm C: level 1–3 ưu tiên C1/C3/C4, level 4+ ưu tiên C2/C5 (sheet 06).
 *
 * Toàn bộ hàm THUẦN (không side-effect) để unit-test và tái sử dụng.
 */

import {
  groupOf,
  type ExerciseTypeCode,
  type PlanMode,
  type PlanOptions,
  type PlanWordInput,
  type PlannedExercise,
} from './exercise-plan.types';

// Vòng xoay chuẩn (sheet 07).
const A_ROTATION: ExerciseTypeCode[] = ['A1', 'A3', 'A4', 'A2'];
const B_ROTATION: ExerciseTypeCode[] = ['B1', 'B2', 'B3'];
const C_ROTATION_BASE: ExerciseTypeCode[] = ['C1', 'C3', 'C4', 'C2'];
/** Bài 3 của M3 — nhận diện lần 2 (A3 trước vì A2 cần audio). */
const M3_RECHECK_ROTATION: ExerciseTypeCode[] = ['A3', 'A2'];
/** Từ đã học — chỉ xoay C1/C3 (sheet 06). */
const LEARNED_ROTATION: ExerciseTypeCode[] = ['C1', 'C3'];

const D3_MIN_PAIRS = 3;
const D3_DEFAULT_MAX_PAIRS = 5;
/** TOPIC: quá ngưỡng này thì chia nhỏ D3 (sheet 06: "> 8 từ"). */
const D3_SPLIT_THRESHOLD = 8;

/**
 * Con trỏ xoay vòng 1 nhóm — DÙNG CHUNG cho cả chuỗi từ, nhờ đó 2 từ
 * liền kề cùng nhóm tự động khác dạng ("C1 đã dùng → xoay sang C3").
 */
class Rotor {
  private idx = 0;
  constructor(private readonly order: ExerciseTypeCode[]) {}

  /**
   * Lấy dạng khả dụng kế tiếp theo vòng xoay (bỏ qua dạng thiếu dữ liệu
   * và dạng vừa dùng ở từ liền trước nếu còn lựa chọn khác), rồi tiến
   * con trỏ qua dạng đã chọn. Không còn dạng nào khả dụng → null.
   */
  next(
    available: ReadonlySet<ExerciseTypeCode>,
    avoid?: ExerciseTypeCode | null,
  ): ExerciseTypeCode | null {
    let fallback: { type: ExerciseTypeCode; step: number } | null = null;
    for (let step = 0; step < this.order.length; step++) {
      const t = this.order[(this.idx + step) % this.order.length];
      if (!available.has(t)) continue;
      if (avoid && t === avoid) {
        // Trùng với từ liền trước → chỉ dùng khi không còn lựa chọn khác.
        fallback = fallback ?? { type: t, step };
        continue;
      }
      this.idx = (this.idx + step + 1) % this.order.length;
      return t;
    }
    if (fallback) {
      this.idx = (this.idx + fallback.step + 1) % this.order.length;
      return fallback.type;
    }
    return null;
  }
}

/** Vòng xoay nhóm C theo level: C5 chỉ tham gia từ level 3+ (sheet 07 + 00). */
function cRotationFor(userLevel: number): ExerciseTypeCode[] {
  return userLevel >= 3 ? [...C_ROTATION_BASE, 'C5'] : C_ROTATION_BASE;
}

/** M3 nhóm C — danh sách ƯU TIÊN theo level (sheet 06). */
function m3CPreference(userLevel: number): ExerciseTypeCode[] {
  return userLevel >= 4 ? ['C2', 'C5'] : ['C1', 'C3', 'C4'];
}

interface SlotContext {
  available: ReadonlySet<ExerciseTypeCode>;
  /** Dạng đã dùng theo nhóm ở TỪ LIỀN TRƯỚC (quy tắc không trùng). */
  prevByGroup: ReadonlyMap<string, ExerciseTypeCode>;
}

/**
 * Sinh kế hoạch bài tập cho 1 cluster từ (gốc từ hoặc chủ đề).
 * Trả về danh sách bài theo đúng thứ tự hiển thị; bài không đủ dữ liệu
 * (nhóm không còn dạng khả dụng) sẽ bị bỏ qua thay vì sinh bài rỗng.
 */
export function generateExercisePlan(
  words: PlanWordInput[],
  options: PlanOptions,
): PlannedExercise[] {
  const mode: PlanMode = options.mode;
  const userLevel = options.userLevel ?? 1;

  const rotors = {
    A: new Rotor(A_ROTATION),
    B: new Rotor(B_ROTATION),
    C: new Rotor(cRotationFor(userLevel)),
    recheck: new Rotor(M3_RECHECK_ROTATION),
    learned: new Rotor(LEARNED_ROTATION),
  };

  const plan: PlannedExercise[] = [];
  /** Dạng theo nhóm của từ liền trước — cho quy tắc không trùng. */
  let prevByGroup = new Map<string, ExerciseTypeCode>();

  for (const word of words) {
    const available = new Set(word.availableTypes);
    const ctx: SlotContext = { available, prevByGroup };
    const usedByGroup = new Map<string, ExerciseTypeCode>();
    let slot = 0;

    const push = (
      type: ExerciseTypeCode | null,
      extra?: Partial<PlannedExercise>,
    ) => {
      if (!type) return;
      slot += 1;
      usedByGroup.set(groupOf(type), type);
      plan.push({
        wordId: word.wordId,
        type,
        group: groupOf(type),
        slot,
        ...extra,
      });
    };

    if (word.learned) {
      // ★ Đã học: 1 bài C1/C3 kiểm tra ngữ cảnh mới; sai → hàng đợi ôn tập.
      // Không xét Hán Việt, không dùng dạng gốc từ. Vẫn góp mặt ở D3 cuối.
      push(pickRotated(rotors.learned, 'C', ctx), { reviewOnWrong: true });
    } else if (word.hanViet === 'M1') {
      if (mode === 'ROOT') {
        // M1 gốc từ: D1 → C (HV khớp nên bỏ nhóm A/B).
        push(available.has('D1') ? 'D1' : null);
      } else {
        // M1 chủ đề: không có D1 → thay bằng nhóm A.
        push(pickRotated(rotors.A, 'A', ctx));
      }
      push(pickRotated(rotors.C, 'C', ctx));
    } else if (word.hanViet === 'M2') {
      // M2: A → (D1 nếu ROOT và có dữ liệu, thiếu thì B) → C.
      push(pickRotated(rotors.A, 'A', ctx));
      if (mode === 'ROOT' && available.has('D1')) {
        push('D1'); // D1 chấp nhận trùng dạng giữa các từ (sheet 07).
      } else {
        push(pickRotated(rotors.B, 'B', ctx));
      }
      push(pickRotated(rotors.C, 'C', ctx));
    } else {
      // M3: A1 (cảnh báo, cố định — sheet 07) → B → A2/A3 → C (ưu tiên theo level).
      const first = available.has('A1')
        ? 'A1'
        : available.has('A4')
          ? 'A4' // sheet 06 cho phép A4 khi A1 thiếu dữ liệu
          : null;
      push(first, { confusionWarning: true });
      push(pickRotated(rotors.B, 'B', ctx));
      push(pickRotated(rotors.recheck, 'A', ctx));
      push(
        pickPreferred(m3CPreference(userLevel), ctx) ??
          pickRotated(rotors.C, 'C', ctx),
      );
    }

    prevByGroup = usedByGroup;
  }

  // ── Khối tổng kết (sau tất cả từ) ────────────────────────────────
  const allWordIds = words.map((w) => w.wordId);

  if (mode === 'ROOT') {
    // D2 × n pattern — chọn pattern nghĩa (không thuộc công thức M1/M2/M3).
    const n = options.patternCount ?? 0;
    for (let i = 0; i < n; i++) {
      plan.push({
        wordId: null,
        type: 'D2',
        group: 'D',
        slot: 0,
        patternIndex: i,
      });
    }
    // D3 ×1 — nối từ tổng kết, LUÔN là bài cuối cùng (gồm cả từ đã học).
    if (allWordIds.length > 0) {
      plan.push({
        wordId: null,
        type: 'D3',
        group: 'D',
        slot: 0,
        wordIds: allWordIds,
      });
    }
  } else {
    // TOPIC: chỉ D3; chủ đề > 8 từ → chia thành nhiều bài 3–5 cặp (sheet 06).
    for (const chunk of chunkForD3(
      allWordIds,
      options.d3MaxPairs ?? D3_DEFAULT_MAX_PAIRS,
    )) {
      plan.push({
        wordId: null,
        type: 'D3',
        group: 'D',
        slot: 0,
        wordIds: chunk,
      });
    }
  }

  return plan;
}

/** Chọn theo vòng xoay + quy tắc không trùng với từ liền trước. */
function pickRotated(
  rotor: Rotor,
  group: string,
  ctx: SlotContext,
): ExerciseTypeCode | null {
  return rotor.next(ctx.available, ctx.prevByGroup.get(group) ?? null);
}

/**
 * Chọn theo danh sách ưu tiên (M3 nhóm C): lấy dạng đầu tiên có dữ liệu
 * và không trùng từ liền trước; cả danh sách đều trùng/thiếu → null
 * (caller rơi về vòng xoay chuẩn).
 */
function pickPreferred(
  preference: ExerciseTypeCode[],
  ctx: SlotContext,
): ExerciseTypeCode | null {
  for (const t of preference) {
    if (!ctx.available.has(t)) continue;
    if (ctx.prevByGroup.get(groupOf(t)) === t) continue;
    return t;
  }
  return null;
}

/**
 * Chia danh sách từ cho bài D3: ≤ ngưỡng → 1 bài; vượt ngưỡng → nhiều bài
 * 3–5 cặp, chia đều để không có bài quá mỏng (vd 10 từ → 5+5, 11 → 4+4+3).
 */
export function chunkForD3(
  wordIds: string[],
  maxPairs = D3_DEFAULT_MAX_PAIRS,
): string[][] {
  if (wordIds.length === 0) return [];
  if (wordIds.length <= Math.max(D3_SPLIT_THRESHOLD, maxPairs)) {
    return [wordIds];
  }
  const max = Math.max(D3_MIN_PAIRS, maxPairs);
  const parts = Math.ceil(wordIds.length / max);
  const base = Math.floor(wordIds.length / parts);
  let remainder = wordIds.length % parts;
  const chunks: string[][] = [];
  let cursor = 0;
  for (let i = 0; i < parts; i++) {
    const size = base + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder--;
    chunks.push(wordIds.slice(cursor, cursor + size));
    cursor += size;
  }
  return chunks;
}
