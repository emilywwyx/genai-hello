import Link from "next/link";
import GoogleLoginButton from "@/components/google-login-button";
import VoteButtons from "@/components/vote-buttons";
import { createClient } from "@/lib/supabase/server";
import { getVibeLabel } from "@/lib/vibes";

type Caption = {
  id: number;
  content: string;
  upvotes: number;
  downvotes: number;
  score: number;
};

type FeedImage = {
  id: number;
  image_url: string;
  created_at: string;
  vibe: string | null;
  captions: Caption[];
};

type TopCaption = Caption & {
  images: { image_url: string } | null;
};

function oneDayAgo() {
  return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
}

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: feedData } = await supabase
    .from("images")
    .select(
      "id, image_url, vibe, created_at, captions!inner(id, content, upvotes, downvotes, score)"
    )
    .order("created_at", { ascending: false })
    .order("score", { referencedTable: "captions", ascending: false })
    .limit(20);

  const { data: topData } = await supabase
    .from("captions")
    .select("id, content, upvotes, downvotes, score, images(image_url)")
    .gte("created_at", oneDayAgo())
    .gt("score", 0)
    .order("score", { ascending: false })
    .limit(1)
    .maybeSingle();

  const myVotes = new Map<number, 1 | -1>();

  if (user) {
    const { data: voteData } = await supabase
      .from("caption_votes")
      .select("caption_id, vote")
      .eq("user_id", user.id);

    for (const row of voteData ?? []) {
      myVotes.set(row.caption_id, row.vote);
    }
  }

  const feed = (feedData ?? []) as unknown as FeedImage[];
  const top = topData as unknown as TopCaption | null;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-24">
      <section className="py-12 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Your city photos. Funnier.
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-lg text-black/60">
          Post what you saw around the city. AI writes the captions.
          Everyone votes on the best one.
        </p>

        <div className="mt-7 flex justify-center">
          {user ? (
            <Link href="/create" className="btn btn-primary">
              Caption a photo
            </Link>
          ) : (
            <GoogleLoginButton />
          )}
        </div>

        {!user && (
          <p className="mt-3 text-sm text-black/45">
            Sign in to vote and create your own.
          </p>
        )}
      </section>

      {top && (
        <section className="card mb-12 grid items-center gap-6 md:grid-cols-2">
          {top.images && (
            <div className="flex justify-center overflow-hidden rounded-2xl bg-[#f5f5f7]">
              <img
                src={top.images.image_url}
                alt=""
                className="max-h-80 max-w-full object-contain"
              />
            </div>
          )}

          <div>
            <h2 className="text-xs font-semibold tracking-widest text-[#0071e3] uppercase">
              Caption of the Day
            </h2>

            <p className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
              {top.content}
            </p>

            <div className="mt-5">
              <VoteButtons
                key={`top-${top.id}-${top.upvotes}-${top.downvotes}-${myVotes.get(top.id) ?? 0}`}
                captionId={top.id}
                upvotes={top.upvotes}
                downvotes={top.downvotes}
                myVote={myVotes.get(top.id) ?? null}
                signedIn={!!user}
              />
            </div>
          </div>
        </section>
      )}

      <h2 className="mb-5 text-2xl font-semibold tracking-tight">Latest</h2>

      {feed.length === 0 && (
        <div className="card text-center text-black/60">
          No captions yet. Be the first to post one!
        </div>
      )}

      <section className="columns-1 gap-6 md:columns-2 xl:columns-3">
        {feed.map((image) => (
          <article
            key={image.id}
            className="card mb-6 break-inside-avoid p-4 transition duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)]"
          >
            <div className="flex justify-center overflow-hidden rounded-2xl bg-[#f5f5f7]">
              <img
                src={image.image_url}
                alt=""
                className="max-h-[32rem] w-full object-contain"
              />
            </div>

            <p className="mt-3 px-1 text-xs text-black/45">
              {image.vibe && `${getVibeLabel(image.vibe)} · `}
              {new Date(image.created_at).toLocaleDateString("en-US")}
            </p>

            <ul className="mt-3 space-y-2">
              {image.captions.map((caption) => (
                <li key={caption.id} className="rounded-2xl bg-[#f5f5f7] p-3.5">
                  <p className="text-[15px] leading-snug">{caption.content}</p>

                  <div className="mt-2.5">
                    <VoteButtons
                      key={`${caption.id}-${caption.upvotes}-${caption.downvotes}-${myVotes.get(caption.id) ?? 0}`}
                      captionId={caption.id}
                      upvotes={caption.upvotes}
                      downvotes={caption.downvotes}
                      myVote={myVotes.get(caption.id) ?? null}
                      signedIn={!!user}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>
    </main>
  );
}
