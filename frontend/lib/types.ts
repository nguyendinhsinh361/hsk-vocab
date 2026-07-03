// Kiểu dữ liệu MVP: hồ sơ người dùng + luồng luyện tập (onboarding → practice).

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  xp: number;
  level: number;
  streak: number;
}

/* ------------------------------------------------------------------ *
 * MÀN TRANG CHỦ (home) — GET /home.
 * ------------------------------------------------------------------ */

export interface RootMini {
  id: string;
  hz: string;
  py: string;
  hv: string;
}

export interface TopicGroup {
  id: string;
  title: string;
  rootCount: number;
  startRootId: string | null;
  active: boolean;
}

export interface HomeData {
  user: {
    name: string;
    level: number;
    learnedRoots: number;
    totalRoots: number;
  };
  continueLearning: { topicTitle: string; root: RootMini } | null;
  topicGroups: TopicGroup[];
  popularRoots: RootMini[];
}

/* ------------------------------------------------------------------ *
 * LUỒNG LUYỆN TẬP (practice flow) — khớp model HSK mới + Figma.
 * GET /practice/session → PracticeSession; POST /practice/answer → PracticeResult.
 * ------------------------------------------------------------------ */

export type PracticeStepKind = 'TEACH' | 'PATTERN' | 'QUIZ';

/** 1 ô "Phân tích chữ" (thành tố gốc của từ ghép). */
export interface CharPart {
  hz: string;
  hv: string;
  gloss: string;
}

export interface PracticeExample {
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
  meaning: string;
  parts: CharPart[];
  options: string[];
  answerIndex: number;
  explanation: string;
  example: PracticeExample;
  audioUrl: string | null;
}

/** PATTERN — màn Trailer lộ công thức gốc từ. */
export interface PatternStep {
  kind: 'PATTERN';
  rootId: string;
  hz: string;
  py: string;
  hv: string;
  title: string;
  patterns: {
    formula: string;
    meaning: string;
    examples: PracticeExample[];
  }[];
}

/** QUIZ — màn Test. Generic đa dạng bài. */
export type QuizVariant = 'mcq' | 'boolean' | 'input' | 'audio';

export interface QuizStep {
  kind: 'QUIZ';
  exerciseId: string;
  type: string;
  variant: QuizVariant;
  title: string;
  /** Đề bài đầy đủ (có thể nhiều dòng, chứa ___). */
  question: string;
  /** Nếu đề xoay quanh 1 từ đơn → hiện thẻ chữ lớn. */
  word?: { hz: string; py: string } | null;
  prompt?: string;
  audioText?: string;
  options: string[];
  answerIndex: number;
  answerText?: string;
  explanation: string;
}

export type PracticeStep = TeachStep | PatternStep | QuizStep;

export interface PracticeSession {
  sessionId: string;
  rootId: string;
  root: { hz: string; py: string; hv: string };
  totalQuiz: number;
  steps: PracticeStep[];
}

export interface PracticeResult {
  correct: boolean;
  answerIndex: number;
  answerText?: string;
  explanation: string;
}

/** Kết quả hoàn thành phiên — POST /practice/complete. */
export interface PracticeComplete {
  correct: number;
  total: number;
  xpEarned: number;
  totalXp: number;
  level: number;
  streak: number;
}
