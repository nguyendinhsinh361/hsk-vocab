'use client';

/**
 * ROUTE / — entry.
 *  Mobile (<lg): Splash full-screen → tự chuyển /onboarding/intro.
 *  Desktop (≥lg): redirect thẳng /onboarding.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DesktopRedirect } from '@/components/DesktopRedirect';
import { PhoneFrame } from '@/components/mobile/PhoneFrame';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) return;
    const t = setTimeout(() => router.push('/onboarding/intro'), 1600);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <>
      <DesktopRedirect to="/onboarding" />
      <PhoneFrame
        bg={
          <>
            <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(160deg, #21C99D 0%, #11BD9E 45%, #00B2A5 100%)' }} />
            <img
              src="/img/splash-bg.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-90 pointer-events-none"
              onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')}
            />
          </>
        }
      >
        <button onClick={() => router.push('/onboarding/intro')} className="absolute inset-0 w-full h-full flex items-center justify-center" aria-label="Vào app">
          <img
            src="/img/svg/Migii.svg"
            alt="migii"
            className="w-40"
            onError={(e) => {
              const t = e.target as HTMLImageElement;
              t.outerHTML = '<span style="color:#fff;font-weight:800;font-size:56px;font-family:var(--font-quicksand)">migii</span>';
            }}
          />
        </button>
      </PhoneFrame>
    </>
  );
}
