"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Plus, Trophy, User } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Feed", icon: House, auth: false },
  { href: "/best", label: "Best", icon: Trophy, auth: false },
  { href: "/create", label: "Post", icon: Plus, auth: true },
  { href: "/profile", label: "Profile", icon: User, auth: true },
];

export default function MobileTabBar({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname();
  const items = ITEMS.filter((item) => signedIn || !item.auth);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex bg-ink px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] md:hidden">
      {items.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center gap-1 py-1 text-[11px] font-semibold transition duration-150 ${
              active ? "text-white" : "text-white/50 hover:text-white"
            }`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
