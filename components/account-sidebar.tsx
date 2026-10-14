"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, House, Plus, Trophy, User } from "lucide-react";
import Avatar from "@/components/avatar";
import SignOutButton from "@/components/sign-out-button";
import type { Account } from "@/lib/account";
import { SITE_NAME } from "@/lib/site";

const ACCOUNT_LINKS = [
  { href: "/create", label: "Post a photo", icon: Plus },
  { href: "/profile", label: "Profile & posts", icon: User },
];

const BROWSE_LINKS = [
  { href: "/", label: "Feed", icon: House },
  { href: "/best", label: "Hall of Fame", icon: Trophy },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof House;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-150 ${
        active
          ? "bg-white text-ink"
          : "text-white/65 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Icon size={17} strokeWidth={active ? 2.5 : 1.75} />
      {label}
    </Link>
  );
}

export default function AccountSidebar({ account }: { account: Account }) {
  const pathname = usePathname();

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-ink px-4 py-6 text-white lg:flex">
        <Link
          href="/"
          className="display px-3 text-[26px] tracking-tight transition duration-150 hover:opacity-80"
        >
          {SITE_NAME}
        </Link>

        <Link
          href="/"
          className="mt-5 inline-flex items-center gap-1.5 px-3 text-xs font-medium text-white/50 transition duration-150 hover:text-white"
        >
          <ArrowLeft size={13} />
          Back to feed
        </Link>

        <p className="mt-10 mb-2 px-3 text-[11px] font-semibold tracking-[0.12em] text-white/40 uppercase">
          Your account
        </p>
        <nav className="space-y-1">
          {ACCOUNT_LINKS.map((link) => (
            <NavLink key={link.href} {...link} active={pathname === link.href} />
          ))}
        </nav>

        <p className="mt-8 mb-2 px-3 text-[11px] font-semibold tracking-[0.12em] text-white/40 uppercase">
          Browse
        </p>
        <nav className="space-y-1">
          {BROWSE_LINKS.map((link) => (
            <NavLink key={link.href} {...link} active={pathname === link.href} />
          ))}
        </nav>

        <div className="mt-auto rounded-2xl bg-white/[0.07] p-3">
          <div className="flex items-center gap-3">
            <Avatar name={account.name} avatarUrl={account.avatarUrl} size="h-9 w-9" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{account.name}</p>
              <p className="truncate text-xs text-white/50">{account.email}</p>
            </div>
          </div>
          <div className="mt-3 border-t border-white/10 pt-3">
            <SignOutButton dark />
          </div>
        </div>
      </aside>

      <div className="sticky top-0 z-30 bg-ink text-white lg:hidden">
        <div className="flex h-14 items-center justify-between px-5">
          <Link href="/" className="display text-2xl tracking-tight">
            {SITE_NAME}
          </Link>
          <SignOutButton dark />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3">
          {[...ACCOUNT_LINKS, ...BROWSE_LINKS].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium transition duration-150 ${
                pathname === link.href
                  ? "bg-white text-ink"
                  : "text-white/65 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}
