"use server";

import { createClient } from "@/lib/supabase/server";

export async function setVote(
  captionId: number,
  value: 1 | -1 | 0
): Promise<{ error: string | null }> {
  if (![1, -1, 0].includes(value) || !Number.isInteger(captionId)) {
    return { error: "Invalid vote." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to vote." };
  }

  const { data: existing } = await supabase
    .from("caption_votes")
    .select("id")
    .eq("caption_id", captionId)
    .eq("user_id", user.id)
    .maybeSingle();

  let error;

  if (value === 0) {
    if (existing) {
      ({ error } = await supabase
        .from("caption_votes")
        .delete()
        .eq("id", existing.id));
    }
  } else if (existing) {
    ({ error } = await supabase
      .from("caption_votes")
      .update({ vote: value })
      .eq("id", existing.id));
  } else {
    ({ error } = await supabase
      .from("caption_votes")
      .insert({ caption_id: captionId, vote: value }));
  }

  return { error: error ? "Failed to save vote." : null };
}
