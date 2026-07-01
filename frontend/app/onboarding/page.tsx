/**
 * ROUTE: /onboarding — "Chọn 1 gốc từ" (đường dẫn DÙNG CHUNG cho mobile & web).
 * Responsive theo breakpoint (CSS, SSR-friendly):
 *   <lg  → UI mobile "Nhìn nè!" (lưới 2×2)        — flow mobile Figma
 *   ≥lg  → UI web   "Chọn 1 gốc từ" (cây + 3 thẻ)  — flow web Figma
 */

import ChooseRootMobile from '@/components/onboarding/ChooseRootMobile';
import ChooseRootWeb from '@/components/onboarding/ChooseRootWeb';

export default function OnboardingPage() {
  return (
    <>
      <div className="lg:hidden">
        <ChooseRootMobile />
      </div>
      <div className="hidden lg:block">
        <ChooseRootWeb />
      </div>
    </>
  );
}
