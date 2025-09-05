'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, HeartIcon } from '@phosphor-icons/react';
import type { Animation } from './AnimationTypes';
import { EmojiPlayer } from './EmojiPlayer';
import { ClipComments } from './ClipComments';
import { ShareButton } from './ShareButton';
import {
  likeMovie,
  getMovieLikes,
  getUserChannels,
  recordPlay,
} from '../lib/supabaseClient';

export default function MovieDetail({ movie }: { movie: any }) {
  const router = useRouter();
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [authorChannel, setAuthorChannel] = useState<string | null>(null);

  useEffect(() => {
    if (movie?.id) {
      getMovieLikes(movie.id).then(({ count, liked }) => {
        setLikes(count);
        setLiked(liked);
      });
      recordPlay(movie.id).catch(() => {});
    }
    if (movie?.user_id) {
      getUserChannels(movie.user_id)
        .then((chs) => setAuthorChannel(chs?.[0]?.name || null))
        .catch(() => setAuthorChannel(null));
    }
  }, [movie]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <button
          onClick={() => router.push('/movies')}
          className="group flex items-center gap-2 mb-6 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200"
        >
          <ArrowLeftIcon weight="bold" size={20} className="group-hover:scale-110 transition-transform" />
          Back to Movies
        </button>

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
          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${liked ? 'text-orange-400 border-orange-400 bg-red-50' : 'text-gray-600 border-gray-300'}`}
            >
              <HeartIcon weight={liked ? 'fill' : 'regular'} />
              <span>{likes}</span>
            </button>
            <ShareButton movieId={movie.id} url={`/movies/${movie.id}`} />
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-5xl">
            <EmojiPlayer
              animation={{ ...(movie.animation as Animation), emojiFont }}
              width={1000}
              height={600}
            />
            <ClipComments movieId={movie.id} movieOwnerId={movie.user_id} />
          </div>
        </div>
      </div>
    </div>
  );
}
