'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './AuthProvider';
import { useVotes } from './VotesProvider';
import { CheckIcon, CopyIcon, GoogleG, ThumbDown, ThumbUp } from './Icons';
import { vibeLabel } from '@/lib/vibes';
import type { CaptionRow, Vibe } from '@/lib/types';

export function VoiceTag({ vibe }: { vibe: Vibe }) {
  return <span className={`voice-tag voice-${vibe}`}>{vibeLabel(vibe)}</span>;
}

export function TopPick() {
  return <span className="top-pick">Top pick</span>;
}

export function CopyButton({ text, compact = false }: { text: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      setCopied(true);
    }
  }

  return (
    <button
      type="button"
      className={`icon-btn copy-btn${copied ? ' is-done' : ''}`}
      onClick={copy}
      aria-label={copied ? 'Copied' : 'Copy caption'}
      title="Copy caption"
    >
      {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
      {!compact && <span>{copied ? 'Copied' : 'Copy'}</span>}
      <span className="sr-only" aria-live="polite">{copied ? 'Caption copied' : ''}</span>
    </button>
  );
}

export function VoteButtons({ caption }: { caption: CaptionRow }) {
  const { get, vote } = useVotes();
  const { user } = useAuth();
  const s = get(caption);
  const hint = user ? undefined : 'Sign in with Google to vote';
  return (
    <div className="votes" role="group" aria-label="Vote on this caption">
      <button
        type="button"
        className={`vote-btn vote-up${s.myVote === 1 ? ' is-on' : ''}`}
        aria-pressed={s.myVote === 1}
        aria-label={`Upvote, ${s.upvotes} upvotes`}
        title={hint}
        onClick={() => vote(caption, 1)}
      >
        <ThumbUp size={16} />
        <span>{s.upvotes}</span>
      </button>
      <button
        type="button"
        className={`vote-btn vote-down${s.myVote === -1 ? ' is-on' : ''}`}
        aria-pressed={s.myVote === -1}
        aria-label={`Downvote, ${s.downvotes} downvotes`}
        title={hint}
        onClick={() => vote(caption, -1)}
      >
        <ThumbDown size={16} />
        <span>{s.downvotes}</span>
      </button>
    </div>
  );
}

export function GoogleButton({ next, label = 'Sign in with Google', className = '' }: { next?: string; label?: string; className?: string }) {
  const { signIn } = useAuth();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className={`btn btn-google ${className}`}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await signIn(next);
        } finally {
          setBusy(false);
        }
      }}
    >
      <GoogleG />
      <span>{busy ? 'Opening Google…' : label}</span>
    </button>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <span className="spinner-wrap" role="status">
      <span className="spinner" aria-hidden="true" />
      {label && <span>{label}</span>}
    </span>
  );
}

export function Photo({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={`photo ${className}`} loading="lazy" />;
}
