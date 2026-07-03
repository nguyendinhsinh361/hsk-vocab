'use client';

/**
 * Phiên đăng nhập MVP: lưu userId + hồ sơ vào localStorage.
 * api.ts đọc userId → gửi header `x-user-id`. Khi có auth thật (JWT) → thay bằng token.
 */

import type { UserProfile } from './types';

const USER_ID_KEY = 'migii.userId';
const USER_KEY = 'migii.user';

export function getUserId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(USER_ID_KEY);
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

export function setSession(user: UserProfile): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(USER_ID_KEY, user.id);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(USER_ID_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function isLoggedIn(): boolean {
  return !!getUserId();
}
