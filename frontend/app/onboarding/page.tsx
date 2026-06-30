'use client';

/**
 * MÀN: Onboarding — Giới thiệu concept (theo Figma "Biết 1 từ gốc").
 * Mục đích: mở đầu, truyền thông điệp "học 1 gốc từ → đoán hàng chục từ".
 * Thành phần: badge level, tiêu đề lớn, mô tả, minh hoạ cây từ (đơn giản), CTA.
 * CTA & điều hướng: "Bắt đầu" → /onboarding/level. "Bỏ qua" → /dashboard.
 * States: tĩnh (không gọi API).
 * Route: /onboarding   ·   API: none
 */

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { WordCard } from '@/components/WordCard';

export default function OnboardingIntro() {
  const router = useRouter();
  return (
    <main className="min-h-screen bg-gradient-to-b from-primary-100 to-white flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-md w-full">
        <span className="inline-block text-xs font-semibold text-primary bg-white px-3 py-1 rounded-full shadow-soft">
          Màn 1
        </span>
        <h1 className="mt-4 text-3xl font-bold text-neutral-900">Biết 1 từ gốc</h1>
        <p className="mt-2 text-neutral-600">Đoán được hàng chục từ mới</p>

        <div className="mt-10 flex flex-col items-center gap-4">
          <WordCard character="人" pinyin="rén" meaning="nhân - người" size="lg" className="w-40" />
          <div className="grid grid-cols-3 gap-3">
            <WordCard character="人人" meaning="mọi người" />
            <WordCard character="大人" meaning="người lớn" />
            <WordCard character="好人" meaning="người tốt" />
          </div>
        </div>

        <Button className="mt-10 w-full" onClick={() => router.push('/onboarding/level')}>
          Bắt đầu
        </Button>
        <Link href="/dashboard" className="mt-3 inline-block text-sm text-neutral-500">
          Bỏ qua
        </Link>
      </div>
    </main>
  );
}
