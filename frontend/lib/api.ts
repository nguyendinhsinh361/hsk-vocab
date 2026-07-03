import type {
  UserProfile,
  PracticeSession,
  PracticeResult,
  PracticeComplete,
  HomeData,
} from './types';
import { getUserId } from './session';

const BASE = '/api';

// MVP: gửi x-user-id (từ phiên đăng nhập) để BE resolve user.
// Khi thêm auth token → thay bằng Authorization: Bearer <token>.
function headers(json = false): HeadersInit {
  const h: Record<string, string> = {};
  if (json) h['Content-Type'] = 'application/json';
  const uid = getUserId();
  if (uid) h['x-user-id'] = uid;
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

  // ---- Xác thực (email + mật khẩu) ----
  register: (email: string, name: string, password: string) =>
    req<{ user: UserProfile }>('/auth/register', {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify({ email, name, password }),
    }),
  login: (email: string, password: string) =>
    req<{ user: UserProfile }>('/auth/login', {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify({ email, password }),
    }),

  home: () => req<HomeData>('/home', { headers: headers() }),

  // ---- Luồng luyện tập (Trailer → Pattern → Test) ----
  practiceSession: (root = 'people') =>
    req<PracticeSession>(`/practice/session?root=${encodeURIComponent(root)}`, {
      headers: headers(),
    }),
  practiceAnswer: (
    sessionId: string,
    exerciseId: string,
    optionIndex: number,
    text?: string,
  ) =>
    req<PracticeResult>('/practice/answer', {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify({ sessionId, exerciseId, optionIndex, text }),
    }),

  // Hoàn thành phiên → BE cập nhật XP/level/streak + tiến trình.
  practiceComplete: (sessionId: string) =>
    req<PracticeComplete>('/practice/complete', {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify({ sessionId }),
    }),
};
