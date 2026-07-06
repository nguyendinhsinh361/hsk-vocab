'use client';

/**
 * Fetch state dùng chung (loading / error / retry) — thay cho việc mỗi page
 * tự viết useState + useEffect + load(). Fetcher nên là reference ổn định
 * (vd truyền thẳng `api.home`).
 */

import { useCallback, useEffect, useState } from 'react';

export function useApi<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setData(null);
    fetcher()
      .then(setData)
      .catch((e) => setError((e as Error).message));
  }, [fetcher]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading: !data && !error, retry: load };
}
