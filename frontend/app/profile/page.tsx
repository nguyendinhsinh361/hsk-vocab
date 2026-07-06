'use client';

/** ROUTE /profile — Màn Cá nhân. Responsive: <md → ProfileMobile, ≥md → ProfileWeb. */

import { api } from '@/lib/api';
import { useApi } from '@/hooks/useApi';
import ProfileMobile from '@/components/profile/ProfileMobile';
import ProfileWeb from '@/components/profile/ProfileWeb';

export default function ProfilePage() {
  const { data, error } = useApi(api.home);

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
