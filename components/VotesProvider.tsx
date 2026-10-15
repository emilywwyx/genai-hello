'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { onVote } from '@/lib/actions';
import { getMyVotes } from '@/lib/data';
import type { CaptionRow, VoteValue } from '@/lib/types';
import { useAuth } from './AuthProvider';

export interface VoteSnapshot {
  upvotes: number;
  downvotes: number;
  myVote: VoteValue;
}

interface VotesState {
  get: (c: CaptionRow) => VoteSnapshot;
  vote: (c: CaptionRow, clicked: 1 | -1) => void;
}

const VotesContext = createContext<VotesState | null>(null);

export function nextVote(current: VoteValue, clicked: 1 | -1): VoteValue {
  return current === clicked ? 0 : clicked;
}

export function VotesProvider({ children }: { children: React.ReactNode }) {
  const { user, signIn } = useAuth();
  const pathname = usePathname();
  const [mine, setMine] = useState<Record<string, 1 | -1>>({});
  const [overrides, setOverrides] = useState<Record<string, { upvotes: number; downvotes: number }>>({});
  const pending = useRef<Set<number>>(new Set());

  useEffect(() => {
    let alive = true;
    const load: Promise<Record<string, 1 | -1>> = user ? getMyVotes(user.id) : Promise.resolve({});
    load.then((votes) => {
      if (!alive) return;
      setMine(votes);
      setOverrides({});
    });
    return () => {
      alive = false;
    };
  }, [user]);

  const get = useCallback(
    (c: CaptionRow): VoteSnapshot => {
      const o = overrides[c.id];
      return {
        upvotes: o ? o.upvotes : c.upvotes,
        downvotes: o ? o.downvotes : c.downvotes,
        myVote: mine[c.id] ?? 0,
      };
    },
    [mine, overrides],
  );

  const vote = useCallback(
    (c: CaptionRow, clicked: 1 | -1) => {
      if (!user) {
        signIn(pathname);
        return;
      }
      if (pending.current.has(c.id)) return;
      const before = get(c);
      const value = nextVote(before.myVote, clicked);
      let { upvotes, downvotes } = before;
      if (before.myVote === 1) upvotes--;
      if (before.myVote === -1) downvotes--;
      if (value === 1) upvotes++;
      if (value === -1) downvotes++;

      const apply = (snap: VoteSnapshot) => {
        setOverrides((o) => ({ ...o, [c.id]: { upvotes: snap.upvotes, downvotes: snap.downvotes } }));
        setMine((m) => {
          const n = { ...m };
          if (snap.myVote === 0) delete n[c.id];
          else n[c.id] = snap.myVote;
          return n;
        });
      };

      apply({ upvotes, downvotes, myVote: value });
      pending.current.add(c.id);
      onVote(c.id, value)
        .catch(() => apply(before))
        .finally(() => pending.current.delete(c.id));
    },
    [user, signIn, pathname, get],
  );

  return <VotesContext.Provider value={{ get, vote }}>{children}</VotesContext.Provider>;
}

export function useVotes(): VotesState {
  const ctx = useContext(VotesContext);
  if (!ctx) throw new Error('useVotes must be used inside VotesProvider');
  return ctx;
}
