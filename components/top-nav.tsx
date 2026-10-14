"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import Avatar from "@/components/avatar";
import GoogleLoginButton from "@/components/google-login-button";
import type { Account } from "@/lib/account";
import { SITE_NAME } from "@/lib/site";

const LINKS = [
  { href: "/", label: "Feed" },
  { href: "/best", label: "Hall of Fame" },
];

export default function TopNav({ account }: { account: Account | null }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 bg-ink text-white">
      <div className="border-b border-white/10">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-8">
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="display text-[26px] tracking-tight transition duration-150 hover:opacity-80"
            >
              {SITE_NAME}
            </Link>

            <nav className="hidden items-center gap-1 md:flex">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition duration-150 ${
                    pathname === link.href
                      ? "bg-white text-ink"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {account ? (
            <div className="flex items-center gap-3">
              <Link href="/create" className="btn btn-light hidden sm:inline-flex">
                <Plus size={16} strokeWidth={2.5} />
                Post a photo
              </Link>
              <Link
                href="/profile"
                title="Your profile"
                className="rounded-full ring-2 ring-white/20 transition duration-150 hover:ring-white/60"
              >
                <Avatar name={account.name} avatarUrl={account.avatarUrl} />
              </Link>
            </div>
          ) : (
            <GoogleLoginButton label="Sign in" className="btn btn-light" />
          )}
        </div>
      </div>
    </header>
  );
}
