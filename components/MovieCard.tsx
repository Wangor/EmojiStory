import React from 'react';
import type {
  Animation,
  Scene,
  Actor,
  EmojiActor,
  CompositeActor,
} from './AnimationTypes';

function SceneThumbnail({ scene }: { scene: Scene }) {
  const width = 160;
  const height = 90;

  const renderEmoji = (a: EmojiActor) => {
    const start = a.start ?? {
      x: a.tracks[0].x,
      y: a.tracks[0].y,
      scale: a.tracks[0].scale ?? 1,
    };
    const size = Math.round(32 * start.scale);
    const left = start.x * width;
    const top = start.y * height;
    return (
      <span
        key={a.id}
        style={{
          position: 'absolute',
          left,
          top,
          fontSize: size,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            transform: a.flipX ? 'scaleX(-1)' : undefined,
          }}
        >
          {a.emoji}
        </span>
      </span>
    );
  };

  const renderActor = (actor: Actor): React.ReactNode => {
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
        Math.round((32 * (comp.start?.scale ?? 1)) / dominant);

      const widthP = (maxX - minX) * unitSize;
      const heightP = (maxY - minY) * unitSize;
      const pos = comp.start ?? { x: comp.tracks[0].x, y: comp.tracks[0].y };
      const left = pos.x * width;
      const top = pos.y * height;

      return (
        <span
          key={comp.id}
          style={{
            position: 'absolute',
            left,
            top,
            width: widthP,
            height: heightP,
            transform: `translate(-50%, -50%)${comp.flipX ? ' scaleX(-1)' : ''}`,
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
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    transform: p.flipX ? 'scaleX(-1)' : undefined,
                  }}
                >
                  {p.emoji}
                </span>
              </span>
            );
          })}
        </span>
      );
    }
    return null;
  };

  return (
    <div
      className="relative bg-white rounded-md overflow-hidden border"
      style={{ width, height }}
    >
      {scene.backgroundActors.map((a) => renderActor(a))}
      {scene.actors.map((a) => renderActor(a))}
    </div>
  );
}

export function MovieCard({
  movie,
}: {
  movie: { title?: string; story: string; animation: Animation };
}) {
  const firstScene = movie.animation?.scenes?.[0];
  return (
    <div className="space-y-2">
      {firstScene ? <SceneThumbnail scene={firstScene} /> : null}
      <div className="text-sm font-medium truncate">
        {movie.title || movie.story.slice(0, 30)}
      </div>
    </div>
  );
}

