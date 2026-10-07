"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { callGemini, parseCaptionResponse, GEMINI_MODEL } from "@/lib/gemini";
import { buildPrompt, isVibeId } from "@/lib/vibes";

const DAILY_LIMIT = 30;

export type GenerateResult =
  | { error: string }
  | { error: null; captions: string[] };

export async function generateCaptionsAction(
  imagePath: string,
  vibeId: string
): Promise<GenerateResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in first." };
  }

  if (!imagePath.startsWith(`${user.id}/`)) {
    return { error: "Invalid image." };
  }

  if (!isVibeId(vibeId)) {
    return { error: "Invalid vibe." };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("caption_requests")
    .select("id", { count: "exact", head: true })
    .eq("created_by", user.id)
    .gte("created_at", since);

  if ((count ?? 0) >= DAILY_LIMIT) {
    return {
      error: `You can generate ${DAILY_LIMIT} times per day. Come back tomorrow!`,
    };
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from("caption-images")
    .download(imagePath);

  if (downloadError || !file) {
    return { error: "Could not read the uploaded image." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("caption-images").getPublicUrl(imagePath);

  const { data: image, error: imageError } = await supabase
    .from("images")
    .insert({ image_url: publicUrl, storage_path: imagePath, vibe: vibeId })
    .select("id")
    .single();

  if (imageError || !image) {
    return { error: "Failed to save image." };
  }

  const prompt = buildPrompt(vibeId);
  const startedAt = Date.now();

  let raw: string | null = null;
  let result: { description: string; captions: string[] } | null = null;
  let errorMessage: string | null = null;
  let modelUsed = GEMINI_MODEL;

  try {
    const response = await callGemini({
      prompt,
      imageBase64: Buffer.from(await file.arrayBuffer()).toString("base64"),
      mimeType: file.type || "image/jpeg",
    });
    raw = response.text;
    modelUsed = response.model;
    result = parseCaptionResponse(raw);
  } catch (error) {
    console.error(error);
    errorMessage = error instanceof Error ? error.message : String(error);
  }

  const { data: request, error: requestError } = await supabase
    .from("caption_requests")
    .insert({
      image_id: image.id,
      vibe: vibeId,
      prompt,
      model: modelUsed,
      status: result ? "success" : "failed",
      description: result?.description ?? null,
      raw_response: raw,
      error: errorMessage,
      duration_ms: Date.now() - startedAt,
    })
    .select("id")
    .single();

  if (!result) {
    return { error: "AI generation failed. Please try again." };
  }

  if (requestError || !request) {
    return { error: "Failed to save generation." };
  }

  const { error: captionsError } = await supabase.from("captions").insert(
    result.captions.map((content) => ({
      image_id: image.id,
      request_id: request.id,
      content,
    }))
  );

  if (captionsError) {
    return { error: "Failed to save captions." };
  }

  revalidatePath("/");

  return { error: null, captions: result.captions };
}
