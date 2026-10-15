'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, signInWithGoogle, signOut as signOutAction } from '@/lib/actions';
import { getProfile } from '@/lib/data';
import { createClient } from '@/lib/supabase/client';
import type { Profile, SessionUser } from '@/lib/types';

interface AuthState {
  user: SessionUser | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (next?: string) => Promise<void>;
  signOut: () => Promise<void>;
  setProfile: (p: Profile) => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const supabase = createClient();

    const refresh = () => {
      getSession()
        .then(async (u) => {
          const p = u ? await getProfile(u.id) : null;
          if (!alive) return;
          setUser(u);
          setProfile(p ? { ...p } : null);
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    };

    refresh();
    const { data } = supabase.auth.onAuthStateChange(() => refresh());

    return () => {
      alive = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (next?: string) => {
    await signInWithGoogle(next);
  }, []);

  const signOut = useCallback(async () => {
    await signOutAction();
    setUser(null);
    setProfile(null);
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut, setProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
