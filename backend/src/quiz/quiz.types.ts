import { QuizMode } from '@prisma/client';

export interface QuizCard {
  id: string;
  character: string;
  pinyin: string;
  meaning: string | null;
}

/** Câu hỏi lưu server-side (Redis) — KHÔNG gửi correctAnswer cho client. */
export interface StoredQuestion {
  cardId: string;
  prompt: string; // đề bài (chữ Hán hoặc nghĩa, tuỳ mode)
  options: string[]; // các đáp án (đã trộn)
  correctAnswer: string;
}

export interface StoredQuiz {
  mode: QuizMode;
  questions: StoredQuestion[];
}

/** Câu hỏi gửi cho client (ẩn đáp án đúng). */
export type ClientQuestion = Omit<StoredQuestion, 'correctAnswer'>;

/** Fisher–Yates shuffle — KHÔNG mutate input. */
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Dựng bộ câu hỏi trắc nghiệm từ danh sách card.
 * - RECOGNITION: đề = chữ Hán, đáp án = nghĩa tiếng Việt.
 * - RECALL: đề = nghĩa, đáp án = chữ Hán.
 * - MIXED: trộn 2 kiểu theo từng card.
 * Mỗi câu có tối đa 4 đáp án (1 đúng + tối đa 3 nhiễu), vị trí được trộn.
 */
export function buildQuestions(
  cards: readonly QuizCard[],
  mode: QuizMode,
): StoredQuestion[] {
  // Chỉ dùng card có nghĩa (cần để tạo đáp án nghĩa).
  const usable = cards.filter((c) => c.meaning && c.meaning.trim().length > 0);

  const questions: StoredQuestion[] = usable.map((card) => {
    const perCardMode =
      mode === QuizMode.MIXED
        ? Math.random() < 0.5
          ? QuizMode.RECOGNITION
          : QuizMode.RECALL
        : mode;

    const isRecognition = perCardMode === QuizMode.RECOGNITION;
    const correctAnswer = isRecognition ? card.meaning! : card.character;
    const prompt = isRecognition ? card.character : card.meaning!;

    const distractors = shuffle(
      usable
        .filter((c) => c.id !== card.id)
        .map((c) => (isRecognition ? c.meaning! : c.character)),
    ).slice(0, 3);

    return {
      cardId: card.id,
      prompt,
      correctAnswer,
      options: shuffle([correctAnswer, ...distractors]),
    };
  });

  return shuffle(questions);
}
