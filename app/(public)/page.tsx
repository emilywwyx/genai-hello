import Link from "next/link";
import { MapPin, Plus } from "lucide-react";
import CaptionLine from "@/components/caption-line";
import GoogleLoginButton from "@/components/google-login-button";
import PostCard, { type PostData } from "@/components/post-card";
import VoiceBullet from "@/components/voice-bullet";
import { getMyVotes, oneDayAgo } from "@/lib/feed";
import { createClient } from "@/lib/supabase/server";
import { VOICE_HINTS } from "@/lib/tone-style";
import { VIBES } from "@/lib/vibes";

type TopCaption = {
  id: number;
  content: string;
  vibe: string | null;
  upvotes: number;
  downvotes: number;
  score: number;
  images: {
    image_url: string;
    vibe: string | null;
    neighborhood: string | null;
  } | null;
};

export default async function FeedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: postData },
    { data: topData },
    { data: captionRows },
    { count: postCount },
  ] = await Promise.all([
    supabase
      .from("images")
      .select(
        "id, image_url, vibe, neighborhood, created_at, captions!inner(id, content, vibe, upvotes, downvotes, score)"
      )
      .order("created_at", { ascending: false })
      .order("score", { referencedTable: "captions", ascending: false })
      .limit(24),
    supabase
      .from("captions")
      .select(
        "id, content, vibe, upvotes, downvotes, score, images(image_url, vibe, neighborhood)"
      )
      .gte("created_at", oneDayAgo())
      .gt("score", 0)
      .order("score", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("captions").select("vibe, upvotes, downvotes").limit(5000),
    supabase.from("images").select("id", { count: "exact", head: true }),
  ]);

  const myVotes = await getMyVotes(supabase, user?.id);

  const posts = (postData ?? []) as unknown as PostData[];
  const top = topData as unknown as TopCaption | null;
  const rows = captionRows ?? [];

  const totalVotes = rows.reduce(
    (sum, row) => sum + (row.upvotes ?? 0) + (row.downvotes ?? 0),
    0
  );

  const leader = VIBES.map((vibe) => ({
    id: vibe.id,
    label: vibe.label,
    upvotes: rows
      .filter((row) => row.vibe === vibe.id)
      .reduce((sum, row) => sum + (row.upvotes ?? 0), 0),
  })).reduce((best, tone) => (tone.upvotes > best.upvotes ? tone : best));

  const stats = [
    { label: "Photos posted", value: postCount ?? 0 },
    { label: "Captions written", value: rows.length },
    { label: "Votes cast", value: totalVotes },
  ];

  return (
    <div className="space-y-6">
      <section className="card grid lg:grid-cols-[1.4fr_1fr]">
        <div className="p-7 sm:p-10">
          <p className="label">Your New York, captioned</p>
          <h1 className="display mt-4 text-[44px] sm:text-[76px]">
            Snap the city.
            <br />
            <span className="text-accent">We&apos;ll caption it.</span>
          </h1>
          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-muted">
            Post what you see around New York, from your dorm window to a 2am
            slice. Pick a voice, AI writes three captions, and the city votes
            on the best one.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {user ? (
              <Link href="/create" className="btn btn-primary px-6 py-3">
                <Plus size={16} strokeWidth={2.5} />
                Post a photo
              </Link>
            ) : (
              <GoogleLoginButton
                label="Sign in with Google"
                className="btn btn-primary px-6 py-3"
              />
            )}
            <Link href="/best" className="btn btn-ghost px-6 py-3">
              Hall of Fame
            </Link>
          </div>
        </div>

        <div className="border-t border-line bg-[#f7f7f4] p-7 sm:p-10 lg:border-t-0 lg:border-l">
          <p className="label">Pick your line</p>
          <ul className="mt-5 space-y-4">
            {VIBES.map((vibe) => (
              <li key={vibe.id} className="flex items-center gap-4">
                <VoiceBullet vibe={vibe.id} size="lg" />
                <div>
                  <p className="font-semibold">{vibe.label}</p>
                  <p className="text-sm text-muted">{VOICE_HINTS[vibe.id]}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <p className="label">{stat.label}</p>
            <p className="display mt-3 text-4xl">{stat.value}</p>
          </div>
        ))}
        <div className="card p-5">
          <p className="label">Leading voice</p>
          {leader.upvotes > 0 ? (
            <div className="mt-3 flex min-w-0 items-center gap-2.5">
              <span className="hidden sm:inline-flex">
                <VoiceBullet vibe={leader.id} size="md" />
              </span>
              <p className="display truncate text-2xl sm:text-3xl">
                {leader.label}
              </p>
            </div>
          ) : (
            <p className="display mt-3 text-4xl text-muted">—</p>
          )}
        </div>
      </section>

      {top && (
        <section className="card">
          <div className="sign">
            <span className="sign-title">Caption of the day</span>
            <span className="inline-flex items-center gap-1.5 text-xs text-white/60">
              <MapPin size={13} />
              {top.images?.neighborhood ?? "New York"}
            </span>
          </div>

          <div className="grid items-center gap-6 p-5 sm:p-7 md:grid-cols-2 md:gap-10">
            {top.images && (
              <div className="flex justify-center overflow-hidden rounded-xl bg-[#f7f7f4]">
                <img
                  src={top.images.image_url}
                  alt=""
                  className="max-h-[24rem] max-w-full object-contain"
                />
              </div>
            )}

            <CaptionLine
              caption={top}
              myVote={myVotes.get(top.id) ?? null}
              signedIn={!!user}
              fallbackVibe={top.images?.vibe}
              size="lg"
            />
          </div>
        </section>
      )}

      <section>
        <div className="flex items-end justify-between gap-4 pt-4 pb-5">
          <h2 className="display text-3xl sm:text-4xl">Latest from the city</h2>
          <Link
            href="/best"
            className="shrink-0 text-sm font-semibold whitespace-nowrap text-muted transition duration-150 hover:text-ink"
          >
            Hall of Fame →
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="card p-10 text-center text-muted">
            Nothing here yet. Be the first to post a photo.
          </div>
        ) : (
          <div className="columns-1 gap-5 md:columns-2 xl:columns-3">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                myVotes={myVotes}
                signedIn={!!user}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
