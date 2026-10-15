
export type Vibe = 'funny' | 'relatable' | 'deadpan' | 'columbia';
export type VoteValue = 1 | -1 | 0;
export interface ImageRow {
  id: number;
  image_url: string;
  neighborhood: string | null;
  vibe: Vibe;
  created_at: string;
  created_by: string | null;
}
export interface CaptionRow {
  id: number;
  image_id: number;
  content: string;
  vibe: Vibe;
  upvotes: number;
  downvotes: number;
  score: number;
  created_at: string;
}
export interface CaptionVoteRow {
  caption_id: number;
  user_id: string;
  vote: 1 | -1;
}
export interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
}
export interface SessionUser {
  id: string;
  email: string | null;
}


export interface Post extends ImageRow {
  captions: CaptionRow[];
}

export interface CaptionWithImage extends CaptionRow {
  image: ImageRow;
}

export interface FeaturedCaption extends CaptionWithImage {
  period: 'day' | 'week' | 'all';
}

export interface CommunityStats {
  photos: number;
  captions: number;
  votes: number;
  leadingVibe: Vibe | null;
}

export interface VoiceStanding {
  vibe: Vibe;
  upvotes: number;
  captions: number;
}

export interface UserStats {
  posts: number;
  upvotesReceived: number;
  votesCast: number;
  places: number;
}

export interface UserPost {
  image: ImageRow;
  best: CaptionRow | null;
}
