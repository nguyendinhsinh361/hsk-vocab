import type {
  DeckSummary,
  Card,
  WordTreeNode,
  StartQuizResponse,
  AnswerResponse,
  CompleteResponse,
  UserProfile,
  QuizMode,
} from './types';

const BASE = '/api';

// MVP chưa có auth: gửi x-user-id để BE resolve (xem backend/common/current-user.decorator.ts).
// Khi thêm auth → thay bằng Authorization: Bearer <token>.
function headers(json = false): HeadersInit {
  const h: Record<string, string> = {};
  if (json) h['Content-Type'] = 'application/json';
  return h;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  me: () => req<UserProfile>('/users/me', { headers: headers() }),

  decks: (level?: string) =>
    req<DeckSummary[]>(`/decks${level ? `?level=${level}` : ''}`, {
      headers: headers(),
    }),
  deckCards: (deckId: string) =>
    req<Card[]>(`/decks/${deckId}/cards`, { headers: headers() }),
  wordTree: (deckId: string) =>
    req<WordTreeNode[]>(`/decks/${deckId}/tree`, { headers: headers() }),

  startQuiz: (deckId: string, mode: QuizMode = 'RECOGNITION') =>
    req<StartQuizResponse>('/quiz/start', {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify({ deckId, mode }),
    }),
  answer: (sessionId: string, cardId: string, answer: string) =>
    req<AnswerResponse>('/quiz/answer', {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify({ sessionId, cardId, answer }),
    }),
  complete: (sessionId: string) =>
    req<CompleteResponse>(`/quiz/${sessionId}/complete`, {
      method: 'POST',
      headers: headers(),
    }),
};
