export type Keyframe = {
  t: number; // ms from scene start
  x: number; // 0..1
  y: number; // 0..1
  rotate?: number; // degrees
  scale?: number; // optional per-keyframe scale
  ease?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
};

export type EmojiActor = {
  id: string;
  type: 'emoji';
  emoji: string; // any Unicode emoji, e.g., "🐱"
  start?: { x: number; y: number; scale: number };
  flipX?: boolean; // mirror horizontally when true
  tracks: Keyframe[]; // must end at scene duration
  loop?: 'float' | 'none';
  z?: number; // layering
  ariaLabel?: string;
};

export type CompositeActor = {
  id: string;
  type: 'composite';
  parts: EmojiActor[]; // grouped emoji parts with relative offsets and scale
  start?: { x: number; y: number; scale: number };
  flipX?: boolean; // mirror entire group when true
  tracks: Keyframe[];
  loop?: 'float' | 'none';
  z?: number;
  ariaLabel?: string;
};

export type Actor = EmojiActor | CompositeActor;

export type Scene = {
  id: string;
  duration_ms: number; // scene duration
  background?: string; // emoji backdrop or theme hint
  caption?: string;
  actors: Actor[];
  sfx?: { at_ms: number; type: 'pop' | 'whoosh' | 'ding' }[];
};

export type Animation = {
  title: string;
  fps: number; // for time normalization if needed
  scenes: Scene[];
};
