export type Keyframe = {
  t: number; // ms from scene start
  x: number; // 0..1
  y: number; // 0..1
  rotate?: number; // degrees
  scale?: number; // optional per-keyframe scale
  ease?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
};

export type Effect = 'fade-in' | 'bounce';

export type EmojiActor = {
  id: string;
  type: 'emoji';
  emoji: string; // any Unicode emoji, e.g., "🐱"
  start?: { x: number; y: number; scale: number }; // scale > 0 represents overall size
  flipX?: boolean; // mirror horizontally when true
  tracks: Keyframe[]; // must end at scene duration
  loop?: 'float' | 'none';
  z?: number; // layering
  ariaLabel?: string;
  effects?: Effect[];
};

export type CompositeActor = {
  id: string;
  type: 'composite';
  parts: EmojiActor[]; // grouped emoji parts with relative offsets and per-part scale
  start?: { x: number; y: number; scale: number }; // scale > 0 for group size
  flipX?: boolean; // mirror entire group when true
  tracks: Keyframe[];
  loop?: 'float' | 'none';
  z?: number;
  ariaLabel?: string;
  meta?: {
    /** Overrides automatic group sizing in pixels for manual tuning */
    sizeOverride?: number;
  };
  effects?: Effect[];
};

export type TextActor = {
  id: string;
  type: 'text';
  text: string;
  start?: { x: number; y: number; scale: number };
  tracks: Keyframe[];
  color?: string;
  fontSize?: number;
  z?: number;
  effects?: Effect[];
};

export type Actor = EmojiActor | CompositeActor | TextActor;

export type Scene = {
  id: string;
  duration_ms: number; // scene duration
  backgroundActors: EmojiActor[]; // actors rendered behind foreground
  caption?: string;
  actors: Actor[];
  effects?: Effect[];
  sfx?: { at_ms: number; type: 'pop' | 'whoosh' | 'ding' }[];
};

export type Animation = {
  title: string;
  /** Short summary describing the movie */
  description: string;
  fps: number; // for time normalization if needed
  scenes: Scene[];
  /** Optional font-family name for rendering emoji */
  emojiFont?: string;
};
