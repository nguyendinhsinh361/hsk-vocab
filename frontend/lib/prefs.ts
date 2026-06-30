'use client';

import type { HskLevel } from './types';

// Lưu level đã chọn ở onboarding (tạm dùng localStorage; khi có auth → lưu theo user).
const LEVEL_KEY = 'migii:level';

export function getLevel(): HskLevel | null {
  if (typeof window === 'undefined') return null;
  return (localStorage.getItem(LEVEL_KEY) as HskLevel) || null;
}

export function setLevel(level: HskLevel): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LEVEL_KEY, level);
}
