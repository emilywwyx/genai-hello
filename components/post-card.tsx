import { MapPin } from "lucide-react";
import CaptionLine, { type CaptionData } from "@/components/caption-line";

export type PostData = {
  id: number;
  image_url: string;
  created_at: string;
  vibe: string | null;
  neighborhood: string | null;
  captions: CaptionData[];
};

type PostCardProps = {
  post: PostData;
  myVotes: Map<number, 1 | -1>;
  signedIn: boolean;
};

export default function PostCard({ post, myVotes, signedIn }: PostCardProps) {
  return (
    <article className="card mb-5 break-inside-avoid transition duration-200 hover:border-black/25 hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
      <div className="flex justify-center bg-[#f7f7f4]">
        <img
          src={post.image_url}
          alt=""
          className="max-h-[28rem] w-full object-contain"
        />
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 text-xs text-muted">
        <span className="inline-flex min-w-0 items-center gap-1.5 font-semibold text-ink">
          <MapPin size={13} className="shrink-0" />
          <span className="truncate">{post.neighborhood ?? "New York"}</span>
        </span>
        <span className="shrink-0">
          {new Date(post.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      <ol className="divide-y divide-line">
        {post.captions.map((caption, index) => (
          <li key={caption.id} className="px-4 py-3.5">
            <CaptionLine
              caption={caption}
              myVote={myVotes.get(caption.id) ?? null}
              signedIn={signedIn}
              fallbackVibe={post.vibe}
              topPick={index === 0 && caption.score > 0}
            />
          </li>
        ))}
      </ol>
    </article>
  );
}
