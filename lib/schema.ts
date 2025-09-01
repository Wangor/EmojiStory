import { z } from 'zod';

export const keyframeSchema = z.object({
  t: z.number().nonnegative(),
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  rotate: z.number().optional(),
  scale: z.number().positive().optional(),
  ease: z.enum(['linear','easeIn','easeOut','easeInOut']).optional()
});

export const emojiActorSchema = z.object({
  id: z.string(),
  type: z.literal('emoji'),
  emoji: z.string(),
  start: z.object({ x: z.number(), y: z.number(), scale: z.number().positive() }),
  flipX: z.boolean().optional(),
  tracks: z.array(keyframeSchema).min(1),
  loop: z.enum(['float','none']).optional(),
  z: z.number().optional(),
  ariaLabel: z.string().optional()
});

export const compositeActorSchema = z.object({
  id: z.string(),
  type: z.literal('composite'),
  parts: z.array(emojiActorSchema),
  start: z.object({ x: z.number(), y: z.number(), scale: z.number().positive() }),
  flipX: z.boolean().optional(),
  tracks: z.array(keyframeSchema).min(1),
  loop: z.enum(['float','none']).optional(),
  z: z.number().optional(),
  ariaLabel: z.string().optional()
});

export const actorSchema = z.union([emojiActorSchema, compositeActorSchema]);

export const sceneSchema = z.object({
  id: z.string(),
  duration_ms: z.number().positive(),
  background: z.string().optional(),
  caption: z.string().optional(),
  actors: z.array(actorSchema),
  sfx: z.array(z.object({ at_ms: z.number().nonnegative(), type: z.enum(['pop','whoosh','ding']) })).optional()
});

export const animationSchema = z.object({
  title: z.string(),
  fps: z.number().positive(),
  scenes: z.array(sceneSchema).min(1)
});
