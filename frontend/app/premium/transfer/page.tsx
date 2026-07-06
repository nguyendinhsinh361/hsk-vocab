'use client';

/** ROUTE /premium/transfer — "Thông tin chuyển khoản". Responsive: full-bleed mobile, card giữa desktop. */

import { PaymentWebShell } from '@/components/payment/PaymentWebShell';
import { TransferScreen } from '@/components/payment/TransferScreen';
import { BrandBackdrop } from '@/components/common/BrandBackdrop';
import { BottomTab } from '@/components/home/HomeMobile';

export default function PremiumTransferPage() {
  return (
    <>
      {/* Mobile (<md): nền brand + card rời + bottom menu (giống Home/Cá nhân/Nâng cấp). */}
      <div className="md:hidden relative w-full h-[100dvh] overflow-hidden bg-white">
        <BrandBackdrop />
        <div className="relative z-10 flex h-full flex-col pb-20">
          <TransferScreen />
        </div>
        <BottomTab active="/premium" />
      </div>
      {/* Desktop (≥md): sidebar + card căn giữa (giống màn Hồ sơ/Premium). */}
      <div className="hidden md:block">
        <PaymentWebShell maxWidth="lg">
          <TransferScreen />
        </PaymentWebShell>
      </div>
    </>
  );
}
