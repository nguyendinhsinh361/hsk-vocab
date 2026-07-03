/**
 * Kiểu dữ liệu cho LUỒNG LUYỆN TẬP (practice flow) — khớp Figma "Trailer → Pattern → Test".
 * Nguồn dữ liệu: model HSK mới (Root / Word / RootPattern / WordRoot / Exercise).
 *
 * 1 phiên = danh sách `steps` có thứ tự sư phạm:
 *   TEACH   (Trailer)  — dạy 1 từ: chữ Hán + phân tích chữ + chọn nghĩa + giải thích
 *   PATTERN (Trailer)  — lộ pattern gốc từ: "1 gốc → hàng loạt từ"
 *   QUIZ    (Test)     — câu hỏi trắc nghiệm (bắt đầu từ A1: nhìn chữ → chọn nghĩa)
 * FE chạy state machine theo `steps`, màn tổng kết tính từ số câu QUIZ đúng.
 */

/** 1 ô "Phân tích chữ" — mỗi thành tố (gốc) của từ ghép. */
export interface CharPart {
  /** Chữ Hán của thành tố, vd 工. */
  hz: string;
  /** Âm Hán-Việt, vd "Công". */
  hv: string;
  /** Nghĩa gợi nhớ ngắn, vd "Thợ/việc". */
  gloss: string;
}

/** Câu ví dụ minh hoạ. */
export interface Example {
  hz: string;
  py: string;
  meaning: string;
}

/** TEACH — màn Trailer dạy 1 từ. */
export interface TeachStep {
  kind: 'TEACH';
  wordId: string;
  hz: string;
  py: string;
  hv: string;
  /** Nghĩa đúng (đáp án của phần "chọn nghĩa"). */
  meaning: string;
  /** Phân tích chữ (các gốc thành phần). */
  parts: CharPart[];
  /** 4 lựa chọn nghĩa. */
  options: string[];
  /** Chỉ số đáp án đúng trong `options`. */
  answerIndex: number;
  /** Giải thích + câu ví dụ (hiện sau khi "Kiểm tra"). */
  explanation: string;
  example: Example;
  audioUrl: string | null;
}

/** PATTERN — màn Trailer lộ công thức gốc từ. */
export interface PatternStep {
  kind: 'PATTERN';
  rootId: string;
  hz: string;
  py: string;
  hv: string;
  /** Tiêu đề, vd "Nhận ra pattern để ra từ mới". */
  title: string;
  patterns: {
    /** Công thức, vd "___+人". */
    formula: string;
    /** Nghĩa của pattern. */
    meaning: string;
    examples: Example[];
  }[];
}

/** Kiểu hiển thị câu hỏi QUIZ. */
export type QuizVariant = 'mcq' | 'boolean' | 'input' | 'audio';

/** QUIZ — màn Test. Generic cho nhiều dạng bài (A1..D3, trừ ảnh/nối từ). */
export interface QuizStep {
  kind: 'QUIZ';
  exerciseId: string;
  /** Dạng bài (A1..D3). */
  type: string;
  /** Cách render: trắc nghiệm / đúng-sai / gõ chữ / nghe. */
  variant: QuizVariant;
  /** Tên dạng, vd "Chọn nghĩa". */
  title: string;
  /** Đề bài đầy đủ (có thể nhiều dòng, chứa ___). Dùng khi KHÔNG có word card. */
  question: string;
  /** Nếu đề xoay quanh 1 từ đơn → hiện thẻ chữ lớn (A1/A4). */
  word?: { hz: string; py: string } | null;
  /** Prompt ngắn dưới word card (vd "Nghĩa là gì nhỉ?"). */
  prompt?: string;
  /** Chuỗi để phát audio (variant='audio'). */
  audioText?: string;
  /** Đáp án trắc nghiệm/đúng-sai. */
  options: string[];
  /** Chỉ số đáp án đúng (mcq/boolean); -1 nếu variant='input'. */
  answerIndex: number;
  /** Đáp án đúng dạng chữ (variant='input'). */
  answerText?: string;
  explanation: string;
}

export type PracticeStep = TeachStep | PatternStep | QuizStep;

/** Payload trả về cho FE khi bắt đầu 1 phiên luyện tập. */
export interface PracticeSessionDto {
  sessionId: string;
  rootId: string;
  root: { hz: string; py: string; hv: string };
  /** Số câu QUIZ (để FE tính tiến trình / tổng kết). */
  totalQuiz: number;
  steps: PracticeStep[];
}

/** Kết quả chấm 1 câu QUIZ. */
export interface PracticeAnswerDto {
  correct: boolean;
  answerIndex: number;
  /** Đáp án đúng dạng chữ (variant='input'). */
  answerText?: string;
  explanation: string;
}

/** Kết quả hoàn thành 1 phiên luyện tập (đã lưu DB). */
export interface PracticeCompleteDto {
  /** Số câu đúng trong phiên. */
  correct: number;
  /** Tổng số câu QUIZ. */
  total: number;
  /** XP kiếm được phiên này. */
  xpEarned: number;
  /** Tổng XP của user sau phiên. */
  totalXp: number;
  /** Cấp độ user sau phiên. */
  level: number;
  /** Chuỗi ngày học liên tiếp sau phiên. */
  streak: number;
}
