import type {
  UserProfile,
  PracticeSession,
  PracticeResult,
  PracticeComplete,
  PracticeHistoryItem,
  HomeData,
} from './types';
import { getToken } from './session';

const BASE = '/api';

// Đăng nhập rồi → gửi Bearer token (BE verify chữ ký).
// Khách (không token) → BE dùng demo user.
function headers(json = false): HeadersInit {
  const h: Record<string, string> = {};
  if (json) h['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) h['Authorization'] = `Bearer ${token}`;
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

  // ---- Xác thực (email + mật khẩu) → hồ sơ + access token ----
  register: (email: string, name: string, password: string) =>
    req<{ user: UserProfile; accessToken: string }>('/auth/register', {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify({ email, name, password }),
    }),
  login: (email: string, password: string) =>
    req<{ user: UserProfile; accessToken: string }>('/auth/login', {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify({ email, password }),
    }),

  home: () => req<HomeData>('/home', { headers: headers() }),

  // ---- Luồng luyện tập (Trailer → Pattern → Test) ----
  // POST vì tạo phiên có side-effect (ghi PracticeSession vào DB).
  practiceSession: (root = 'people') =>
    req<PracticeSession>('/practice/sessions', {
      method: 'POST',
      headers: headers(true),
      body: JSON.stringify({ root }),
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

  // Lịch sử luyện tập của user.
  practiceHistory: () =>
    req<PracticeHistoryItem[]>('/practice/history', { headers: headers() }),

  // ---- Hàng đợi ôn tập (từ đã học trả lời sai) ----
  reviewQueue: () =>
    req<{ due: number; words: { id: string; hz: string; py: string; hv: string }[] }>(
      '/review/queue',
      { headers: headers() },
    ),
  // Tạo phiên ôn — chấm & hoàn thành dùng chung endpoint practice.
  reviewSession: () =>
    req<PracticeSession>('/review/sessions', {
      method: 'POST',
      headers: headers(true),
    }),
};
