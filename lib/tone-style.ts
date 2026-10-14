const VOICE_BULLETS: Record<string, { symbol: string; className: string }> = {
  funny: { symbol: "F", className: "bg-[#ff6319] text-white" },
  relatable: { symbol: "R", className: "bg-[#fccc0a] text-black" },
  deadpan: { symbol: "D", className: "bg-[#6cbe45] text-white" },
  columbia: { symbol: "1", className: "bg-[#ee352e] text-white" },
};

const DEFAULT_BULLET = { symbol: "·", className: "bg-black/20 text-white" };

export function voiceBullet(id?: string | null) {
  return (id && VOICE_BULLETS[id]) || DEFAULT_BULLET;
}

export const VOICE_COLORS: Record<string, string> = {
  funny: "bg-[#ff6319]",
  relatable: "bg-[#fccc0a]",
  deadpan: "bg-[#6cbe45]",
  columbia: "bg-[#ee352e]",
};

export const VOICE_HINTS: Record<string, string> = {
  funny: "Sharp and unexpected",
  relatable: "Everyday student struggles",
  deadpan: "Absurd, said with a straight face",
  columbia: "Campus inside jokes",
};

export const NEIGHBORHOODS = [
  "Morningside Heights",
  "Harlem",
  "Upper West Side",
  "Upper East Side",
  "Central Park",
  "Midtown",
  "Times Square",
  "Chelsea",
  "Greenwich Village",
  "East Village",
  "SoHo",
  "Lower East Side",
  "Chinatown",
  "Financial District",
  "Williamsburg",
  "DUMBO",
  "Bushwick",
  "Astoria",
  "Long Island City",
  "Flushing",
  "The Bronx",
  "Staten Island",
];
