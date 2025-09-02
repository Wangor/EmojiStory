'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Play, ArrowLeft, FilmSlate, Clock, Heart } from '@phosphor-icons/react';
import { getMoviesByUser, likeMovie, getMovieLikes, getMovieById } from '../../lib/supabaseClient';
import type { Animation } from '../../components/AnimationTypes';
import { EmojiPlayer } from '../../components/EmojiPlayer';
import { MovieCard } from '../../components/MovieCard';
import { ClipComments } from '../../components/ClipComments';
import { ShareButton } from '../../components/ShareButton';

function MoviesContent() {
  const [movies, setMovies] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const params = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    getMoviesByUser()
      .then(setMovies)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const movieId = params.get('movie');
    if (movieId) {
      const existing = movies.find((m) => m.id === movieId);
      if (existing) {
        setSelected(existing);
      } else {
        getMovieById(movieId).then(setSelected).catch(console.error);
      }
    }
  }, [movies, params]);

  useEffect(() => {
    if (selected) {
      getMovieLikes(selected.id).then(({ count, liked }) => {
        setLikes(count);
        setLiked(liked);
      });
    }
  }, [selected]);

  const toggleLike = async () => {
    if (!selected) return;
    try {
      const { liked: newLiked } = await likeMovie(selected.id);
      setLiked(newLiked);
      setLikes((c) => c + (newLiked ? 1 : -1));
    } catch (err) {
      console.error(err);
    }
  };

  if (selected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Back Button */}
          <button
            onClick={() => {
              setSelected(null);
              router.replace('/movies');
            }}
            className="group flex items-center gap-2 mb-6 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200"
          >
            <ArrowLeft weight="bold" size={20} className="group-hover:scale-110 transition-transform" />
            Back to Movies
          </button>

          {/* Movie Title */}
          <div className="text-center mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {selected.title || selected.story.slice(0, 50)}
            </h1>
            {selected.description && (
              <p className="text-gray-600 text-lg max-w-3xl mx-auto">
                {selected.description}
              </p>
            )}
            <div className="mt-4 flex justify-center gap-2">
              <button
                onClick={toggleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${liked ? 'text-red-600 border-red-300 bg-red-50' : 'text-gray-600 border-gray-300'}`}
              >
                <Heart weight={liked ? 'fill' : 'regular'} />
                <span>{likes}</span>
              </button>
              <ShareButton movieId={selected.id} />
            </div>
          </div>

          {/* Player */}
          <div className="flex justify-center">
            <div className="w-full max-w-5xl">
              <EmojiPlayer
                animation={selected.animation as Animation}
                width={1000}
                height={600}
              />
              <ClipComments movieId={selected.id} movieOwnerId={selected.user_id} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 flex items-center justify-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
              <FilmSlate weight="bold" size={36} className="text-white" />
            </div>
            My Movie Collection
          </h1>
          <p className="text-gray-600 text-lg">
            Your personal collection of AI-generated emoji movies
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="flex items-center gap-3 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="text-lg">Loading your movies...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <h3 className="font-semibold text-red-800 mb-2">Unable to Load Movies</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && movies.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 opacity-30">
              <FilmSlate weight="light" size={96} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-3">No Movies Yet</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              You haven&#39;t created any movies yet. Head back to the studio to create your first emoji movie!
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              <FilmSlate weight="bold" size={20} />
              Go to Studio
            </a>
          </div>
        )}

        {/* Movies Grid */}
        {!loading && movies.length > 0 && (
          <>
            <div className="text-center mb-6">
              <p className="text-gray-600">
                {movies.length} {movies.length === 1 ? 'movie' : 'movies'} in your collection
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {movies.map(movie => (
                <div
                  key={movie.id}
                  className="group bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-200 hover:border-gray-300 transition-all duration-300 overflow-hidden flex flex-col h-full"
                >
                  {/* Movie Card with Thumbnail */}
                  <div className="p-4">
                    <MovieCard movie={movie} />
                  </div>

                  {/* Movie Info - This section will grow to fill available space */}
                  <div className="px-4 pb-4 flex-1 flex flex-col">
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {movie.animation?.scenes?.length || 0} scenes
                      </span>
                      {movie.created_at && (
                        <span>
                          {new Date(movie.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Story Preview - This will grow to fill space */}
                    <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-3">
                      {movie.story}
                    </p>

                    {/* Play Button - This stays at the bottom */}
                    <button
                      onClick={() => {
                        setSelected(movie);
                        router.replace(`/movies?movie=${movie.id}`);
                      }}
                      className="group/play w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 font-medium mt-auto"
                    >
                      <div className="flex items-center justify-center w-5 h-5 bg-white/20 rounded-full group-hover/play:bg-white/30 transition-colors">
                        <Play weight="fill" size={12} className="text-white ml-0.5" />
                      </div>
                      Watch Movie
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        {!loading && movies.length > 0 && (
          <div className="text-center mt-12 pt-8 border-t border-gray-200">
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              <FilmSlate weight="bold" size={20} />
              Create New Movie
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MoviesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 flex items-center justify-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                <FilmSlate weight="bold" size={36} className="text-white" />
              </div>
              My Movie Collection
            </h1>
            <p className="text-gray-600 text-lg">Loading your movies...</p>
          </div>
        </div>
      </div>
    }>
      <MoviesContent />
    </Suspense>
  );
}
