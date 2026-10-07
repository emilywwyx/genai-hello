"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function castVote(
  captionId: number,
  value: 1 | -1
): Promise<{ error: string | null }> {
  if (value !== 1 && value !== -1) {
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
    .select("id, vote")
    .eq("caption_id", captionId)
    .eq("user_id", user.id)
    .maybeSingle();

  let error;

  if (!existing) {
    ({ error } = await supabase
      .from("caption_votes")
      .insert({ caption_id: captionId, vote: value }));
  } else if (existing.vote === value) {
    ({ error } = await supabase
      .from("caption_votes")
      .delete()
      .eq("id", existing.id));
  } else {
    ({ error } = await supabase
      .from("caption_votes")
      .update({ vote: value })
      .eq("id", existing.id));
  }

  if (error) {
    return { error: "Failed to save vote." };
  }

  revalidatePath("/");

  return { error: null };
}
