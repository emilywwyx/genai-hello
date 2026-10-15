import { setVote } from "@/app/actions";
import { generateCaptionsAction } from "@/lib/generate-action";
import { createClient } from "@/lib/supabase/client";
import { IMAGE_COLUMNS, toCaption, toImage, type RawImage } from "./rows";
import type {
  CaptionRow,
  ImageRow,
  Profile,
  SessionUser,
  Vibe,
  VoteValue,
} from "./types";

export class CaptionError extends Error {
  constructor(
    public code: "busy" | "limit" | "unknown",
    message?: string
  ) {
    super(message ?? code);
    this.name = "CaptionError";
  }
}

export const DAILY_GENERATION_LIMIT = 30;

const MAX_DIMENSION = 1600;

async function toJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");

  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85)
  );

  if (!blob) {
    throw new Error("Could not read this photo.");
  }

  return blob;
}

export async function getSession(): Promise<SessionUser | null> {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? { id: user.id, email: user.email ?? null } : null;
}

export async function signInWithGoogle(next?: string): Promise<void> {
  void next;

  const supabase = createClient();

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw error;
  }
}

export async function signOut(): Promise<void> {
  const supabase = createClient();

  await supabase.auth.signOut();
}

export async function onVote(captionId: number, value: VoteValue): Promise<void> {
  const result = await setVote(captionId, value);

  if (result.error) {
    throw new Error(result.error);
  }
}

export async function uploadPhoto(
  file: File,
  neighborhood: string | null,
  vibe: Vibe
): Promise<ImageRow> {
  const user = await getSession();

  if (!user) {
    throw new Error("Not signed in");
  }

  const supabase = createClient();
  const photo = await toJpeg(file);
  const path = `${user.id}/${Date.now()}.jpg`;

  const { error: uploadError } = await supabase.storage
    .from("caption-images")
    .upload(path, photo, { contentType: "image/jpeg" });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("caption-images").getPublicUrl(path);

  const { data, error } = await supabase
    .from("images")
    .insert({
      image_url: publicUrl,
      storage_path: path,
      vibe,
      neighborhood: neighborhood?.trim().slice(0, 40) || null,
    })
    .select(IMAGE_COLUMNS)
    .single();

  if (error || !data) {
    throw error ?? new Error("Could not save the photo.");
  }

  return toImage(data as unknown as RawImage);
}

export async function generateCaptions(
  imageId: number,
  vibe: Vibe
): Promise<CaptionRow[]> {
  const result = await generateCaptionsAction(imageId, vibe);

  if (!result.ok) {
    throw new CaptionError(result.code === "auth" ? "unknown" : result.code);
  }

  return result.captions.map((caption) => toCaption(caption, vibe));
}

export async function saveProfile(
  userId: string,
  fields: {
    first_name: string | null;
    last_name: string | null;
    avatar_url?: string | null;
  }
): Promise<Profile> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("profiles")
    .update(fields)
    .eq("id", userId)
    .select("id, first_name, last_name, avatar_url")
    .single();

  if (error || !data) {
    throw error ?? new Error("Could not save the profile.");
  }

  return data as Profile;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createClient();
  const extension = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${Date.now()}.${extension}`;

  const { error } = await supabase.storage.from("avatars").upload(path, file);

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  return publicUrl;
}
