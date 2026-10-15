'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { PostCard } from '@/components/PostCard';
import { useVotes } from '@/components/VotesProvider';
import { GoogleButton, Spinner, VoiceTag } from '@/components/ui';
import { CameraIcon, CloseIcon, PinIcon, ThumbUp } from '@/components/Icons';
import { getFeed } from '@/lib/data';
import { formatCount, formatDate } from '@/lib/format';
import { useAsync } from '@/lib/useAsync';
import { placeName } from '@/lib/vibes';
import type { Post } from '@/lib/types';

export default function FeedPage() {
  return (
    <Suspense fallback={<div className="page-loading"><Spinner /></div>}>
      <FeedGrid />
    </Suspense>
  );
}

function FeedGrid() {
  const params = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { data: posts, loading } = useAsync(() => getFeed(60), []);
  const [selectedId, setSelectedId] = useState<number | null>(() => Number(params.get('post')) || null);
  const selected = posts?.find((p) => p.id === selectedId) ?? null;

  function open(id: number | null) {
    setSelectedId(id);
    window.history.replaceState(null, '', id ? `/feed?post=${id}` : '/feed');
  }

  return (
    <div className="container">
      <header className="page-head">
        <span className="eyebrow">Every post</span>
        <h1 className="h-xl">Feed</h1>
        <p className="page-head-wide">Every photo the city has posted so far. Tap one to read its captions and vote.</p>
        {authLoading ? null : user ? (
          <Link href="/post" className="btn btn-accent">
            <CameraIcon size={18} /> Post a feed
          </Link>
        ) : (
          <GoogleButton next="/post" label="Sign in with Google to post" />
        )}
      </header>

      {loading ? (
        <div className="page-loading"><Spinner label="Loading the feed…" /></div>
      ) : posts && posts.length > 0 ? (
        <ul className="feed-grid">
          {posts.map((p) => (
            <li key={p.id}>
              <FeedTile post={p} onOpen={() => open(p.id)} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty">
          <span className="empty-icon"><CameraIcon size={28} /></span>
          <h3 className="h-md">No posts yet</h3>
          <p>Be the first to post something from around the city.</p>
        </div>
      )}

      <PostDialog post={selected} onClose={() => open(null)} />
    </div>
  );
}

function FeedTile({ post, onOpen }: { post: Post; onOpen: () => void }) {
  const { get } = useVotes();
  let best = post.captions[0] ?? null;
  let bestScore = -Infinity;
  let totalUp = 0;
  for (const c of post.captions) {
    const s = get(c);
    totalUp += s.upvotes;
    if (s.upvotes - s.downvotes > bestScore) {
      best = c;
      bestScore = s.upvotes - s.downvotes;
    }
  }

  return (
    <button type="button" className="feed-tile" onClick={onOpen} aria-label={`Open post from ${placeName(post.neighborhood)}`}>
      <span className="feed-tile-photo">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.image_url} alt="" loading="lazy" />
      </span>
      <span className="feed-tile-body">
        {best && <span className="feed-tile-caption">{best.content}</span>}
        <span className="feed-tile-meta">
          {best && <VoiceTag vibe={best.vibe} />}
          <span className="post-place"><PinIcon size={14} />{placeName(post.neighborhood)}</span>
        </span>
        <span className="feed-tile-foot">
          <span>{formatDate(post.created_at)}</span>
          <span>{post.captions.length} captions</span>
          <span className="feed-tile-votes"><ThumbUp size={13} />{formatCount(totalUp)}</span>
        </span>
      </span>
    </button>
  );
}

function PostDialog({ post, onClose }: { post: Post | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (post && !dialog.open) dialog.showModal();
    if (!post && dialog.open) dialog.close();
  }, [post]);

  return (
    <dialog
      ref={ref}
      className="post-dialog"
      aria-label="Post"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {post && (
        <div className="post-dialog-inner" tabIndex={-1} autoFocus>
          <button type="button" className="icon-btn post-dialog-close" onClick={onClose} aria-label="Close">
            <CloseIcon size={18} />
          </button>
          <PostCard post={post} />
        </div>
      )}
    </dialog>
  );
}
