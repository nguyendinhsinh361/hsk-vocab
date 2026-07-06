'use client';

/**
 * ROUTE /home — Màn Trang chủ (hub). Responsive theo breakpoint:
 *   <lg  → HomeMobile (khung phone + bottom tab)
 *   ≥lg  → HomeWeb   (sidebar + lưới 3 cột)
 * Luồng luyện tập xong quay về đây. Nguồn dữ liệu: GET /home.
 */

import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import HomeMobile from '@/components/home/HomeMobile';
import HomeWeb from '@/components/home/HomeWeb';

export default function HomePage() {
  const { data, error, retry } = useApi(api.home);

  return (
    <>
      {/* <md (điện thoại): layout mobile khung phone. ≥md: layout web co giãn. */}
      <div className="md:hidden">
        <HomeMobile data={data} error={error} onRetry={retry} />
      </div>
      <div className="hidden md:block">
        <HomeWeb data={data} error={error} onRetry={retry} />
      </div>
    </>
  );
}
