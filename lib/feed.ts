import type { createClient } from "@/lib/supabase/server";

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export function oneDayAgo() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

export async function getMyVotes(supabase: SupabaseServer, userId?: string) {
  const votes = new Map<number, 1 | -1>();

  if (!userId) {
    return votes;
  }

  const { data } = await supabase
    .from("caption_votes")
    .select("caption_id, vote")
    .eq("user_id", userId);

  for (const row of data ?? []) {
    votes.set(row.caption_id, row.vote);
  }

  return votes;
}
