'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Trên màn hình lớn (≥lg = 1024px) thì điều hướng sang `to`.
 * Dùng cho các bước onboarding CHỈ-mobile: desktop không có → về /onboarding.
 */
export function DesktopRedirect({ to, minWidth = 1024 }: { to: string; minWidth?: number }) {
  const router = useRouter();
  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${minWidth}px)`);
    if (mq.matches) router.replace(to);
    const h = (e: MediaQueryListEvent) => {
      if (e.matches) router.replace(to);
    };
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [router, to, minWidth]);
  return null;
}
