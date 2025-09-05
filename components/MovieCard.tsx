import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { HeartIcon, TelevisionSimpleIcon } from '@phosphor-icons/react';
import { ShareButton } from './ShareButton';
import type {
  Animation,
  Scene,
  Actor,
  EmojiActor,
  CompositeActor,
} from './AnimationTypes';
import { likeMovie, getMovieLikes } from '../lib/supabaseClient';
import { useEmojiFont } from '../lib/emojiFonts';

function SceneThumbnail({ scene, emojiFont }: { scene: Scene; emojiFont?: string }) {
  const defaultBg = emojiFont === 'Noto Emoji' ? '#ffffff' : '#000000';

  const renderEmoji = (a: EmojiActor) => {
    const first = a.tracks?.[0];
    const start =
      a.start ||
      (first
        ? { x: first.x, y: first.y, scale: first.scale ?? 1 }
        : { x: 0, y: 0, scale: 1 });
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
          fontFamily: emojiFont,
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
      const first = comp.tracks?.[0];
      const pos = comp.start ?? (first ? { x: first.x, y: first.y } : { x: 0, y: 0 });
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
                  fontFamily: emojiFont,
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
      className="relative w-full aspect-video rounded-md overflow-hidden border"
      style={{ backgroundColor: scene.backgroundColor ?? defaultBg }}
    >
      {(Array.isArray(scene.backgroundActors)
        ? scene.backgroundActors
        : []
      ).map((a) => renderActor(a))}
      {(Array.isArray(scene.actors) ? scene.actors : []).map((a) => renderActor(a))}
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
    animation: Animation | string;
    channels?: {
      name: string;
      user_id: string;
    };
  };
}) {
  const deepParse = (value: any): any => {
    if (typeof value === 'string') {
      try {
        return deepParse(JSON.parse(value));
      } catch {
        return value;
      }
    }
    if (Array.isArray(value)) {
      return value.map((v) => deepParse(v));
    }
    if (value && typeof value === 'object') {
      const result: any = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = deepParse(v);
      }
      return result;
    }
    return value;
  };

  const animation = deepParse(movie.animation) as Animation | null;
  const firstScene = Array.isArray((animation as any)?.scenes)
    ? ((animation as any).scenes[0] as Scene)
    : undefined;
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const emojiFont = animation?.emojiFont || (movie as any).emoji_font;

  useEmojiFont(emojiFont);

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
    <div className="flex flex-col">
      {firstScene ? (
        <SceneThumbnail scene={firstScene} emojiFont={emojiFont} />
      ) : (
        <div className="w-full aspect-video rounded-md bg-gray-200" />
      )}
      <div className="mt-2 flex flex-col gap-1">
        <div className="text-sm font-semibold leading-tight line-clamp-2">
          {movie.title || movie.story.slice(0, 30)}
        </div>
        {movie.channels ? (
          <Link
            href={`/channel/${encodeURIComponent(movie.channels.name)}`}
            className="group inline-flex items-center gap-1 text-xs text-gray-500 truncate hover:text-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            <TelevisionSimpleIcon weight="bold" className="group-hover:text-gray-700" />
            <span className="truncate">@{movie.channels.name}</span>
          </Link>
        ) : (
          <div className="text-xs text-gray-500 truncate">Unknown channel</div>
        )}
        {movie.description && (
          <div className="text-xs text-gray-500 truncate">
            {movie.description}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1 text-xs ${liked ? 'text-orange-400' : 'text-gray-500'}`}
          >
            <HeartIcon weight={liked ? 'fill' : 'regular'} size={14} />
            <span>{likes}</span>
          </button>
          <ShareButton movieId={movie.id} url={`/movies/${movie.id}`} />
        </div>
      </div>
    </div>
  );
}
