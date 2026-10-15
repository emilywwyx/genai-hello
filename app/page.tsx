'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import { PostCard, PostMeta } from '@/components/PostCard';
import { CopyButton, GoogleButton, Photo, Spinner, VoiceTag, VoteButtons } from '@/components/ui';
import { ArrowUpRight, CameraIcon } from '@/components/Icons';
import { getCaptionOfTheDay, getCommunityStats, getFeed } from '@/lib/data';
import { formatCount } from '@/lib/format';
import { useAsync } from '@/lib/useAsync';
import { placeName, vibeLabel } from '@/lib/vibes';
import type { CommunityStats, FeaturedCaption } from '@/lib/types';

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const { data, loading } = useAsync(
    () => Promise.all([getFeed(), getCaptionOfTheDay(), getCommunityStats()]),
    [],
  );
  const [posts, cotd, stats] = data ?? [null, null, null];

  return (
    <>
      <section className="hero">
        <div className="container">
          <h1 className="hero-title">
            <span>Caption</span>
            <span className="hero-pill" aria-hidden="true">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hero-subway.svg" alt="" />
            </span>
            <span>NYC</span>
          </h1>
          <p className="hero-tagline">Your New York, captioned.</p>
          <p className="hero-sub">
            Post a photo from around the city, pick a voice, and AI writes three captions. Then everyone votes.
          </p>
          <div className="hero-cta">
            {authLoading ? null : user ? (
              <Link href="/post" className="btn btn-accent">
                <CameraIcon size={18} /> Post a feed
              </Link>
            ) : (
              <GoogleButton next="/post" label="Sign in with Google to post" />
            )}
            <Link href="/hall-of-fame" className="link-arrow">
              Hall of Fame
              <span className="circle"><ArrowUpRight size={14} /></span>
            </Link>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="page-loading"><Spinner label="Loading the feed…" /></div>
      ) : (
        <>
          {stats && <CommunityStatsRow stats={stats} />}
          {cotd && <CaptionOfTheDay caption={cotd} />}

          <section className="section" aria-labelledby="latest-heading">
            <div className="container">
              <div className="section-head">
                <div>
                  <h2 id="latest-heading" className="h-lg">Latest posts</h2>
                  <p>Vote on your favorite caption. The highest-voted one in each post is the top pick.</p>
                </div>
                <Link href="/feed" className="link-arrow">
                  See all in Feed
                  <span className="circle"><ArrowUpRight size={14} /></span>
                </Link>
              </div>
              {posts && posts.length > 0 ? (
                <div className="feed">
                  {posts.map((p) => <PostCard key={p.id} post={p} />)}
                </div>
              ) : (
                <EmptyFeed signedIn={!!user} />
              )}
            </div>
          </section>
        </>
      )}
    </>
  );
}

function CommunityStatsRow({ stats }: { stats: CommunityStats }) {
  return (
    <section className="section-tight" aria-labelledby="stats-heading">
      <div className="container">
        <h2 id="stats-heading" className="sr-only">Community stats</h2>
        <div className="stats">
          <div className="stat">
            <span className="stat-value">{formatCount(stats.photos)}</span>
            <span className="stat-label">Photos posted</span>
          </div>
          <div className="stat">
            <span className="stat-value">{formatCount(stats.captions)}</span>
            <span className="stat-label">Captions written</span>
          </div>
          <div className="stat">
            <span className="stat-value">{formatCount(stats.votes)}</span>
            <span className="stat-label">Total votes</span>
          </div>
          <div className="stat">
            <span className="stat-value is-accent">{stats.leadingVibe ? vibeLabel(stats.leadingVibe) : 'No votes yet'}</span>
            <span className="stat-label">Leading voice</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const FEATURED_LABELS: Record<FeaturedCaption['period'], string> = {
  day: 'Caption of the Day',
  week: 'Caption of the Week',
  all: 'Top caption',
};

function CaptionOfTheDay({ caption }: { caption: FeaturedCaption }) {
  return (
    <section className="section-tight" aria-labelledby="cotd-heading">
      <div className="container">
        <article className="cotd">
          <div className="cotd-photo">
            <Photo src={caption.image.image_url} alt={`Photo from ${placeName(caption.image.neighborhood)}`} />
          </div>
          <div className="cotd-body">
            <h2 id="cotd-heading" className="cotd-label">{FEATURED_LABELS[caption.period]}</h2>
            <p className="cotd-quote">{caption.content}</p>
            <div>
              <VoiceTag vibe={caption.vibe} />
            </div>
            <PostMeta neighborhood={caption.image.neighborhood} date={caption.image.created_at} />
            <div className="caption-actions">
              <VoteButtons caption={caption} />
              <CopyButton text={caption.content} />
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

function EmptyFeed({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="empty">
      <span className="empty-icon"><CameraIcon size={28} /></span>
      <h3 className="h-md">No photos yet</h3>
      <p>Be the first to post something from around the city. The AI writes the captions, you just pick the voice.</p>
      {signedIn ? (
        <Link href="/post" className="btn btn-accent">Post the first photo</Link>
      ) : (
        <GoogleButton next="/post" label="Sign in with Google to post" />
      )}
    </div>
  );
}
