'use client';

/**
 * SuccessScreen — modal "Thanh toán thành công!" (chỉ mobile, khớp Figma).
 * Backdrop mờ + card chúc mừng có minh hoạ confetti + CTA "Chiến nào".
 */

import { useRouter } from 'next/navigation';

/** Màn thành công — MOBILE: modal trên backdrop mờ. */
export function SuccessScreen() {
  return (
    <div className="w-full min-h-[100dvh] flex items-center justify-center bg-neutral-900/50 px-6">
      <div className="w-full max-w-[21.4375rem] rounded-[1.5rem] bg-white px-6 pt-7 pb-6 shadow-[0_1.25rem_2.5rem_-0.75rem_rgba(15,23,42,0.35)]">
        <SuccessCard />
      </div>
    </div>
  );
}

/** Nội dung thành công (dùng chung mobile + desktop): minh hoạ + lời chúc + CTA. */
export function SuccessCard() {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center px-2 py-2 md:px-6 md:py-4">
      <Celebration />
      <h1 className="mt-5 font-sans font-bold text-xl md:text-2xl text-neutral-800 text-center">
        Thanh toán thành công!
      </h1>
      <p className="mt-2 font-sans text-sm md:text-base leading-snug text-neutral-500 text-center">
        Bạn đã nạp lần đầu thành công, luyện tập để lên trình độ vù vù nào.
      </p>
      <button
        type="button"
        onClick={() => router.push('/home')}
        className="mt-6 w-full h-12 md:h-14 rounded-full bg-primary border-b-4 border-[#008f85] text-white flex items-center justify-center font-sans font-semibold text-base md:text-lg active:translate-y-[0.0625rem]"
      >
        Chiến nào
      </button>
    </div>
  );
}

/** Minh hoạ chúc mừng: vòng gradient + confetti + cá voi (khớp tinh thần Figma). */
function Celebration() {
  const confetti = [
    { x: 24, y: 30, r: -20, c: '#F5851F' },
    { x: 118, y: 22, r: 15, c: '#7C6BF0' },
    { x: 40, y: 70, r: 40, c: '#2FA9E0' },
    { x: 104, y: 74, r: -30, c: '#22C55E' },
    { x: 72, y: 16, r: 0, c: '#F6C445' },
  ];
  return (
    <div className="relative size-28">
      <svg viewBox="0 0 144 144" className="size-full">
        <defs>
          <linearGradient id="celebBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3FB6D8" />
            <stop offset="1" stopColor="#2E7D8F" />
          </linearGradient>
          <linearGradient id="celebHill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#5FC6A8" />
            <stop offset="1" stopColor="#3E9E86" />
          </linearGradient>
        </defs>
        <circle cx="72" cy="72" r="70" fill="url(#celebBg)" />
        {/* đồi */}
        <path d="M2 108 Q40 78 72 96 Q108 116 142 92 L142 144 L2 144 Z" fill="url(#celebHill)" />
        {/* dây cờ */}
        <path d="M18 40 Q72 20 126 40" stroke="#ffffff" strokeWidth="1.5" fill="none" opacity="0.6" />
        {confetti.map((f, i) => (
          <rect
            key={i}
            x={f.x}
            y={f.y}
            width="7"
            height="7"
            rx="1.5"
            fill={f.c}
            transform={`rotate(${f.r} ${f.x + 3.5} ${f.y + 3.5})`}
          />
        ))}
        {/* cá voi */}
        <g transform="translate(52 74)">
          <ellipse cx="20" cy="20" rx="22" ry="16" fill="#1E3A5F" />
          <ellipse cx="20" cy="24" rx="18" ry="11" fill="#2E5A82" />
          <circle cx="12" cy="16" r="2.4" fill="#fff" />
          <path d="M40 12 q10 -6 8 6 q-6 -2 -8 -6Z" fill="#1E3A5F" />
        </g>
      </svg>
    </div>
  );
}
