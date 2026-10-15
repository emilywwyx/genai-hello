'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Spinner } from './ui';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace(`/signin?next=${encodeURIComponent(pathname)}`);
  }, [loading, user, router, pathname]);

  if (!user) {
    return (
      <div className="page-loading">
        <Spinner label={loading ? 'Checking your sign-in…' : 'Taking you to sign in…'} />
      </div>
    );
  }
  return <>{children}</>;
}
