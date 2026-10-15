import type { Vibe } from './types';

export interface VibeInfo {
  id: Vibe;
  label: string;
  description: string;
}

export const VIBES: VibeInfo[] = [
  { id: 'funny', label: 'Funny', description: 'Sharp and unexpected' },
  { id: 'relatable', label: 'Relatable', description: 'Everyday student struggles' },
  { id: 'deadpan', label: 'Deadpan', description: 'Absurd, said with a straight face' },
  { id: 'columbia', label: 'Columbia', description: 'Campus inside jokes' },
];

export function vibeLabel(vibe: Vibe): string {
  return VIBES.find((v) => v.id === vibe)?.label ?? vibe;
}

export const DEFAULT_PLACE = 'New York';

export function placeName(neighborhood: string | null | undefined): string {
  const n = neighborhood?.trim();
  return n ? n : DEFAULT_PLACE;
}

export const NEIGHBORHOODS = [
  'Morningside Heights', 'Harlem', 'Upper West Side', 'Upper East Side', 'Midtown',
  'Hell’s Kitchen', 'Chelsea', 'Flatiron', 'Union Square', 'Greenwich Village',
  'West Village', 'East Village', 'Lower East Side', 'SoHo', 'Chinatown',
  'Financial District', 'Battery Park', 'Washington Heights', 'Roosevelt Island',
  'Williamsburg', 'Greenpoint', 'Bushwick', 'DUMBO', 'Brooklyn Heights', 'Park Slope',
  'Prospect Heights', 'Coney Island', 'Astoria', 'Long Island City', 'Flushing',
  'Jackson Heights', 'The Bronx', 'Staten Island Ferry', 'Central Park', 'Times Square',
];
