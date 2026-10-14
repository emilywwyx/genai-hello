import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPin } from "lucide-react";
import PageTitle from "@/components/page-title";
import ProfileForm from "@/components/profile-form";
import VoiceBullet from "@/components/voice-bullet";
import { createClient } from "@/lib/supabase/server";

type MyPost = {
  id: number;
  image_url: string;
  vibe: string | null;
  neighborhood: string | null;
  created_at: string;
  captions: { id: number; content: string; upvotes: number; score: number }[];
};

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const [{ data: profile }, { data: postData }, { count: votesCast }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("first_name, last_name, avatar_url")
        .eq("id", user.id)
        .single(),
      supabase
        .from("images")
        .select(
          "id, image_url, vibe, neighborhood, created_at, captions!inner(id, content, upvotes, score)"
        )
        .eq("created_by", user.id)
        .order("created_at", { ascending: false })
        .order("score", { referencedTable: "captions", ascending: false }),
      supabase
        .from("caption_votes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

  const posts = (postData ?? []) as unknown as MyPost[];
  const upvotesReceived = posts.reduce(
    (total, post) =>
      total + post.captions.reduce((sum, caption) => sum + caption.upvotes, 0),
    0
  );
  const places = new Set(
    posts.map((post) => post.neighborhood).filter(Boolean)
  ).size;

  const profileIncomplete = !profile?.first_name || !profile?.last_name;

  const stats = [
    { label: "Posts", value: posts.length },
    { label: "Upvotes received", value: upvotesReceived },
    { label: "Votes cast", value: votesCast ?? 0 },
    { label: "Places captioned", value: places },
  ];

  return (
    <div className="max-w-5xl space-y-6">
      <PageTitle
        label="Profile"
        title={profile?.first_name ? `Hi, ${profile.first_name}` : "Your profile"}
        description={user.email ?? undefined}
      />

      {profileIncomplete && (
        <p className="card border-l-4 border-l-accent px-5 py-4 text-[15px]">
          Add your first and last name to finish setting up your profile.
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <p className="label">{stat.label}</p>
            <p className="display mt-3 text-4xl">{stat.value}</p>
          </div>
        ))}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[22rem_1fr]">
        <section className="card">
          <div className="sign">
            <span className="sign-title">Details</span>
          </div>
          <div className="p-5">
            <ProfileForm
              userId={user.id}
              firstName={profile?.first_name ?? null}
              lastName={profile?.last_name ?? null}
              avatarUrl={profile?.avatar_url ?? null}
            />
          </div>
        </section>

        <section className="card">
          <div className="sign">
            <span className="sign-title">Your posts</span>
            <span className="text-xs text-white/60">{posts.length} total</span>
          </div>

          {posts.length === 0 ? (
            <p className="p-8 text-center text-muted">
              You haven&apos;t posted yet.{" "}
              <Link href="/create" className="font-semibold text-ink underline underline-offset-4">
                Post your first photo →
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {posts.map((post) => (
                <li key={post.id} className="flex gap-4 p-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f7f7f4]">
                    <img
                      src={post.image_url}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="inline-flex items-center gap-1 text-xs font-medium text-muted">
                      <MapPin size={12} />
                      {post.neighborhood ?? "New York"}
                    </p>
                    <p className="mt-1 flex gap-2 font-medium leading-snug">
                      <VoiceBullet vibe={post.vibe} />
                      <span>{post.captions[0]?.content}</span>
                    </p>
                    <p className="mt-1.5 text-xs text-muted">
                      Best of {post.captions.length} · ↑{" "}
                      {post.captions[0]?.upvotes ?? 0}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
