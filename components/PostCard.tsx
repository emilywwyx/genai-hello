'use client';

import { CopyButton, Photo, TopPick, VoiceTag, VoteButtons } from './ui';
import { PinIcon } from './Icons';
import { useVotes } from './VotesProvider';
import { formatDate } from '@/lib/format';
import { placeName } from '@/lib/vibes';
import type { CaptionRow, Post } from '@/lib/types';

function useTopPickId(captions: CaptionRow[]): number | null {
  const { get } = useVotes();
  let best: { id: number; score: number; up: number } | null = null;
  for (const c of captions) {
    const s = get(c);
    const score = s.upvotes - s.downvotes;
    if (!best || score > best.score || (score === best.score && s.upvotes > best.up)) {
      best = { id: c.id, score, up: s.upvotes };
    }
  }
  return best && best.score > 0 ? best.id : null;
}

export function CaptionItem({ caption, top }: { caption: CaptionRow; top?: boolean }) {
  return (
    <li className={`caption-item${top ? ' is-top' : ''}`}>
      <div className="caption-meta">
        <VoiceTag vibe={caption.vibe} />
        {top && <TopPick />}
      </div>
      <p className="caption-text">{caption.content}</p>
      <div className="caption-actions">
        <VoteButtons caption={caption} />
        <CopyButton text={caption.content} />
      </div>
    </li>
  );
}

export function PostMeta({ neighborhood, date }: { neighborhood: string | null; date: string }) {
  return (
    <p className="post-meta">
      <span className="post-place">
        <PinIcon size={15} />
        {placeName(neighborhood)}
      </span>
      <span aria-hidden="true">·</span>
      <time dateTime={date}>{formatDate(date)}</time>
    </p>
  );
}

export function PostCard({ post }: { post: Post }) {
  const topId = useTopPickId(post.captions);
  return (
    <article className="post-card" id={`post-${post.id}`}>
      <div className="post-photo">
        <Photo src={post.image_url} alt={`Photo from ${placeName(post.neighborhood)}`} />
      </div>
      <div className="post-body">
        <PostMeta neighborhood={post.neighborhood} date={post.created_at} />
        {post.captions.length === 0 ? (
          <p className="muted">Captions are on the way.</p>
        ) : (
          <ul className="caption-list">
            {post.captions.map((c) => (
              <CaptionItem key={c.id} caption={c} top={c.id === topId} />
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
