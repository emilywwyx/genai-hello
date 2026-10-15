'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { RequireAuth } from '@/components/RequireAuth';
import { useAuth } from '@/components/AuthProvider';
import { Avatar } from '@/components/SiteChrome';
import { Spinner, VoiceTag } from '@/components/ui';
import { AlertIcon, CameraIcon, CheckIcon, PinIcon } from '@/components/Icons';
import { saveProfile, uploadAvatar } from '@/lib/actions';
import { getUserPosts, getUserStats } from '@/lib/data';
import { formatCount, formatDate, fullName } from '@/lib/format';
import { useAsync } from '@/lib/useAsync';
import { placeName } from '@/lib/vibes';

export default function ProfilePage() {
  return (
    <RequireAuth>
      <Suspense fallback={<div className="page-loading"><Spinner /></div>}>
        <ProfileView />
      </Suspense>
    </RequireAuth>
  );
}

function ProfileView() {
  const { user, profile, setProfile, signOut } = useAuth();
  const params = useSearchParams();
  const uid = user!.id;
  const { data, loading } = useAsync(() => Promise.all([getUserStats(uid), getUserPosts(uid)]), [uid]);
  const [stats, posts] = data ?? [null, null];

  const [first, setFirst] = useState(profile?.first_name ?? '');
  const [last, setLast] = useState(profile?.last_name ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsName = !profile?.first_name;
  const showWelcome = needsName && (params.get('welcome') === '1' || !profile?.first_name);
  const dirty = first.trim() !== (profile?.first_name ?? '') || last.trim() !== (profile?.last_name ?? '');

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!first.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const p = await saveProfile(uid, { first_name: first.trim(), last_name: last.trim() || null });
      setProfile(p);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError('Couldn’t save your name. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function onAvatar(file: File | undefined) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Profile photos need to be JPG, PNG or WebP.');
      return;
    }
    setAvatarBusy(true);
    setError(null);
    try {
      const url = await uploadAvatar(uid, file);
      const p = await saveProfile(uid, {
        first_name: profile?.first_name ?? null,
        last_name: profile?.last_name ?? null,
        avatar_url: url,
      });
      setProfile(p);
    } catch {
      setError('Couldn’t upload that photo. Please try again.');
    } finally {
      setAvatarBusy(false);
    }
  }

  const name = fullName(profile);

  return (
    <div className="container">
      <header className="page-head">
        <span className="eyebrow eyebrow-plain">Profile</span>
        <h1 className="h-xl">{name ? `Hi, ${profile?.first_name}` : 'Your profile'}</h1>
        {user?.email && <p>{user.email}</p>}
      </header>

      <div className="profile-layout">
        <form className="card form-stack" onSubmit={onSave} aria-labelledby="details-heading">
          {showWelcome && (
            <div className="welcome" role="status">
              <strong>Welcome to CaptionNYC!</strong>
              <span>Add your name so people know who’s behind the photos.</span>
            </div>
          )}
          <h2 id="details-heading" className="h-md" style={{ fontSize: 22 }}>Your details</h2>

          <div className="avatar-edit">
            <Avatar size={88} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label className="btn btn-outline btn-sm file-label">
                {avatarBusy ? 'Uploading…' : profile?.avatar_url ? 'Change photo' : 'Upload photo'}
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onAvatar(e.target.files?.[0])} disabled={avatarBusy} />
              </label>
              <span className="field-hint">JPG, PNG or WebP</span>
            </div>
          </div>

          <div className="name-row">
            <div className="field">
              <label htmlFor="first" className="field-label">First name</label>
              <input id="first" className="input" value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" required />
            </div>
            <div className="field">
              <label htmlFor="last" className="field-label">Last name</label>
              <input id="last" className="input" value={last} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" />
            </div>
          </div>

          {error && (
            <div className="alert" role="alert"><AlertIcon size={18} /><span>{error}</span></div>
          )}

          <button type="submit" className="btn btn-accent btn-block" disabled={saving || !first.trim() || (!dirty && !needsName)}>
            {saving ? 'Saving…' : saved ? <><CheckIcon size={16} /> Saved</> : 'Save'}
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={signOut}>Sign out</button>
        </form>

        <div className="form-stack">
          <section aria-labelledby="your-stats">
            <h2 id="your-stats" className="sr-only">Your stats</h2>
            <div className="stats">
              <Stat label="Posts" value={stats?.posts} />
              <Stat label="Upvotes received" value={stats?.upvotesReceived} accent />
              <Stat label="Votes cast" value={stats?.votesCast} />
              <Stat label="Places captioned" value={stats?.places} />
            </div>
          </section>

          <section aria-labelledby="your-posts">
            <div className="section-head" style={{ marginBottom: 16 }}>
              <h2 id="your-posts" className="h-md">Your posts</h2>
              <Link href="/post" className="btn btn-outline btn-sm"><CameraIcon size={16} /> Post a feed</Link>
            </div>
            {loading ? (
              <Spinner label="Loading your posts…" />
            ) : posts && posts.length > 0 ? (
              <ul className="my-posts">
                {posts.map(({ image, best }) => (
                  <li key={image.id} className="my-post">
                    <Link href={`/feed?post=${image.id}`} className="hof-thumb" aria-label="See this post in the feed">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={image.image_url} alt="" loading="lazy" />
                    </Link>
                    <div className="hof-body">
                      <p className="caption-text" style={{ fontSize: 16 }}>{best ? best.content : 'Captions are on the way.'}</p>
                      <div className="hof-row" style={{ fontSize: 13 }}>
                        {best && <VoiceTag vibe={best.vibe} />}
                        <span className="post-place"><PinIcon size={14} />{placeName(image.neighborhood)}</span>
                        <span className="muted">{formatDate(image.created_at)}</span>
                      </div>
                    </div>
                    <div className="my-post-ups">
                      <strong>{formatCount(best?.upvotes ?? 0)}</strong>
                      <span>upvotes</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="empty">
                <span className="empty-icon"><CameraIcon size={28} /></span>
                <h3 className="h-md">No posts yet</h3>
                <p>Your photos and their best captions will show up here.</p>
                <Link href="/post" className="btn btn-accent">Post your first photo</Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number | undefined; accent?: boolean }) {
  return (
    <div className="stat">
      <span className={`stat-value${accent ? ' is-accent' : ''}`}>{value === undefined ? '…' : formatCount(value)}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}
