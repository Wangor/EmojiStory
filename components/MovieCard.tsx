import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from '@phosphor-icons/react';
import type {
  Animation,
  Scene,
  Actor,
  EmojiActor,
  CompositeActor,
} from './AnimationTypes';
import { likeMovie, getMovieLikes } from '../lib/supabaseClient';

function SceneThumbnail({ scene }: { scene: Scene }) {
  const width = 160;
  const height = (width * 9) / 16; // match EmojiPlayer aspect ratio

  const renderEmoji = (a: EmojiActor) => {
    const start = a.start ?? {
      x: a.tracks[0].x,
      y: a.tracks[0].y,
      scale: a.tracks[0].scale ?? 1,
    };
    const size = Math.round(32 * start.scale);
    const left = start.x * 100;
    const top = start.y * 100;
    return (
      <span
        key={a.id}
        style={{
          position: 'absolute',
          left: `${left}%`,
          top: `${top}%`,
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
      const left = pos.x * 100;
      const top = pos.y * 100;

      return (
        <span
          key={comp.id}
          style={{
            position: 'absolute',
            left: `${left}%`,
            top: `${top}%`,
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
  movie: {
    id: string;
    title?: string;
    description?: string;
    story: string;
    animation: Animation;
    channels?: {
      name: string;
      user_id: string;
    };
  };
}) {
  const firstScene = movie.animation?.scenes?.[0];
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    getMovieLikes(movie.id).then(({ count, liked }) => {
      setLikes(count);
      setLiked(liked);
    });
  }, [movie.id]);

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { liked: newLiked } = await likeMovie(movie.id);
      setLiked(newLiked);
      setLikes((c) => c + (newLiked ? 1 : -1));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-2">
      {firstScene ? <SceneThumbnail scene={firstScene} /> : null}
      <div className="space-y-1">
        <div className="text-sm font-medium truncate">
          {movie.title || movie.story.slice(0, 30)}
        </div>
        {movie.description && (
          <div className="text-xs text-gray-500 truncate">{movie.description}</div>
        )}
        {movie.channels && (
          <Link
            href={`/channel/${encodeURIComponent(movie.channels.name)}`}
            className="group inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200 hover:border-blue-300 rounded-full text-xs font-medium text-blue-700 hover:text-blue-800 transition-all duration-200 shadow-sm hover:shadow-md max-w-fit"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-blue-500 group-hover:text-blue-600">📺</span>
            <span className="truncate">@{movie.channels.name}</span>
          </Link>
        )}
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1 text-xs ${liked ? 'text-red-600' : 'text-gray-500'}`}
        >
          <Heart weight={liked ? 'fill' : 'regular'} size={14} />
          <span>{likes}</span>
        </button>
      </div>
    </div>
  );
}
