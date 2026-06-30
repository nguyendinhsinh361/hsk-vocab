'use client';

/**
 * MÀN: Chọn level (theo Figma "Chọn LV").
 * Mục đích: chọn level HSK phù hợp để bắt đầu.
 * Thành phần: tiêu đề, danh sách level HSK1–6 (HSK4–6 "Coming soon" disabled), CTA.
 * CTA & điều hướng: chọn 1 level → bật nút; "Bắt đầu hành trình" → lưu level → /dashboard.
 * States: default / selected / disabled (coming soon).
 * Route: /onboarding/level   ·   API: none (lưu localStorage qua lib/prefs)
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { setLevel } from '@/lib/prefs';
import type { HskLevel } from '@/lib/types';
import { cn } from '@/lib/cn';

const LEVELS: { id: HskLevel; label: string; available: boolean }[] = [
  { id: 'HSK1', label: 'HSK 1', available: true },
  { id: 'HSK2', label: 'HSK 2', available: true },
  { id: 'HSK3', label: 'HSK 3', available: true },
  { id: 'HSK4', label: 'HSK 4', available: false },
  { id: 'HSK5', label: 'HSK 5', available: false },
  { id: 'HSK6', label: 'HSK 6', available: false },
];

export default function ChooseLevel() {
  const router = useRouter();
  const [selected, setSelected] = useState<HskLevel | null>(null);

  function start() {
    if (!selected) return;
    setLevel(selected);
    router.push('/dashboard');
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-100 to-white flex flex-col items-center px-6 py-12">
      <div className="max-w-md w-full">
        <h1 className="text-2xl font-bold text-neutral-900">Chọn level</h1>
        <p className="mt-1 text-neutral-600">Bắt đầu hành trình bằng level phù hợp với bạn!</p>

        <div className="mt-8 flex flex-col gap-3">
          {LEVELS.map((lv) => (
            <button
              key={lv.id}
              disabled={!lv.available}
              onClick={() => setSelected(lv.id)}
              className={cn(
                'flex items-center justify-between rounded-2xl border bg-white p-4 text-left transition-colors',
                'border-neutral-200 hover:border-primary-300',
                selected === lv.id && 'border-primary ring-2 ring-primary/30',
                !lv.available && 'opacity-50 cursor-not-allowed hover:border-neutral-200',
              )}
            >
              <span className="font-semibold text-neutral-800">{lv.label}</span>
              {!lv.available && (
                <span className="text-xs font-semibold text-neutral-400">Coming soon</span>
              )}
            </button>
          ))}
        </div>

        <Button className="mt-8 w-full" disabled={!selected} onClick={start}>
          Bắt đầu hành trình
        </Button>
      </div>
    </main>
  );
}
