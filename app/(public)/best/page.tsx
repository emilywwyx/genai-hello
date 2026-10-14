import { MapPin } from "lucide-react";
import CaptionLine from "@/components/caption-line";
import PageTitle from "@/components/page-title";
import VoiceBullet from "@/components/voice-bullet";
import { getMyVotes } from "@/lib/feed";
import { createClient } from "@/lib/supabase/server";
import { VOICE_COLORS } from "@/lib/tone-style";
import { VIBES } from "@/lib/vibes";

type RankedCaption = {
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

export default async function HallOfFamePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: rankedData }, { data: toneData }] = await Promise.all([
    supabase
      .from("captions")
      .select(
        "id, content, vibe, upvotes, downvotes, score, images(image_url, vibe, neighborhood)"
      )
      .gt("score", 0)
      .order("score", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(25),
    supabase.from("captions").select("vibe, upvotes").limit(5000),
  ]);

  const myVotes = await getMyVotes(supabase, user?.id);
  const ranked = (rankedData ?? []) as unknown as RankedCaption[];

  const standings = VIBES.map((vibe) => {
    const rows = (toneData ?? []).filter((row) => row.vibe === vibe.id);

    return {
      id: vibe.id,
      label: vibe.label,
      upvotes: rows.reduce((sum, row) => sum + (row.upvotes ?? 0), 0),
      captions: rows.length,
    };
  }).sort((a, b) => b.upvotes - a.upvotes);

  const maxUpvotes = Math.max(1, ...standings.map((tone) => tone.upvotes));

  return (
    <div className="space-y-6">
      <PageTitle
        label="All time"
        title="Hall of Fame"
        description="The captions New York voted up the most, and which voice is winning."
      />

      <section className="card">
        <div className="sign">
          <span className="sign-title">Standings by voice</span>
          <span className="text-xs text-white/60">Upvotes / captions</span>
        </div>

        <div className="space-y-4 p-5 sm:p-7">
          {standings.map((tone) => (
            <div
              key={tone.id}
              className="grid grid-cols-[8rem_1fr_4.5rem] items-center gap-4 sm:grid-cols-[10rem_1fr_6rem]"
            >
              <span className="flex items-center gap-2.5">
                <VoiceBullet vibe={tone.id} size="md" />
                <span className="text-sm font-semibold">{tone.label}</span>
              </span>
              <div className="h-2.5 overflow-hidden rounded-full bg-black/[0.06]">
                <div
                  className={`h-full rounded-full ${VOICE_COLORS[tone.id]}`}
                  style={{ width: `${(tone.upvotes / maxUpvotes) * 100}%` }}
                />
              </div>
              <span className="text-right text-sm font-semibold tabular-nums">
                {tone.upvotes}
                <span className="font-normal text-muted"> / {tone.captions}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {ranked.length === 0 ? (
        <div className="card p-10 text-center text-muted">
          No votes yet. Upvote a caption on the feed to start the Hall of Fame.
        </div>
      ) : (
        <ol className="grid gap-4 md:grid-cols-2">
          {ranked.map((caption, index) => (
            <li key={caption.id} className="card flex gap-4 p-4">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-[#f7f7f4] sm:h-32 sm:w-32">
                {caption.images && (
                  <img
                    src={caption.images.image_url}
                    alt=""
                    className="h-full w-full object-contain"
                  />
                )}
                <span className="display absolute top-2 left-2 flex h-8 min-w-8 items-center justify-center rounded-full bg-ink px-2 text-sm text-white">
                  {index + 1}
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <p className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted">
                  <MapPin size={12} />
                  {caption.images?.neighborhood ?? "New York"}
                </p>
                <CaptionLine
                  caption={caption}
                  myVote={myVotes.get(caption.id) ?? null}
                  signedIn={!!user}
                  fallbackVibe={caption.images?.vibe}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
