import { createClient } from "@/lib/supabase/client";
import {
  CAPTION_COLUMNS,
  IMAGE_COLUMNS,
  compareCaptions,
  toCaption,
  toImage,
  type RawCaption,
  type RawImage,
} from "./rows";
import type {
  CaptionWithImage,
  CommunityStats,
  FeaturedCaption,
  Post,
  Profile,
  UserPost,
  UserStats,
  Vibe,
  VoiceStanding,
} from "./types";
import { DEFAULT_PLACE } from "./vibes";

export { compareCaptions };

const DAY = 24 * 60 * 60 * 1000;
const VIBE_IDS: Vibe[] = ["funny", "relatable", "deadpan", "columbia"];

type RawPost = RawImage & { captions: RawCaption[] };
type RawCaptionWithImage = RawCaption & { image: RawImage | null };

function toPost(row: RawPost): Post {
  const image = toImage(row);
  return {
    ...image,
    captions: (row.captions ?? [])
      .map((caption) => toCaption(caption, row.vibe))
      .sort((a, b) => a.created_at.localeCompare(b.created_at)),
  };
}

function toCaptionWithImage(row: RawCaptionWithImage): CaptionWithImage | null {
  if (!row.image) {
    return null;
  }

  return { ...toCaption(row, row.image.vibe), image: toImage(row.image) };
}

export async function getFeed(limit = 30): Promise<Post[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("images")
    .select(`${IMAGE_COLUMNS}, captions!inner(${CAPTION_COLUMNS})`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as RawPost[]).map(toPost);
}

async function getTopCaptionSince(since: string | null): Promise<CaptionWithImage | null> {
  const supabase = createClient();

  let query = supabase
    .from("captions")
    .select(`${CAPTION_COLUMNS}, image:images(${IMAGE_COLUMNS})`)
    .gt("upvotes", 0);

  if (since) {
    query = query.gte("created_at", since);
  }

  const { data, error } = await query
    .order("score", { ascending: false })
    .order("upvotes", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toCaptionWithImage(data as unknown as RawCaptionWithImage);
}

export async function getCaptionOfTheDay(): Promise<FeaturedCaption | null> {
  const now = Date.now();
  const periods: { period: FeaturedCaption["period"]; since: string | null }[] = [
    { period: "day", since: new Date(now - DAY).toISOString() },
    { period: "week", since: new Date(now - 7 * DAY).toISOString() },
    { period: "all", since: null },
  ];

  for (const { period, since } of periods) {
    const caption = await getTopCaptionSince(since);

    if (caption) {
      return { ...caption, period };
    }
  }

  return null;
}

async function getCaptionTotals() {
  const supabase = createClient();

  const { data } = await supabase
    .from("captions")
    .select("vibe, upvotes, downvotes")
    .limit(10000);

  return (data ?? []) as { vibe: string | null; upvotes: number; downvotes: number }[];
}

export async function getVoiceStandings(): Promise<VoiceStanding[]> {
  const rows = await getCaptionTotals();

  return VIBE_IDS.map((vibe) => {
    const list = rows.filter((row) => row.vibe === vibe);

    return {
      vibe,
      captions: list.length,
      upvotes: list.reduce((sum, row) => sum + (row.upvotes ?? 0), 0),
    };
  }).sort((a, b) => b.upvotes - a.upvotes || b.captions - a.captions);
}

export async function getCommunityStats(): Promise<CommunityStats> {
  const supabase = createClient();

  const [rows, { count: photos }] = await Promise.all([
    getCaptionTotals(),
    supabase.from("images").select("id", { count: "exact", head: true }),
  ]);

  const leader = VIBE_IDS.map((vibe) => ({
    vibe,
    upvotes: rows
      .filter((row) => row.vibe === vibe)
      .reduce((sum, row) => sum + (row.upvotes ?? 0), 0),
  })).sort((a, b) => b.upvotes - a.upvotes)[0];

  return {
    photos: photos ?? 0,
    captions: rows.length,
    votes: rows.reduce(
      (sum, row) => sum + (row.upvotes ?? 0) + (row.downvotes ?? 0),
      0
    ),
    leadingVibe: leader && leader.upvotes > 0 ? leader.vibe : null,
  };
}

export async function getHallOfFame(limit = 25): Promise<CaptionWithImage[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("captions")
    .select(`${CAPTION_COLUMNS}, image:images(${IMAGE_COLUMNS})`)
    .gt("score", 0)
    .order("score", { ascending: false })
    .order("upvotes", { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as RawCaptionWithImage[])
    .map(toCaptionWithImage)
    .filter((caption): caption is CaptionWithImage => caption !== null);
}

export async function getMyVotes(userId: string): Promise<Record<string, 1 | -1>> {
  const supabase = createClient();

  const { data } = await supabase
    .from("caption_votes")
    .select("caption_id, vote")
    .eq("user_id", userId);

  const votes: Record<string, 1 | -1> = {};

  for (const row of (data ?? []) as { caption_id: number; vote: 1 | -1 }[]) {
    votes[row.caption_id] = row.vote;
  }

  return votes;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient();

  const { data } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();

  return (data as Profile | null) ?? null;
}

async function getOwnPosts(userId: string): Promise<Post[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("images")
    .select(`${IMAGE_COLUMNS}, captions!inner(${CAPTION_COLUMNS})`)
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as unknown as RawPost[]).map(toPost);
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const supabase = createClient();

  const [posts, { count: votesCast }] = await Promise.all([
    getOwnPosts(userId),
    supabase
      .from("caption_votes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  return {
    posts: posts.length,
    upvotesReceived: posts.reduce(
      (total, post) =>
        total + post.captions.reduce((sum, caption) => sum + caption.upvotes, 0),
      0
    ),
    votesCast: votesCast ?? 0,
    places: new Set(
      posts.map((post) => post.neighborhood?.trim() || DEFAULT_PLACE)
    ).size,
  };
}

export async function getUserPosts(userId: string): Promise<UserPost[]> {
  const posts = await getOwnPosts(userId);

  return posts.map((post) => {
    const { captions, ...image } = post;

    return {
      image,
      best: [...captions].sort(compareCaptions)[0] ?? null,
    };
  });
}
