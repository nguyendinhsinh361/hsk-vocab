'use client';

/** ROUTE /premium — Paywall "Nâng cấp Premium". Responsive: full-bleed mobile, card giữa desktop. */

import PremiumWeb from '@/components/payment/PremiumWeb';
import PremiumMobile from '@/components/payment/PremiumMobile';

export default function PremiumPaywallPage() {
  return (
    <>
      {/* Mobile (<md): nền brand + card trắng + bottom tab (giống Home/Cá nhân). */}
      <div className="md:hidden">
        <PremiumMobile />
      </div>
      {/* Desktop (≥md): sidebar + nội dung căn giữa. */}
      <div className="hidden md:block">
        <PremiumWeb />
      </div>
    </>
  );
}
