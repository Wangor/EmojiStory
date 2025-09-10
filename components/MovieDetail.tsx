'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { HeartIcon, PlayIcon } from '@phosphor-icons/react';
import type { Animation } from './AnimationTypes';
import { EmojiPlayer } from './EmojiPlayer';
import { ClipComments } from './ClipComments';
import { ShareButton } from './ShareButton';
import { getCanvasDimensions } from '../lib/aspectRatio';
import {
  likeMovie,
  getMovieLikes,
  getUserChannels,
  recordPlay,
  getMoviePlays,
  getUser,
} from '../lib/supabaseClient';
import ReportModal from './ReportModal';
import { formatCount } from '../lib/format';

export default function MovieDetail({ movie }: { movie: any }) {
  const [plays, setPlays] = useState(0);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [authorChannel, setAuthorChannel] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const hasRecorded = useRef(false);

  useEffect(() => {
    if (movie?.id) {
      getMovieLikes(movie.id).then(({ count, liked }) => {
        setLikes(count);
        setLiked(liked);
      });
      getMoviePlays(movie.id).then(setPlays);
      if (!hasRecorded.current) {
        hasRecorded.current = true;
        recordPlay(movie.id)
          .then(() => setPlays((p) => p + 1))
          .catch(() => {});
      }
    }
    if (movie?.user_id) {
      getUserChannels(movie.user_id)
        .then((chs) => setAuthorChannel(chs?.[0]?.name || null))
        .catch(() => setAuthorChannel(null));
    }
    getUser().then(setUser).catch(() => setUser(null));
  }, [movie?.id, movie?.user_id]);

  const toggleLike = async () => {
    if (!movie?.id) return;
    try {
      const { liked: newLiked } = await likeMovie(movie.id);
      setLiked(newLiked);
      setLikes((c) => c + (newLiked ? 1 : -1));
    } catch (err) {
      console.error(err);
    }
  };

  const emojiFont = movie.animation?.emojiFont || (movie as any).emoji_font;
  const firstScene = Array.isArray(movie.animation?.scenes)
    ? movie.animation.scenes[0]
    : undefined;
  const ratio = firstScene?.aspectRatio || movie.animation?.aspectRatio || '16:9';
  const { width, height } = getCanvasDimensions(ratio, 1000);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <nav className="mb-6 text-sm text-gray-600">
          <ol className="flex items-center gap-2">
            <li>
              <Link href="/" className="hover:underline">
                Home
              </Link>
            </li>
            <li>→</li>
            <li>
              <Link href="/movies" className="hover:underline">
                Movies
              </Link>
            </li>
            <li>→</li>
            <li className="text-gray-900">
              {movie.title || movie.story.slice(0, 50)}
            </li>
          </ol>
        </nav>

        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            {movie.title || movie.story.slice(0, 50)}
          </h1>
          {movie.description && (
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              {movie.description}
            </p>
          )}
          <div className="mt-2 text-sm text-gray-600">
            By{' '}
            <Link
              href={`/users/${movie.user_id}`}
              className="text-orange-400 hover:underline"
            >
              {authorChannel ? `@${authorChannel}` : 'Unknown'}
            </Link>
          </div>
          {(movie.categories?.length || movie.tags?.length) && (
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {movie.categories?.map((cat: string) => (
                <span
                  key={`cat-${cat}`}
                  className="px-2 py-1 text-xs bg-gray-200 rounded"
                >
                  {cat}
                </span>
              ))}
              {movie.tags?.map((tag: string) => (
                <span
                  key={`tag-${tag}`}
                  className="px-2 py-1 text-xs bg-orange-100 text-orange-600 rounded"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          <div className="mt-4 flex justify-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border text-gray-600 border-gray-300">
              <PlayIcon />
              <span>{formatCount(plays)}</span>
            </div>
            <button
              onClick={toggleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${liked ? 'text-orange-400 border-orange-400 bg-red-50' : 'text-gray-600 border-gray-300'}`}
            >
              <HeartIcon weight={liked ? 'fill' : 'regular'} />
              <span>{likes}</span>
            </button>
            <ShareButton movieId={movie.id} url={`/movies/${movie.id}`} />
            {user && (
              <button
                onClick={() => setReportOpen(true)}
                className="px-4 py-2 rounded-lg border text-red-600 border-red-600 hover:bg-red-50"
              >
                Report
              </button>
            )}
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-5xl">
            <EmojiPlayer
              animation={{ ...(movie.animation as Animation), emojiFont }}
              width={width}
              height={height}
            />
            {movie.description && (
              <article className="mt-8 whitespace-pre-line text-gray-800">
                {movie.description}
              </article>
            )}
            <ClipComments movieId={movie.id} movieOwnerId={movie.user_id} />
          </div>
        </div>
      </div>
      {user && (
        <ReportModal
          isOpen={reportOpen}
          targetId={movie.id}
          targetType="movie"
          reporterId={user.id}
          onClose={() => setReportOpen(false)}
        />
      )}
    </div>
  );
}
