import GoogleLoginButton from "@/components/google-login-button";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Wishlist Planner</h1>

      {!user ? (
        <div className="mt-6">
          <p className="mb-4">
            Sign in to view and manage your wishlist.
          </p>

          <GoogleLoginButton />
        </div>
      ) : (
        <div className="mt-6">
          <p>You are signed in as:</p>
          <p className="font-semibold">{user.email}</p>

          <div className="mt-4 space-x-4">
            <a href="/wishlist" className="underline">
              View Wishlist
            </a>

            <a href="/profile" className="underline">
              Profile
            </a>
          </div>
        </div>
      )}
    </main>
  );
}