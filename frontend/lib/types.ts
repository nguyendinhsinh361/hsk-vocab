export type HskLevel = 'HSK1' | 'HSK2' | 'HSK3' | 'HSK4' | 'HSK5' | 'HSK6';
export type QuizMode = 'RECOGNITION' | 'RECALL' | 'MIXED';

export interface DeckSummary {
  id: string;
  name: string;
  description: string | null;
  level: HskLevel;
  _count: { cards: number };
}

export interface Card {
  id: string;
  deckId: string;
  character: string;
  pinyin: string;
  meaning: string | null;
  level: HskLevel;
  position: number;
  parentId: string | null;
}

export interface WordTreeNode extends Card {
  children: Card[];
}

export interface ClientQuestion {
  cardId: string;
  prompt: string;
  options: string[];
}

export interface StartQuizResponse {
  sessionId: string;
  mode: QuizMode;
  total: number;
  questions: ClientQuestion[];
}

export interface AnswerResponse {
  correct: boolean;
  correctAnswer: string;
}

export interface CompleteResponse {
  sessionId: string;
  total: number;
  correctCount: number;
  xpEarned: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  xp: number;
  level: number;
  streak: number;
}
