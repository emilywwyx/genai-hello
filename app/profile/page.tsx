import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "@/components/profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 没登录不能访问 Profile
  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url")
    .eq("id", user.id)
    .single();

  const profileIncomplete =
    !profile?.first_name || !profile?.last_name;

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">Profile</h1>

      <p className="mt-2 text-gray-600">
        {user.email}
      </p>

      {profileIncomplete && (
        <p className="mt-4 font-medium">
          Please complete your profile before continuing.
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