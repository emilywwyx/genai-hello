'use client';

import Link from 'next/link';
import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { GoogleButton, Spinner } from '@/components/ui';
import { CheckIcon, LogoMark } from '@/components/Icons';

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="page-loading"><Spinner /></div>}>
      <SignIn />
    </Suspense>
  );
}

function safeNext(raw: string | null): string {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/';
}

function SignIn() {
  const params = useSearchParams();
  const next = safeNext(params.get('next'));
  const { user, loading } = useAuth();
  const router = useRouter();

  const checked = useRef(false);
  useEffect(() => {
    if (loading || checked.current) return;
    checked.current = true;
    if (user) router.replace(next);
  }, [loading, user, next, router]);

  return (
    <div className="container section">
      <div className="card signin-card">
        <LogoMark size={44} />
        <h1 className="h-lg">Sign in to CaptionNYC</h1>
        <p className="muted">You can browse without an account. Sign in to post photos and vote.</p>
        <ul className="signin-list">
          <li><CheckIcon size={16} /> Post photos and get three AI captions</li>
          <li><CheckIcon size={16} /> Vote on captions, saved to your account</li>
          <li><CheckIcon size={16} /> Track your posts and upvotes</li>
        </ul>
        <GoogleButton next={next} className="btn-block" />
        <Link href="/" className="link-arrow">Keep browsing</Link>
      </div>
    </div>
  );
}
