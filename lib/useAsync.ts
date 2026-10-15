'use client';

import { useEffect, useState } from 'react';

export function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [result, setResult] = useState<{ key: string; data: T | null; error: unknown } | null>(null);
  const [nonce, setNonce] = useState(0);
  const key = `${JSON.stringify(deps)}:${nonce}`;

  useEffect(() => {
    let alive = true;
    loader()
      .then((data) => {
        if (alive) setResult({ key, data, error: null });
      })
      .catch((error) => {
        if (alive) setResult({ key, data: null, error });
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return {
    data: result?.data ?? null,
    error: result?.key === key ? result.error : null,
    loading: result?.key !== key,
    reload: () => setNonce((n) => n + 1),
  };
}
