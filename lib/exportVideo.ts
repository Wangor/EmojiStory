import { createCanvas, loadImage, CanvasRenderingContext2D } from 'canvas';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';
import type { Animation, Scene, Actor } from '../components/AnimationTypes';

export interface WatermarkOptions {
  text?: string;
  image?: string; // data URL
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface ExportOptions {
  width: number;
  height: number;
  fps: number;
  watermark?: WatermarkOptions;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function sampleAt(times: number[], values: number[], p: number) {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];
  for (let i = 1; i < times.length; i++) {
    if (p <= times[i]) {
      const t0 = times[i - 1];
      const t1 = times[i];
      const v0 = values[i - 1];
      const v1 = values[i];
      const tt = (p - t0) / (t1 - t0);
      return lerp(v0, v1, tt);
    }
  }
  return values[values.length - 1];
}

function drawActor(ctx: CanvasRenderingContext2D, actor: Actor, w: number, h: number, duration: number, progress: number) {
  const frames = [
    actor.start && {
      t: 0,
      x: actor.start.x,
      y: actor.start.y,
      rotate: 0,
      scale: actor.start.scale
    },
    ...actor.tracks
  ]
    .filter((frame): frame is NonNullable<typeof frame> => Boolean(frame))
    .sort((a, b) => a.t - b.t);

  const times = frames.map((k) => k.t / Math.max(1, duration));
  const xVals = frames.map((k) => k.x * 100);
  const yVals = frames.map((k) => k.y * 100);
  const rotateVals = frames.map((k) => k.rotate ?? 0);
  const scaleVals = frames.map((k) => k.scale ?? actor.start?.scale ?? 1);

  const x = sampleAt(times, xVals, progress);
  const y = sampleAt(times, yVals, progress);
  const rotate = sampleAt(times, rotateVals, progress);
  const scale = sampleAt(times, scaleVals, progress);

  ctx.save();
  ctx.translate((x / 100) * w, (y / 100) * h);
  ctx.rotate((rotate * Math.PI) / 180);
  ctx.scale(scale, scale);

  if (actor.type === 'emoji') {
    const size = Math.round(48 * (actor.start?.scale ?? 1));
    ctx.font = `${size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(actor.emoji, 0, 0);
  } else if (actor.type === 'text') {
    const size = actor.fontSize ?? Math.round(32 * (actor.start?.scale ?? 1));
    ctx.font = `${size}px sans-serif`;
    ctx.fillStyle = actor.color ?? 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(actor.text, 0, 0);
  } else if (actor.type === 'composite') {
    actor.parts.forEach((p) => {
      const part = { ...p, start: { x: p.start?.x ?? 0, y: p.start?.y ?? 0, scale: p.start?.scale ?? 1 } } as Actor;
      drawActor(ctx, part, w, h, duration, progress);
    });
  }
  ctx.restore();
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  scene: Scene,
  w: number,
  h: number,
  progress: number
) {
  ctx.clearRect(0, 0, w, h);
  [...scene.backgroundActors, ...scene.actors]
    .slice()
    .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
    .forEach((a) => drawActor(ctx, a, w, h, scene.duration_ms, progress));
  if (scene.caption) {
    ctx.fillStyle = 'white';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(scene.caption, w / 2, h - 30);
  }
}

function drawWatermark(
  ctx: CanvasRenderingContext2D,
  canvas: { width: number; height: number },
  watermark: { text?: string; image?: any; position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }
) {
  const pos = watermark.position ?? 'bottom-right';
  const padding = 10;
  let x = padding;
  let y = padding;
  if (pos.includes('right')) x = canvas.width - padding;
  if (pos.includes('bottom')) y = canvas.height - padding;
  ctx.save();
  ctx.globalAlpha = 0.7;
  if (watermark.image) {
    const img = watermark.image;
    const w = img.width;
    const h = img.height;
    if (pos.includes('right')) x -= w;
    if (pos.includes('bottom')) y -= h;
    ctx.drawImage(img, x, y, w, h);
  } else if (watermark.text) {
    ctx.font = '20px sans-serif';
    const metrics = ctx.measureText(watermark.text);
    if (pos.includes('right')) x -= metrics.width;
    if (pos.includes('bottom')) y -= 20;
    ctx.fillStyle = 'white';
    ctx.fillText(watermark.text, x, y);
  }
  ctx.restore();
}

export async function exportVideo(animation: Animation, options: ExportOptions): Promise<Buffer> {
  const { width, height, fps, watermark } = options;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Cannot acquire 2D context');

  let loadedWatermark: { text?: string; image?: any; position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' } | undefined;
  if (watermark) {
    loadedWatermark = { text: watermark.text, position: watermark.position };
    if (watermark.image) {
      loadedWatermark.image = await loadImage(watermark.image);
    }
  }

  return new Promise<Buffer>((resolve, reject) => {
    const frameStream = new PassThrough();
    const command = ffmpeg()
      .input(frameStream)
      .inputFormat('image2pipe')
      .fps(fps)
      .videoCodec('libx264')
      .outputOptions('-pix_fmt yuv420p')
      .format('mp4')
      .on('error', reject);
    const ffmpegPath = process.env.FFMPEG_PATH;
    if (ffmpegPath) command.setFfmpegPath(ffmpegPath);

    const chunks: Buffer[] = [];
    command
      .pipe()
      .on('data', (c: Buffer) => chunks.push(c))
      .on('end', () => resolve(Buffer.concat(chunks)))
      .on('error', reject);

    (async () => {
      try {
        for (const scene of animation.scenes) {
          const sceneFrames = Math.ceil((scene.duration_ms / 1000) * fps);
          for (let i = 0; i < sceneFrames; i++) {
            const progress = i / sceneFrames;
            drawScene(ctx, scene, width, height, progress);
            if (loadedWatermark) drawWatermark(ctx, { width, height }, loadedWatermark);
            const frame = canvas.toBuffer('image/png');
            frameStream.write(frame);
          }
        }
        frameStream.end();
      } catch (err) {
        reject(err);
      }
    })();
  });
}

