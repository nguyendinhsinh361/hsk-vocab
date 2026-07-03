'use client';

/** ROUTE /profile — Màn Cá nhân. Responsive: <md → ProfileMobile, ≥md → ProfileWeb. */

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { HomeData } from '@/lib/types';
import ProfileMobile from '@/components/profile/ProfileMobile';
import ProfileWeb from '@/components/profile/ProfileWeb';

export default function ProfilePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.home().then(setData).catch((e) => setError((e as Error).message));
  }, []);

  return (
    <>
      <div className="md:hidden">
        <ProfileMobile data={data} error={error} />
      </div>
      <div className="hidden md:block">
        <ProfileWeb data={data} error={error} />
      </div>
    </>
  );
}
