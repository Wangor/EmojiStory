'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { PlayIcon, FilmSlateIcon, ClockIcon, PencilSimpleIcon, UploadSimpleIcon } from '@phosphor-icons/react';
import { getMoviesByUser, publishMovie } from '../../lib/supabaseClient';
import { MovieCard } from '../../components/MovieCard';
import ReleaseModal from '../../components/ReleaseModal';

function MoviesContent() {
  const [movies, setMovies] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [releaseMovie, setReleaseMovie] = useState<any | null>(null);

  useEffect(() => {
    getMoviesByUser()
      .then(setMovies)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 flex items-center justify-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
              <FilmSlateIcon weight="bold" size={36} className="text-white" />
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
              <FilmSlateIcon weight="light" size={96} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-3">No Movies Yet</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              You haven&#39;t created any movies yet. Head back to the studio to create your first emoji movie!
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
            >
              <FilmSlateIcon weight="bold" size={20} />
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
              {movies.map(movie => {
                const released = movie.publish_datetime && new Date(movie.publish_datetime) <= new Date();
                return (
                  <div
                    key={movie.id}
                    className="group bg-white rounded-xl shadow-sm hover:shadow-lg border border-gray-200 hover:border-gray-300 transition-all duration-300 overflow-hidden flex flex-col h-full"
                  >
                    {/* Movie Card with Thumbnail */}
                    <Link href={`/movies/${movie.id}`} className="p-4 block">
                      <MovieCard movie={movie} />
                    </Link>

                    {/* Movie Info */}
                    <div className="px-4 pb-4 flex-1 flex flex-col">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <ClockIcon size={12} />
                          {movie.animation?.scenes?.length || 0} scenes
                        </span>
                        {movie.created_at && (
                          <span>{new Date(movie.created_at).toLocaleDateString()}</span>
                        )}
                      </div>

                      {/* Story Preview */}
                      <p className="text-sm text-gray-600 mb-4 flex-1 line-clamp-3">
                        {movie.story}
                      </p>

                      {/* Action Buttons */}
                      <div className="mt-auto flex gap-2 text-sm">
                        <Link
                          href={`/movies/${movie.id}`}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded"
                        >
                          <PlayIcon weight="fill" size={12} className="text-white" />
                          Watch
                        </Link>
                        {released ? (
                          <Link
                            href={`/editor?copy=${movie.id}`}
                            className="flex items-center justify-center gap-1 px-3 py-1.5 border rounded"
                          >
                            <PencilSimpleIcon weight="bold" size={12} />
                            Copy
                          </Link>
                        ) : (
                          <>
                            <Link
                              href={`/editor?id=${movie.id}`}
                              className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 border rounded"
                            >
                              <PencilSimpleIcon weight="bold" size={12} />
                              Edit
                            </Link>
            <button
              onClick={() => setReleaseMovie(movie)}
              className="flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded"
            >
              <UploadSimpleIcon weight="bold" size={12} className="text-white" />
              Publish
            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
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
              <FilmSlateIcon weight="bold" size={20} />
              Create New Movie
            </a>
          </div>
        )}
      </div>
      <ReleaseModal
        isOpen={releaseMovie !== null}
        onClose={() => setReleaseMovie(null)}
        onConfirm={async (date) => {
          if (!releaseMovie) return;
          try {
            const updated = await publishMovie(releaseMovie.id, releaseMovie.channel_id, date.toISOString());
            setMovies(m => m.map(x => x.id === releaseMovie.id ? updated : x));
          } catch (e: any) {
            setError(e.message);
          } finally {
            setReleaseMovie(null);
          }
        }}
      />
    </div>
  );
}

export default function MoviesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 flex items-center justify-center gap-3 mb-2">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                  <FilmSlateIcon weight="bold" size={36} className="text-white" />
                </div>
                My Movie Collection
              </h1>
              <p className="text-gray-600 text-lg">Loading your movies...</p>
            </div>
          </div>
        </div>
      }
    >
      <MoviesContent />
    </Suspense>
  );
}
