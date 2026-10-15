'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { GoogleButton } from './ui';
import { CameraIcon, GridIcon, HomeIcon, LogoMark, TrophyIcon, UserIcon, GoogleG } from './Icons';
import { fullName } from '@/lib/format';

function Avatar({ size = 32 }: { size?: number }) {
  const { profile, user } = useAuth();
  const name = fullName(profile) || user?.email || '';
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden="true">
      {profile?.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.avatar_url} alt="" />
      ) : initial ? (
        initial
      ) : (
        <UserIcon size={size * 0.55} />
      )}
    </span>
  );
}

export { Avatar };

export function SiteHeader() {
  const { user, loading, signIn } = useAuth();
  const pathname = usePathname();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const link = (href: string, label: string) => (
    <Link href={href} className={`nav-link${isActive(href) ? ' is-active' : ''}`} aria-current={isActive(href) ? 'page' : undefined}>
      {label}
    </Link>
  );

  return (
    <>
      <header className="site-header">
        <div className="container header-row">
          <Link href="/" className="brand" aria-label="CaptionNYC home">
            <LogoMark />
            <span>CAPTIONNYC</span>
          </Link>
          <nav className="desktop-nav" aria-label="Main">
            {link('/', 'Home')}
            {link('/feed', 'Feed')}
            {link('/hall-of-fame', 'Hall of Fame')}
          </nav>
          <div className="header-actions">
            {loading ? (
              <span className="header-placeholder" aria-hidden="true" />
            ) : user ? (
              <Link href="/profile" className={`profile-chip${isActive('/profile') ? ' is-active' : ''}`} aria-label="Profile">
                <Avatar />
                <span className="hide-mobile">Profile</span>
              </Link>
            ) : (
              <GoogleButton next={pathname} className="btn-sm" />
            )}
          </div>
        </div>
      </header>

      <nav className="tab-bar" aria-label="Main">
        <Link href="/" className={`tab${isActive('/') ? ' is-active' : ''}`} aria-current={isActive('/') ? 'page' : undefined}>
          <HomeIcon size={22} />
          <span>Home</span>
        </Link>
        <Link href="/feed" className={`tab${isActive('/feed') ? ' is-active' : ''}`} aria-current={isActive('/feed') ? 'page' : undefined}>
          <GridIcon size={22} />
          <span>Feed</span>
        </Link>
        <Link href="/hall-of-fame" className={`tab${isActive('/hall-of-fame') ? ' is-active' : ''}`} aria-current={isActive('/hall-of-fame') ? 'page' : undefined}>
          <TrophyIcon size={22} />
          <span>Hall of Fame</span>
        </Link>
        {user ? (
          <>
            <Link href="/post" className={`tab tab-post${isActive('/post') ? ' is-active' : ''}`} aria-current={isActive('/post') ? 'page' : undefined}>
              <span className="tab-post-icon"><CameraIcon size={22} /></span>
              <span>Post</span>
            </Link>
            <Link href="/profile" className={`tab${isActive('/profile') ? ' is-active' : ''}`} aria-current={isActive('/profile') ? 'page' : undefined}>
              <Avatar size={24} />
              <span>Profile</span>
            </Link>
          </>
        ) : (
          <button type="button" className="tab" onClick={() => signIn(pathname)} disabled={loading}>
            <GoogleG size={22} />
            <span>Sign in</span>
          </button>
        )}
      </nav>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-row">
        <span className="brand brand-small">
          <LogoMark size={22} />
          <span>CAPTIONNYC</span>
        </span>
        <span className="muted">Your New York, captioned.</span>
        <nav className="footer-links" aria-label="Footer">
          <Link href="/">Home</Link>
          <Link href="/feed">Feed</Link>
          <Link href="/hall-of-fame">Hall of Fame</Link>
          <Link href="/post">Post a feed</Link>
          <Link href="/profile">Profile</Link>
        </nav>
      </div>
    </footer>
  );
}
