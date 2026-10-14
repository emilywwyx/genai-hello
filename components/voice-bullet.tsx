import { voiceBullet } from "@/lib/tone-style";
import { getVibeLabel } from "@/lib/vibes";

type VoiceBulletProps = {
  vibe: string | null;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
};

const SIZES = {
  sm: "h-5 w-5 text-[11px]",
  md: "h-7 w-7 text-sm",
  lg: "h-9 w-9 text-base",
};

export default function VoiceBullet({
  vibe,
  size = "sm",
  showLabel = false,
}: VoiceBulletProps) {
  if (!vibe) {
    return null;
  }

  const bullet = voiceBullet(vibe);

  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${SIZES[size]} ${bullet.className}`}
      >
        {bullet.symbol}
      </span>
      {showLabel && (
        <span className="text-xs font-semibold">{getVibeLabel(vibe)}</span>
      )}
    </span>
  );
}
