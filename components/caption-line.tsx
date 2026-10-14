import CopyButton from "@/components/copy-button";
import VoiceBullet from "@/components/voice-bullet";
import VoteButtons from "@/components/vote-buttons";

export type CaptionData = {
  id: number;
  content: string;
  vibe?: string | null;
  upvotes: number;
  downvotes: number;
  score: number;
};

type CaptionLineProps = {
  caption: CaptionData;
  myVote: 1 | -1 | null;
  signedIn: boolean;
  fallbackVibe?: string | null;
  topPick?: boolean;
  size?: "md" | "lg";
};

export default function CaptionLine({
  caption,
  myVote,
  signedIn,
  fallbackVibe,
  topPick,
  size = "md",
}: CaptionLineProps) {
  const vibe = caption.vibe ?? fallbackVibe ?? null;

  return (
    <div className="flex gap-3">
      <div className="pt-0.5">
        <VoiceBullet vibe={vibe} size={size === "lg" ? "lg" : "sm"} />
      </div>

      <div className="min-w-0 flex-1">
        {topPick && (
          <p className="label mb-1 text-accent">Top pick</p>
        )}
        <p
          className={
            size === "lg"
              ? "display text-3xl sm:text-4xl"
              : "text-[15px] leading-snug font-medium"
          }
        >
          {caption.content}
        </p>

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
          <VoteButtons
            key={`${caption.id}-${caption.upvotes}-${caption.downvotes}-${myVote ?? 0}`}
            captionId={caption.id}
            upvotes={caption.upvotes}
            downvotes={caption.downvotes}
            myVote={myVote}
            signedIn={signedIn}
          />
          <CopyButton text={caption.content} />
        </div>
      </div>
    </div>
  );
}
