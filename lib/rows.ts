import type { CaptionRow, ImageRow, Vibe } from "./types";

const VIBE_IDS: Vibe[] = ["funny", "relatable", "deadpan", "columbia"];

export type RawImage = {
  id: number;
  image_url: string;
  neighborhood: string | null;
  vibe: string | null;
  created_at: string;
  created_by: string | null;
};

export type RawCaption = {
  id: number;
  image_id: number;
  content: string;
  vibe: string | null;
  upvotes: number;
  downvotes: number;
  score: number;
  created_at: string;
};

export const IMAGE_COLUMNS = "id, image_url, neighborhood, vibe, created_at, created_by";

export const CAPTION_COLUMNS =
  "id, image_id, content, vibe, upvotes, downvotes, score, created_at";

function toVibe(value: string | null | undefined, fallback: Vibe = "funny"): Vibe {
  return VIBE_IDS.includes(value as Vibe) ? (value as Vibe) : fallback;
}

export function toImage(row: RawImage): ImageRow {
  return {
    id: row.id,
    image_url: row.image_url,
    neighborhood: row.neighborhood ?? null,
    vibe: toVibe(row.vibe),
    created_at: row.created_at,
    created_by: row.created_by ?? null,
  };
}

export function toCaption(row: RawCaption, fallback?: string | null): CaptionRow {
  return {
    id: row.id,
    image_id: row.image_id,
    content: row.content,
    vibe: toVibe(row.vibe ?? fallback),
    upvotes: row.upvotes ?? 0,
    downvotes: row.downvotes ?? 0,
    score: row.score ?? 0,
    created_at: row.created_at,
  };
}

export function compareCaptions(a: CaptionRow, b: CaptionRow): number {
  return (
    b.score - a.score ||
    b.upvotes - a.upvotes ||
    a.created_at.localeCompare(b.created_at)
  );
}
