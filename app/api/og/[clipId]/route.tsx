import { ImageResponse } from 'next/og';
import { getClip } from '../../../../lib/supabaseServer';
import { fetchEmojiFontData } from '../../../../lib/emojiFontData';
import type { ReactNode } from 'react';
import type {
  Scene,
  Actor,
  EmojiActor,
  CompositeActor,
} from '../../../../components/AnimationTypes';

export const runtime = 'nodejs';

export async function GET(request: Request, { params }: { params: { clipId: string } }) {
  const { clipId } = params;
  let clip: any = null;
  try {
    clip = await getClip(clipId);
  } catch {}

  const scene: Scene | undefined = clip?.animation?.scenes?.[0];
  const emojiFont = clip?.animation?.emojiFont || clip?.emoji_font;
  const fonts = await fetchEmojiFontData(emojiFont);
  const width = 1200;
  const height = Math.round((width * 9) / 16);
  const baseUnit = width / 12.5;
  const title = clip?.title || 'Emoji Clip';

  function renderEmoji(a: EmojiActor) {
    const start = a.start ?? {
      x: a.tracks[0].x,
      y: a.tracks[0].y,
      scale: a.tracks[0].scale ?? 1,
    };
    const size = Math.round(baseUnit * start.scale);
    const left = start.x * width - size / 2;
    const top = start.y * height - size / 2;
    return (
      <span
        key={a.id}
        style={{
          position: 'absolute',
          left,
          top,
          fontSize: size,
          fontFamily: emojiFont,
          ...(a.flipX ? { transform: 'scaleX(-1)' } : {}),
        }}
      >
        {a.emoji}
      </span>
    );
  }

  function renderActor(actor: Actor): ReactNode {
    if (actor.type === 'emoji') {
      return renderEmoji(actor);
    }
    if (actor.type === 'composite') {
      const comp = actor as CompositeActor;
      if (comp.parts.length === 0) return null;

      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      for (const p of comp.parts) {
        const s = p.start?.scale ?? 1;
        const x0 = p.start?.x ?? 0;
        const y0 = p.start?.y ?? 0;
        minX = Math.min(minX, x0);
        minY = Math.min(minY, y0);
        maxX = Math.max(maxX, x0 + s);
        maxY = Math.max(maxY, y0 + s);
      }

      const dominant = Math.max(...comp.parts.map((p) => p.start?.scale ?? 1));
      const unitSize =
        comp.meta?.sizeOverride ??
        Math.round((baseUnit * (comp.start?.scale ?? 1)) / dominant);

      const widthP = (maxX - minX) * unitSize;
      const heightP = (maxY - minY) * unitSize;
      const pos = comp.start ?? { x: comp.tracks[0].x, y: comp.tracks[0].y };
      const left = pos.x * width - widthP / 2;
      const top = pos.y * height - heightP / 2;

      return (
        <span
          key={comp.id}
          style={{
            position: 'absolute',
            left,
            top,
            width: widthP,
            height: heightP,
            display: 'flex',
            ...(comp.flipX ? { transform: 'scaleX(-1)' } : {}),
          }}
        >
          {comp.parts.map((p) => {
            const ps = p.start?.scale ?? 1;
            const partSize = unitSize * ps;
            const offsetX = ((p.start?.x ?? 0) - minX) * unitSize;
            const offsetY = ((p.start?.y ?? 0) - minY) * unitSize;
            return (
              <span
                key={p.id}
                style={{
                  position: 'absolute',
                  left: offsetX,
                  top: offsetY,
                  fontSize: partSize,
                  fontFamily: emojiFont,
                  ...(p.flipX ? { transform: 'scaleX(-1)' } : {}),
                }}
              >
                {p.emoji}
              </span>
            );
          })}
        </span>
      );
    }
    return null;
  }

  if (!scene) {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fff',
            fontSize: Math.round(baseUnit * 1.5),
            fontWeight: 700,
          }}
        >
          {title}
        </div>
      ),
      {
        width,
        height,
        fonts,
      }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          background: '#fff',
          display: 'flex',
        }}
      >
        {scene.backgroundActors.map((a) => renderActor(a))}
        {scene.actors.map((a) => renderActor(a))}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            padding: '24px 40px',
            fontSize: Math.round(baseUnit * 1.2),
            fontWeight: 700,
            textAlign: 'center',
            background:
              'linear-gradient(to top, rgba(255,255,255,0.9), rgba(255,255,255,0))',
          }}
        >
          {title}
        </div>
      </div>
    ),
    {
      width,
      height,
      fonts,
    }
  );
}
