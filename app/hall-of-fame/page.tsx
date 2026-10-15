'use client';

import Link from 'next/link';
import { CopyButton, Spinner, VoiceTag, VoteButtons } from '@/components/ui';
import { PinIcon, TrophyIcon } from '@/components/Icons';
import { getHallOfFame, getVoiceStandings } from '@/lib/data';
import { formatCount } from '@/lib/format';
import { useAsync } from '@/lib/useAsync';
import { placeName, vibeLabel } from '@/lib/vibes';

export default function HallOfFamePage() {
  const { data, loading } = useAsync(() => Promise.all([getHallOfFame(25), getVoiceStandings()]), []);
  const [top, standings] = data ?? [null, null];
  const maxUp = Math.max(1, ...(standings ?? []).map((s) => s.upvotes));

  return (
    <div className="container">
      <header className="page-head">
        <span className="eyebrow">All time</span>
        <h1 className="h-xl">Hall of Fame</h1>
        <p>The 25 highest-scoring captions ever. Score is upvotes minus downvotes.</p>
      </header>

      {loading ? (
        <div className="page-loading"><Spinner label="Loading the Hall of Fame…" /></div>
      ) : (
        <div className="hof-layout">
          <section aria-labelledby="top-heading">
            <h2 id="top-heading" className="sr-only">Top 25 captions</h2>
            {top && top.length > 0 ? (
              <ol className="hof-list">
                {top.map((c, i) => (
                  <li key={c.id} className={`hof-item${i < 3 ? ' is-podium' : ''}`}>
                    <span className="hof-rank" aria-label={`Rank ${i + 1}`}>{i + 1}</span>
                    <Link href={`/#post-${c.image_id}`} className="hof-thumb" aria-label="See this post in the feed">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={c.image.image_url} alt="" loading="lazy" />
                    </Link>
                    <div className="hof-body">
                      <p className="caption-text">{c.content}</p>
                      <div className="hof-row">
                        <VoiceTag vibe={c.vibe} />
                        <span className="post-place"><PinIcon size={14} />{placeName(c.image.neighborhood)}</span>
                        <span className="hof-score">Score {formatCount(c.score)}</span>
                      </div>
                      <div className="caption-actions">
                        <VoteButtons caption={c} />
                        <CopyButton text={c.content} compact />
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="empty">
                <span className="empty-icon"><TrophyIcon size={28} /></span>
                <h3 className="h-md">Nothing ranked yet</h3>
                <p>Once captions start getting votes, the best ones show up here.</p>
                <Link href="/" className="btn btn-outline">Go to the feed</Link>
              </div>
            )}
          </section>

          <aside className="standings" aria-labelledby="standings-heading">
            <div>
              <h2 id="standings-heading" className="h-md">Standings by voice</h2>
              <p className="muted" style={{ marginTop: 6, fontSize: 14 }}>Total upvotes and captions written in each voice.</p>
            </div>
            {standings?.map((s, i) => (
              <div className="standing" key={s.vibe}>
                <div className="standing-top">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <strong style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--muted)' }}>{i + 1}</strong>
                    <VoiceTag vibe={s.vibe} />
                  </span>
                  <span className="standing-num">
                    <strong>{formatCount(s.upvotes)}</strong> upvotes
                  </span>
                </div>
                <div className="bar" aria-hidden="true">
                  <span style={{ width: `${(s.upvotes / maxUp) * 100}%` }} />
                </div>
                <span className="standing-num">
                  {formatCount(s.captions)} {s.captions === 1 ? 'caption' : 'captions'} in {vibeLabel(s.vibe)}
                </span>
              </div>
            ))}
          </aside>
        </div>
      )}
    </div>
  );
}
