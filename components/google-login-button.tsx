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
    <button onClick={signInWithGoogle} className="btn btn-primary">
      Sign in with Google
    </button>
  );
}
