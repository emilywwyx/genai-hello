import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url")
    .eq("id", user.id)
    .single();

  const profileIncomplete = !profile?.first_name || !profile?.last_name;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-5 pt-12 pb-24">
      <h1 className="text-4xl font-semibold tracking-tight">Profile</h1>

      <p className="mt-3 text-lg text-black/60">{user.email}</p>

      {profileIncomplete && (
        <p className="mt-6 rounded-2xl bg-[#0071e3]/10 px-5 py-4 text-[15px] font-medium text-[#0058b0]">
          Please add your first and last name to finish setting up your
          profile.
        </p>
      )}

      <ProfileForm
        userId={user.id}
        firstName={profile?.first_name ?? null}
        lastName={profile?.last_name ?? null}
        avatarUrl={profile?.avatar_url ?? null}
      />
    </main>
  );
}
