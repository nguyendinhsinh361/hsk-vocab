import Link from 'next/link';
import type { DeckSummary } from '@/lib/types';

export function DeckCard({ deck }: { deck: DeckSummary }) {
  return (
    <Link
      href={`/decks/${deck.id}`}
      className="block rounded-2xl bg-white p-5 shadow-soft border border-neutral-200 hover:border-primary-300 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-primary bg-primary-100 px-2 py-1 rounded-full">
          {deck.level}
        </span>
        <span className="text-sm text-neutral-500">{deck._count.cards} gốc từ</span>
      </div>
      <h3 className="mt-3 text-lg font-bold text-neutral-800">{deck.name}</h3>
      {deck.description && (
        <p className="mt-1 text-sm text-neutral-500">{deck.description}</p>
      )}
    </Link>
  );
}
