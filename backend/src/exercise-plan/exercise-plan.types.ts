/**
 * KIỂU DỮ LIỆU cho thuật toán sinh bài tập ("BNPD - Logic bài tập").
 * Module thuần domain — không phụ thuộc Prisma/HTTP để dùng chung được
 * (luyện tập theo gốc từ, theo chủ đề, ôn tập... sau này).
 */

/** 15 dạng bài — 4 nhóm chức năng (sheet "00. Tổng hợp dạng bài"). */
export type ExerciseTypeCode =
  | 'A1' // Nhìn chữ Hán → chọn nghĩa
  | 'A2' // Nghe audio → chọn từ (optional — cần audio)
  | 'A3' // Đúng/Sai (nghĩa)
  | 'A4' // Nhìn chữ Hán → chọn phiên âm & nghĩa
  | 'B1' // Nhìn nghĩa → chọn chữ Hán
  | 'B2' // Nhìn ảnh → chọn từ (optional — cần ảnh)
  | 'B3' // Gõ phiên âm → chọn chữ Hán
  | 'C1' // Điền trống (câu đơn)
  | 'C2' // Chọn câu đúng
  | 'C3' // Đúng/Sai (cách dùng)
  | 'C4' // Điền trống (hội thoại)
  | 'C5' // Đặt câu (chỉ level 3+)
  | 'D1' // Cho gốc ghép từ (từng từ)
  | 'D2' // Chọn pattern nghĩa (tổng kết gốc)
  | 'D3'; // Nối từ (tổng kết — luôn cuối cùng)

/** Nhóm chức năng: A nhận diện · B ghi nhớ chủ động · C vận dụng · D gốc từ/tổng kết. */
export type ExerciseGroupCode = 'A' | 'B' | 'C' | 'D';

export function groupOf(type: ExerciseTypeCode): ExerciseGroupCode {
  return type.charAt(0) as ExerciseGroupCode;
}

/** Độ liên kết Hán Việt của từ (sheet 06): M1 khớp · M2 lệch một phần · M3 lệch/dễ nhầm. */
export type HanVietLink = 'M1' | 'M2' | 'M3';

/** Chế độ sinh bài: theo GỐC TỪ (có D1/D2) hoặc theo CHỦ ĐỀ (không D1/D2). */
export type PlanMode = 'ROOT' | 'TOPIC';

/** Đầu vào cho 1 từ trong cluster (đã sắp theo thứ tự học). */
export interface PlanWordInput {
  wordId: string;
  /** Độ liên kết Hán Việt. Bỏ qua nếu `learned` = true. */
  hanViet: HanVietLink;
  /** Từ user đã học ở gốc/chủ đề trước → công thức riêng (≤2 bài). */
  learned?: boolean;
  /**
   * Các dạng bài CÓ DỮ LIỆU cho từ này (đã tính optional: A2 cần audio,
   * B2 cần ảnh, C2 cần câu sai...). Dạng không nằm trong đây sẽ bị bỏ
   * qua khi xoay vòng.
   */
  availableTypes: ExerciseTypeCode[];
}

export interface PlanOptions {
  mode: PlanMode;
  /** Level người học (HSK 1–6). Ảnh hưởng vòng xoay nhóm C (C5, C2). Mặc định 1. */
  userLevel?: number;
  /** ROOT mode: số pattern của gốc → sinh D2 × n. */
  patternCount?: number;
  /** TOPIC mode: số cặp tối đa mỗi bài D3 khi chia nhỏ (mặc định 5, tối thiểu 3). */
  d3MaxPairs?: number;
}

/** 1 bài tập đã lên kế hoạch. */
export interface PlannedExercise {
  /** Từ áp dụng; null với bài tổng kết (D2/D3). */
  wordId: string | null;
  type: ExerciseTypeCode;
  group: ExerciseGroupCode;
  /** Thứ tự bài trong phạm vi 1 từ (1-based); 0 với bài tổng kết. */
  slot: number;
  /** M3 bài 1 (A1): hiển thị kèm cảnh báo dễ nhầm. */
  confusionWarning?: boolean;
  /** Từ đã học: trả lời sai → đưa vào hàng đợi ôn tập. */
  reviewOnWrong?: boolean;
  /** D2: chỉ số pattern (0-based) của gốc. */
  patternIndex?: number;
  /** D3: các từ trong bài nối (gồm cả từ đã học). */
  wordIds?: string[];
}
