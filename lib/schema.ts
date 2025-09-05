import { z } from 'zod';

export const keyframeSchema = z.object({
  t: z.number().nonnegative(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  rotate: z.number().optional(),
  scale: z.number().positive().optional(),
  ease: z.enum(['linear','easeIn','easeOut','easeInOut']).optional()
});

export const effectSchema = z.enum(['fade-in','bounce']);

export const emojiActorSchema = z.object({
  id: z.string(),
  type: z.literal('emoji'),
  emoji: z.string(),
  start: z.object({ x: z.number(), y: z.number(), scale: z.number().positive() }).optional(),
  flipX: z.boolean().optional(),
  tracks: z.array(keyframeSchema).min(1),
  loop: z.enum(['float', 'none']).optional(),
  z: z.number().optional(),
  ariaLabel: z.string().optional(),
  effects: z.array(effectSchema).optional()
});

export const compositeActorSchema = z.object({
  id: z.string(),
  type: z.literal('composite'),
  parts: z.array(emojiActorSchema),
  start: z.object({ x: z.number(), y: z.number(), scale: z.number().positive() }).optional(),
  flipX: z.boolean().optional(),
  tracks: z.array(keyframeSchema).min(1),
  loop: z.enum(['float', 'none']).optional(),
  z: z.number().optional(),
  ariaLabel: z.string().optional(),
  meta: z.object({ sizeOverride: z.number().positive().optional() }).optional(),
  effects: z.array(effectSchema).optional()
});

export const textActorSchema = z.object({
  id: z.string(),
  type: z.literal('text'),
  text: z.string(),
  start: z.object({ x: z.number(), y: z.number(), scale: z.number().positive() }).optional(),
  tracks: z.array(keyframeSchema).min(1),
  color: z.string().optional(),
  fontSize: z.number().positive().optional(),
  z: z.number().optional(),
  effects: z.array(effectSchema).optional()
});

export const actorSchema = z.union([emojiActorSchema, compositeActorSchema, textActorSchema]);

export const sceneSchema = z.object({
  id: z.string(),
  duration_ms: z.number().positive(),
  backgroundActors: z.array(emojiActorSchema).default([]),
  caption: z.string().optional(),
  backgroundColor: z.string().optional(),
  actors: z.array(actorSchema),
  effects: z.array(effectSchema).optional(),
  sfx: z.array(z.object({ at_ms: z.number().nonnegative(), type: z.enum(['pop','whoosh','ding']) })).optional()
});

export const animationSchema = z.object({
  title: z.string(),
  description: z
    .string()
    .refine(
      (s) => s.trim().split(/\s+/).filter(Boolean).length <= 50,
      { message: 'Must be 50 words or fewer' }
    ),
  fps: z.number().positive(),
  scenes: z.array(sceneSchema).min(1),
  emojiFont: z.string().optional()
});

export type Keyframe = z.infer<typeof keyframeSchema>;
export type Effect = z.infer<typeof effectSchema>;
export type EmojiActor = z.infer<typeof emojiActorSchema>;
export type CompositeActor = z.infer<typeof compositeActorSchema>;
export type TextActor = z.infer<typeof textActorSchema>;
export type Actor = z.infer<typeof actorSchema>;
export type Scene = z.infer<typeof sceneSchema>;
export type Animation = z.infer<typeof animationSchema>;
