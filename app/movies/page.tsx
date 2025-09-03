'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { FilmSlateIcon } from '@phosphor-icons/react';
import { getAllMovies } from '../../lib/supabaseClient';
import { MovieCard } from '../../components/MovieCard';

function MoviesContent() {
  const [movies, setMovies] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllMovies()
      .then(setMovies)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 flex items-center justify-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <FilmSlateIcon weight="bold" size={36} className="text-white" />
            </div>
            Released Movies
          </h1>
          <p className="text-gray-600 text-lg">
            Browse publicly released emoji movies
          </p>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-16">
            <div className="flex items-center gap-3 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-lg">Loading movies...</span>
            </div>
          </div>
        )}

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

        {!loading && movies.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 opacity-30">
              <FilmSlateIcon weight="light" size={96} className="text-gray-400" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-3">No Movies Yet</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              No movies have been released yet.
            </p>
          </div>
        )}

        {!loading && movies.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {movies.map(movie => (
              <Link key={movie.id} href={`/movies/${movie.id}`} className="block">
                <MovieCard movie={movie} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MoviesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100" /> }>
      <MoviesContent />
    </Suspense>
  );
}
