'use client';

/**
 * MÀN: Cây từ (word tree) — theo Figma "cây từ gốc".
 * Mục đích: trực quan hoá 1 gốc từ → các từ ghép suy ra.
 * Thành phần: với mỗi gốc: WordCard lớn (gốc) + lưới WordCard con (từ ghép).
 * CTA & điều hướng: "← Quay lại" → /decks/[deckId]; "Luyện tập" → /quiz/[deckId].
 * States: loading / error / loaded.
 * Route: /decks/[deckId]/tree   ·   API: GET /decks/:id/tree
 */

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { WordTreeNode } from '@/lib/types';
import { WordCard } from '@/components/WordCard';
import { Button } from '@/components/ui/Button';

export default function WordTreePage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = use(params);
  const [tree, setTree] = useState<WordTreeNode[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .wordTree(deckId)
      .then(setTree)
      .catch((e) => setError((e as Error).message));
  }, [deckId]);

  return (
    <div>
      <Link href={`/decks/${deckId}`} className="text-sm text-neutral-500">
        ← Quay lại
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-800">Cây từ gốc</h1>
        <Link href={`/quiz/${deckId}`}>
          <Button size="sm">Luyện tập</Button>
        </Link>
      </div>

      {error && (
        <p className="mt-6 rounded-xl bg-danger/10 text-danger p-4">Lỗi: {error}</p>
      )}
      {!tree && !error && <p className="mt-6 text-neutral-400">Đang tải…</p>}

      {tree &&
        tree.map((root) => (
          <section key={root.id} className="mt-8 flex flex-col items-center">
            <WordCard
              character={root.character}
              pinyin={root.pinyin}
              meaning={root.meaning}
              size="lg"
              className="w-44"
            />
            <div className="mt-4 h-6 w-px bg-neutral-300" />
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {root.children.map((c) => (
                <WordCard
                  key={c.id}
                  character={c.character}
                  pinyin={c.pinyin}
                  meaning={c.meaning}
                />
              ))}
            </div>
          </section>
        ))}
    </div>
  );
}
