"use client";

import { createClient } from "@/lib/supabase/client";

export default function GoogleLoginButton() {
  async function signInWithGoogle() {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Google login failed:", error.message);
    }
  }

  return (
    <button
      onClick={signInWithGoogle}
      className="rounded-lg bg-black px-5 py-3 text-white"
    >
      Sign in with Google
    </button>
  );
}