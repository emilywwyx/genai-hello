import { createClient } from "@/lib/supabase/server";

export type Account = {
  email: string;
  name: string;
  avatarUrl: string | null;
};

export async function getAccount(): Promise<Account | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return {
    email: user.email ?? "",
    name:
      [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
      (user.email ?? "").split("@")[0],
    avatarUrl: profile?.avatar_url ?? null,
  };
}
