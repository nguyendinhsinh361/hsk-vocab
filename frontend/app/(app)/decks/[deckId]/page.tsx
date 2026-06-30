'use client';

/**
 * MÀN: Chi tiết nhóm từ (Họ từ).
 * Mục đích: xem các gốc từ/từ trong 1 nhóm; chọn luyện tập hoặc xem cây từ.
 * Thành phần: tiêu đề deck, lưới WordCard các thẻ, CTA luyện tập + xem cây từ.
 * CTA & điều hướng: "Luyện tập" → /quiz/[deckId]; "Xem cây từ" → /decks/[deckId]/tree;
 *                   "← Trang chủ" → /dashboard.
 * States: loading / error / loaded.
 * Route: /decks/[deckId]   ·   API: GET /decks/:id/cards
 */

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Card } from '@/lib/types';
import { WordCard } from '@/components/WordCard';
import { Button } from '@/components/ui/Button';

export default function DeckDetailPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const [cards, setCards] = useState<Card[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .deckCards(deckId)
      .then(setCards)
      .catch((e) => setError((e as Error).message));
  }, [deckId]);

  return (
    <div>
      <Link href="/dashboard" className="text-sm text-neutral-500">
        ← Trang chủ
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-neutral-800">Họ từ</h1>
        <div className="flex gap-2">
          <Link href={`/decks/${deckId}/tree`}>
            <Button variant="outline" size="sm">
              Xem cây từ
            </Button>
          </Link>
          <Link href={`/quiz/${deckId}`}>
            <Button size="sm">Luyện tập</Button>
          </Link>
        </div>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-danger/10 text-danger p-4">Lỗi: {error}</p>
      )}
      {!cards && !error && <p className="mt-6 text-neutral-400">Đang tải…</p>}

      {cards && (
        <div className="mt-6 grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {cards.map((c) => (
            <WordCard
              key={c.id}
              character={c.character}
              pinyin={c.pinyin}
              meaning={c.meaning}
              size={c.parentId === null ? 'lg' : 'sm'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
