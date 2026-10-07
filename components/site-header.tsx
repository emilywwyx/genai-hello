import Link from "next/link";
import GoogleLoginButton from "@/components/google-login-button";
import SignOutButton from "@/components/sign-out-button";
import { createClient } from "@/lib/supabase/server";

export default async function SiteHeader() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-20 border-b border-black/5 bg-white/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-5">
        <Link
          href="/"
          className="text-[17px] font-semibold tracking-tight transition duration-200 hover:opacity-60"
        >
          Caption NYC
        </Link>

        {user ? (
          <div className="flex items-center gap-1">
            <Link href="/" className="nav-link">
              Feed
            </Link>
            <Link href="/create" className="nav-link">
              Create
            </Link>
            <Link href="/profile" className="nav-link">
              Profile
            </Link>
            <SignOutButton />
          </div>
        ) : (
          <GoogleLoginButton />
        )}
      </nav>
    </header>
  );
}
