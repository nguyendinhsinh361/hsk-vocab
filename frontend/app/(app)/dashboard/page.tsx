'use client';

/**
 * MÀN: Dashboard (hub) — theo Figma "Desktop-3".
 * Mục đích: trung tâm điều hướng; chào user, hiển thị tiến độ level + danh sách nhóm từ.
 * Thành phần: greeting (user), thẻ Level (xp/level/streak), "Danh sách nhóm từ" (grid DeckCard).
 * CTA & điều hướng: click 1 nhóm từ → /decks/[id]. (DeckCard điều hướng nội bộ.)
 * States: loading / error / empty (chưa có deck) / loaded.
 * Route: /dashboard   ·   API: GET /users/me, GET /decks?level=
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { getLevel } from '@/lib/prefs';
import type { DeckSummary, UserProfile } from '@/lib/types';
import { DeckCard } from '@/components/DeckCard';

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [decks, setDecks] = useState<DeckSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const level = getLevel() ?? undefined;
    Promise.all([api.me(), api.decks(level)])
      .then(([u, d]) => {
        setUser(u);
        setDecks(d);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">
          Chào {user?.name ?? 'bạn'}! 👋
        </h1>
        <p className="mt-1 text-neutral-500">Khám phá thế giới từ vựng ngay!</p>
      </div>

      {/* Level card */}
      {user && (
        <div className="rounded-2xl bg-primary text-white p-6 shadow-soft flex items-center justify-between">
          <div>
            <div className="text-sm opacity-90">Cấp độ hiện tại</div>
            <div className="text-3xl font-extrabold">Level {user.level}</div>
            <div className="mt-1 text-sm opacity-90">
              {user.xp} XP · 🔥 {user.streak} ngày streak
            </div>
          </div>
          <Link
            href="/onboarding/level"
            className="rounded-full bg-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/30"
          >
            Đổi level
          </Link>
        </div>
      )}

      {/* Word groups */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-neutral-800">Danh sách nhóm từ</h2>
        </div>

        {error && (
          <p className="mt-4 rounded-xl bg-danger/10 text-danger p-4">
            Lỗi tải dữ liệu: {error}
          </p>
        )}
        {!decks && !error && <p className="mt-4 text-neutral-400">Đang tải…</p>}
        {decks && decks.length === 0 && (
          <p className="mt-4 text-neutral-400">Chưa có nhóm từ cho level này.</p>
        )}
        {decks && decks.length > 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decks.map((d) => (
              <DeckCard key={d.id} deck={d} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
