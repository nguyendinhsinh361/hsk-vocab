'use client';

/**
 * Phiên đăng nhập: lưu access token (JWT) + hồ sơ vào localStorage.
 * api.ts đọc token → gửi header `Authorization: Bearer <token>`.
 * Không còn gửi x-user-id (BE không tin id do client tự khai).
 */

import type { UserProfile } from './types';

const TOKEN_KEY = 'migii.accessToken';
const USER_KEY = 'migii.user';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function setSession(user: UserProfile, accessToken: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, accessToken);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  // Dọn key cũ (phiên bản trước lưu userId).
  window.localStorage.removeItem('migii.userId');
}

export function isLoggedIn(): boolean {
  return !!getToken();
}
