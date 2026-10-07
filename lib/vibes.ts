export const VIBES = [
  {
    id: "funny",
    label: "Funny",
    instructions: "Funny. Go for the sharpest, most unexpected joke.",
  },
  {
    id: "relatable",
    label: "Relatable",
    instructions:
      "Relatable. Turn the photo into an everyday struggle the reader recognizes from their own life (classes, rent, group chats, being tired, being broke).",
  },
  {
    id: "deadpan",
    label: "Deadpan",
    instructions:
      "Deadpan. Say something absurd about the photo in a completely flat, matter-of-fact voice.",
  },
  {
    id: "columbia",
    label: "Columbia",
    instructions:
      "Columbia insider. Tie the joke to everyday Columbia student life, only where it fits what is in the photo. Draw from a wide mix and never use the same kind of reference twice in one set: problem sets and office hours, coding assignments and debugging at 3am, labs in Mudd, group projects, career fairs and internship recruiting, registration and waitlists, Butler all-nighters, dining halls like Ferris and JJ's, dorm life, the 1 train, midterms and finals. Do not default to consulting clubs or Lit Hum.",
  },
] as const;

export type VibeId = (typeof VIBES)[number]["id"];

export function isVibeId(value: string): value is VibeId {
  return VIBES.some((vibe) => vibe.id === value);
}

export function getVibeLabel(id: string) {
  return VIBES.find((vibe) => vibe.id === id)?.label ?? id;
}

export function buildPrompt(vibeId: VibeId) {
  const vibe = VIBES.find((v) => v.id === vibeId)!;

  return [
    "You are the funniest person in a college group chat. A friend drops this photo in the chat and you write the captions that make everyone laugh.",
    "Look at the attached photo, including any text that appears in it.",
    'Step 1 ("description"): In one or two plain sentences, say what is actually in the photo.',
    'Step 2 ("drafts"): Write 8 caption drafts. A good caption is a joke, not a description. It picks one specific thing visible in the photo and gives it an unexpected meaning: misread what is happening on purpose, exaggerate the stakes, give the people or objects a secret motive, or compare it to an everyday struggle.',
    'Step 3 ("captions"): Pick the 3 funniest drafts. They must use different angles.',
    `Tone: ${vibe.instructions}`,
    "Rules:",
    "- Every caption must hinge on something clearly visible in the photo. Do not invent objects that are not there.",
    "- A caption that only describes the photo fails. Cut it.",
    "- At most 14 words. It should sound like a real person typed it. Casual lowercase is fine.",
    "- No hashtags, no emojis, no quotation marks. No slurs, no jokes about people's bodies or appearance, nothing sexual.",
    'Return JSON with "description" (string), "drafts" (array of 8 strings), and "captions" (array of exactly 3 strings).',
  ].join("\n");
}
