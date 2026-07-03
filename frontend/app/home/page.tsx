'use client';

/**
 * ROUTE /home — Màn Trang chủ (hub). Responsive theo breakpoint:
 *   <lg  → HomeMobile (khung phone + bottom tab)
 *   ≥lg  → HomeWeb   (sidebar + lưới 3 cột)
 * Luồng luyện tập xong quay về đây. Nguồn dữ liệu: GET /home.
 */

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { HomeData } from '@/lib/types';
import HomeMobile from '@/components/home/HomeMobile';
import HomeWeb from '@/components/home/HomeWeb';

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setData(null);
    api.home().then(setData).catch((e) => setError((e as Error).message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      {/* <md (điện thoại): layout mobile khung phone. ≥md: layout web co giãn. */}
      <div className="md:hidden">
        <HomeMobile data={data} error={error} onRetry={load} />
      </div>
      <div className="hidden md:block">
        <HomeWeb data={data} error={error} onRetry={load} />
      </div>
    </>
  );
}
