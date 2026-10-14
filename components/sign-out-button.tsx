"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton({ dark = false }: { dark?: boolean }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();

    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={signOut}
      className={`inline-flex cursor-pointer items-center gap-2 text-sm transition duration-150 ${
        dark ? "text-white/60 hover:text-white" : "text-muted hover:text-ink"
      }`}
    >
      <LogOut size={15} />
      Sign out
    </button>
  );
}
