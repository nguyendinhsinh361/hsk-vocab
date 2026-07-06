'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

// Ảnh banner trong /public/banner — tự chuyển mỗi 5s (cross-fade).
const BANNERS = ['/banner/hskk.webp', '/banner/ydx.png'];
const ROTATE_MS = 5000;

export function AdBanner() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (BANNERS.length <= 1) return;
    const id = setInterval(
      () => setIdx((i) => (i + 1) % BANNERS.length),
      ROTATE_MS,
    );
    return () => clearInterval(id);
  }, []);
  return (
    <div className="hidden xl:block h-full w-full self-stretch rounded-[1.25rem] overflow-hidden border border-neutral-200 bg-primary-100 relative">
      {BANNERS.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={src}
          src={src}
          alt="Quảng cáo"
          className={cn(
            'absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out',
            i === idx ? 'opacity-100' : 'opacity-0',
          )}
        />
      ))}
      <span className="absolute left-2.5 top-2.5 z-10 rounded-full bg-black/40 text-white font-sans text-[0.6875rem] px-2 py-0.5">
        Quảng cáo
      </span>
      {BANNERS.length > 1 && (
        <div className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1.5">
          {BANNERS.map((_, i) => (
            <span
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/50',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
