"use server";

import { createClient } from "@/lib/supabase/server";
import { callGemini, parseCaptionResponse, GEMINI_MODEL } from "@/lib/gemini";
import { buildPrompt, isVibeId } from "@/lib/prompt";
import { CAPTION_COLUMNS, type RawCaption } from "@/lib/rows";

const DAILY_LIMIT = 30;

export type GenerateResult =
  | { ok: true; captions: RawCaption[] }
  | { ok: false; code: "auth" | "limit" | "busy" | "unknown" };

export async function generateCaptionsAction(
  imageId: number,
  vibeId: string
): Promise<GenerateResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, code: "auth" };
  }

  if (!isVibeId(vibeId) || !Number.isInteger(imageId)) {
    return { ok: false, code: "unknown" };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("caption_requests")
    .select("id", { count: "exact", head: true })
    .eq("created_by", user.id)
    .gte("created_at", since);

  if ((count ?? 0) >= DAILY_LIMIT) {
    return { ok: false, code: "limit" };
  }

  const { data: image } = await supabase
    .from("images")
    .select("id, storage_path, neighborhood")
    .eq("id", imageId)
    .eq("created_by", user.id)
    .maybeSingle();

  if (!image) {
    return { ok: false, code: "unknown" };
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from("caption-images")
    .download(image.storage_path);

  if (downloadError || !file) {
    return { ok: false, code: "unknown" };
  }

  const prompt = buildPrompt(vibeId, image.neighborhood);
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
    return { ok: false, code: "busy" };
  }

  if (requestError || !request) {
    return { ok: false, code: "unknown" };
  }

  const { data: captions, error: captionsError } = await supabase
    .from("captions")
    .insert(
      result.captions.map((content) => ({
        image_id: image.id,
        request_id: request.id,
        content,
        vibe: vibeId,
      }))
    )
    .select(CAPTION_COLUMNS);

  if (captionsError || !captions) {
    return { ok: false, code: "unknown" };
  }

  return { ok: true, captions: captions as unknown as RawCaption[] };
}
