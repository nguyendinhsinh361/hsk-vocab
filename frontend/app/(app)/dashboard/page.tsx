'use client';

/**
 * MÀN: Dashboard web (Figma "Desktop-3", 1440×1000).
 * Mục đích: hub học tập — chào user, từ trong ngày, danh sách nhóm từ, gốc từ phổ biến,
 *   level progress, khám phá họ từ (cây từ), tóm tắt bài học.
 * Bố cục: 2 cột nội dung (trái ~380 danh sách từ · phải khám phá) — sidebar 272 ở app layout.
 * CTA & điều hướng: nhóm từ → /decks/[id]; "Khám phá tiếp"/"Làm bài ngay" → /decks/people, /quiz/people.
 * States: loading / error / loaded.
 * Route: /dashboard  ·  API: GET /users/me, GET /decks, GET /decks/people/tree
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';
import type { DeckSummary, UserProfile, WordTreeNode } from '@/lib/types';

export default function DashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [tree, setTree] = useState<WordTreeNode[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.me(), api.decks(), api.wordTree('people')])
      .then(([u, d, t]) => {
        setUser(u);
        setDecks(d);
        setTree(t);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  const root = tree[0];

  if (error) {
    return <p className="rounded-xl bg-danger/10 text-danger p-4">Lỗi tải dữ liệu: {error}</p>;
  }

  return (
    <div className="max-w-[1100px] mx-auto grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
      {/* ===== Cột trái: danh sách từ ===== */}
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Chào {user?.name ?? 'bạn'}! 👋</h1>
          <p className="mt-1 text-neutral-500">Khám phá thế giới từ vựng ngay!</p>
        </div>

        {/* Từ trong ngày */}
        {root && (
          <div className="rounded-2xl bg-white border border-neutral-200 shadow-soft p-4 flex items-center gap-4">
            <div className="size-[50px] rounded-xl bg-primary-100 flex items-center justify-center">
              <span className="font-han text-[24px] text-primary-700" lang="zh">{root.character}</span>
            </div>
            <div className="flex-1">
              <div className="text-sm text-primary font-medium">{root.pinyin}</div>
              <div className="font-semibold text-neutral-800">{root.meaning}</div>
            </div>
            <Link href={`/decks/people`} className="h-9 px-4 rounded-full bg-primary text-white text-sm font-semibold flex items-center">
              Học
            </Link>
          </div>
        )}

        {/* Danh sách nhóm từ */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-neutral-800">Danh sách nhóm từ</h2>
            <Link href="/decks/people" className="text-sm text-primary font-medium flex items-center">
              Xem thêm <ChevronRight size={16} />
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {decks.map((d) => (
              <Link
                key={d.id}
                href={`/decks/${d.id}`}
                className="rounded-2xl bg-white border border-neutral-200 shadow-soft p-3 hover:border-primary-300 transition-colors"
              >
                <div className="size-[36px] rounded-lg bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                  {d.name.charAt(0)}
                </div>
                <div className="mt-2 font-semibold text-[14px] text-neutral-800 leading-tight">{d.name}</div>
                <div className="text-[12px] text-neutral-500">{d._count.cards} gốc từ</div>
              </Link>
            ))}
          </div>
        </section>

        {/* Gốc từ phổ biến */}
        <section>
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-neutral-800">Gốc từ phổ biến</h2>
          </div>
          <div className="mt-3 flex items-center gap-2 h-10 rounded-full bg-white border border-neutral-200 px-4 text-neutral-400">
            <Search size={16} />
            <span className="text-sm">Tìm kiếm gốc từ...</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {tree.map((r) => (
              <div key={r.id} className="rounded-2xl bg-white border border-neutral-200 shadow-soft p-3 flex items-center gap-3">
                <span className="font-han text-[22px] text-neutral-800" lang="zh">{r.character}</span>
                <div className="min-w-0">
                  <div className="text-[12px] text-primary">{r.pinyin}</div>
                  <div className="text-[13px] text-neutral-700 truncate">{r.meaning}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* ===== Cột phải: khám phá ===== */}
      <div className="space-y-6">
        {/* Level card */}
        {user && (
          <div className="rounded-2xl bg-gradient-to-r from-primary to-primary-700 text-white p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-extrabold">Level {user.level}</div>
                <div className="mt-1 text-sm text-white/90">Bạn đã học 20/100 gốc từ</div>
              </div>
              <div className="text-right text-sm text-white/90">{user.xp} XP · 🔥 {user.streak}</div>
            </div>
            <div className="mt-4 h-3 rounded-full bg-white/25 overflow-hidden">
              <div className="h-full bg-white rounded-full" style={{ width: '20%' }} />
            </div>
          </div>
        )}

        {/* Khám phá họ từ (cây từ) */}
        {root && (
          <div className="rounded-2xl bg-white border border-neutral-200 shadow-soft p-6">
            <h2 className="font-bold text-neutral-800">Khám phá họ từ của <span className="font-han" lang="zh">{root.character}</span></h2>
            <p className="text-sm text-neutral-500">{root.pinyin} · {root.meaning}</p>

            <div className="mt-5 flex flex-col items-center gap-4">
              <div className="size-[120px] rounded-full bg-primary text-white flex flex-col items-center justify-center shadow-soft">
                <span className="font-han text-[44px] leading-none" lang="zh">{root.character}</span>
                <span className="text-sm mt-1">{root.pinyin}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full">
                {root.children.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-neutral-200 bg-neutral-50 p-3 text-center">
                    <div className="font-han text-[20px] text-neutral-800" lang="zh">{c.character}</div>
                    <div className="text-[12px] text-primary">{c.pinyin}</div>
                    <div className="text-[12px] text-neutral-600">{c.meaning}</div>
                  </div>
                ))}
              </div>
            </div>

            <Link href="/decks/people/tree" className="mt-5 w-full h-12 rounded-full bg-primary text-white font-semibold flex items-center justify-center gap-2">
              Khám phá tiếp <ChevronRight size={18} />
            </Link>
          </div>
        )}

        {/* Tóm tắt bài học */}
        <div className="rounded-2xl bg-white border border-neutral-200 shadow-soft p-6 text-center">
          <h3 className="font-bold text-neutral-800">Tóm tắt bài học</h3>
          <p className="mt-1 text-sm text-neutral-500">
            Thêm <span className="font-han text-neutral-800" lang="zh">人</span> vào bất kỳ khái niệm nào để cho ra từ có nghĩa
          </p>
          <Link href="/quiz/people" className="mt-4 inline-flex w-full h-12 rounded-full bg-primary text-white font-semibold items-center justify-center">
            Làm bài ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
