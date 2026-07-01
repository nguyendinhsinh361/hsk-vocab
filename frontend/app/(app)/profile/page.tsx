'use client';

// MÀN: Hồ sơ (placeholder — hiển thị thông tin user từ fake data). Route: /profile · API: GET /users/me
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { UserProfile } from '@/lib/types';

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  useEffect(() => {
    api.me().then(setUser).catch(() => {});
  }, []);
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-neutral-800">Hồ sơ</h1>
      {user && (
        <div className="mt-4 rounded-2xl bg-white border border-neutral-200 shadow-soft p-6">
          <div className="text-lg font-semibold text-neutral-800">{user.name}</div>
          <div className="text-sm text-neutral-500">{user.email}</div>
          <div className="mt-3 text-sm text-neutral-700">Level {user.level} · {user.xp} XP · 🔥 {user.streak} ngày</div>
        </div>
      )}
    </div>
  );
}
