import { PassThrough, Readable } from 'stream';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { getClip } from '../../../../lib/supabaseServer';
import type { Scene, Actor, EmojiActor, CompositeActor } from '../../../../components/AnimationTypes';

export const runtime = 'nodejs';

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function interpolateKeyframes(kfs: any[], t: number) {
  if (kfs.length === 0) return { x: 0.5, y: 0.5, scale: 1 };
  let prev = kfs[0];
  let next = kfs[kfs.length - 1];
  for (let i = 1; i < kfs.length; i++) {
    if (t <= kfs[i].t) {
      next = kfs[i];
      prev = kfs[i - 1];
      break;
    }
  }
  const span = next.t - prev.t || 1;
  const p = (t - prev.t) / span;
  return {
    x: lerp(prev.x, next.x, p),
    y: lerp(prev.y, next.y, p),
    scale: lerp(prev.scale ?? 1, next.scale ?? 1, p),
  };
}

function drawEmoji(ctx: any, actor: EmojiActor, t: number, width: number, height: number, baseUnit: number, font: string) {
  const state = interpolateKeyframes(actor.tracks, t);
  const size = baseUnit * (state.scale ?? 1);
  const x = state.x * width;
  const y = state.y * height;
  ctx.save();
  ctx.font = `${size}px "${font}"`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (actor.flipX) {
    ctx.translate(x, y);
    ctx.scale(-1, 1);
    ctx.fillText(actor.emoji, 0, 0);
  } else {
    ctx.fillText(actor.emoji, x, y);
  }
  ctx.restore();
}

function drawComposite(ctx: any, actor: CompositeActor, t: number, width: number, height: number, baseUnit: number, font: string) {
  const state = interpolateKeyframes(actor.tracks, t);
  const unit = baseUnit * (state.scale ?? 1);
  const x = state.x * width;
  const y = state.y * height;
  ctx.save();
  ctx.translate(x, y);
  if (actor.flipX) ctx.scale(-1, 1);
  for (const part of actor.parts) {
    const ps = part.start?.scale ?? 1;
    const px = (part.start?.x ?? 0) * unit;
    const py = (part.start?.y ?? 0) * unit;
    ctx.font = `${unit * ps}px "${font}"`;
    ctx.fillText(part.emoji, px, py);
  }
  ctx.restore();
}

function drawActor(ctx: any, actor: Actor, t: number, width: number, height: number, baseUnit: number, font: string) {
  if (actor.type === 'emoji') return drawEmoji(ctx, actor as EmojiActor, t, width, height, baseUnit, font);
  if (actor.type === 'composite') return drawComposite(ctx, actor as CompositeActor, t, width, height, baseUnit, font);
}

export async function GET(_req: Request, { params }: { params: { clipId: string } }) {
  const { clipId } = params;
  console.log('Video request received for', clipId);
  const clip = await getClip(clipId);
  if (!clip) {
    console.warn('No clip found for', clipId);
  }
  const animation = clip?.animation as { scenes: Scene[]; fps?: number; emojiFont?: string } | undefined;
  const fps = animation?.fps ?? 30;
  const emojiFont = animation?.emojiFont || clip?.emoji_font || 'Noto Emoji';
  console.log('Using font', emojiFont, 'at', fps, 'fps');

  // Register fonts
  const fontDir = path.join(process.cwd(), 'public', 'fonts');
  for (const file of fs.readdirSync(fontDir)) {
    const full = path.join(fontDir, file);
    try {
      GlobalFonts.register(full);
      console.log('Registered font', full);
    } catch {}
  }

  const width = 640;
  const height = Math.round((width * 9) / 16);
  const baseUnit = width / 10;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  const frameStream = new PassThrough();
  ffmpeg.setFfmpegPath(ffmpegPath as string);
  const command = ffmpeg()
    .input(frameStream)
    .inputOptions(['-f image2pipe', `-framerate ${fps}`, '-vcodec png'])
    .outputOptions([
      '-c:v libx264',
      '-pix_fmt yuv420p',
      '-movflags frag_keyframe+empty_moov',
    ])
    .format('mp4');

  const output = new PassThrough();
  command.on('start', (cmd) => console.log('FFmpeg started', cmd));
  command.on('error', (e) => {
    console.error('FFmpeg error', e);
    output.destroy(e);
  });
  command.on('stderr', (line) => console.log('FFmpeg stderr:', line));
  command.on('end', () => console.log('FFmpeg finished'));
  command.pipe(output);
  command.run();

  (async () => {
    if (animation?.scenes) {
      for (const [sceneIndex, scene] of animation.scenes.entries()) {
        const frames = Math.round((scene.duration_ms / 1000) * fps);
        console.log(`Rendering scene ${sceneIndex} with ${frames} frames`);
        for (let i = 0; i < frames; i++) {
          const t = (i / fps) * 1000;
          ctx.fillStyle = scene.backgroundColor || '#fff';
          ctx.fillRect(0, 0, width, height);
          for (const a of scene.backgroundActors) drawActor(ctx, a, t, width, height, baseUnit, emojiFont);
          for (const a of scene.actors) drawActor(ctx, a, t, width, height, baseUnit, emojiFont);
          const buffer = canvas.toBuffer('image/png');
          frameStream.write(buffer);
          if (i % 10 === 0) console.log(`Scene ${sceneIndex} frame ${i}/${frames}`);
        }
      }
    }
    frameStream.end();
    console.log('Finished writing frames to FFmpeg');
  })();

  console.log('Streaming MP4 response for', clipId);
  return new Response(Readable.toWeb(output), {
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Disposition': `attachment; filename="${clipId}.mp4"`,
    },
  });
}

