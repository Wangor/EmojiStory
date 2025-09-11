'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { searchMovies } from '../../lib/supabaseClient';
import { MovieCard } from '../../components/MovieCard';

function SearchContent() {
  const params = useSearchParams();
  const query = params.get('q') ?? '';
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orientationFilter, setOrientationFilter] =
    useState<'landscape' | 'portrait'>('landscape');

  useEffect(() => {
    if (!query) {
      setMovies([]);
      return;
    }
    setLoading(true);
    setError(null);
    searchMovies(query)
      .then(setMovies)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">
          Search Results{query ? ` for "${query}"` : ''}
        </h1>
        {!query && <p className="text-gray-600">Enter a search term above.</p>}
        {loading && <p className="text-gray-600">Searching...</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && movies.length === 0 && query && (
          <p className="text-gray-600">No movies found.</p>
        )}
        <div className="flex justify-center mb-6 gap-4 mt-6">
          <button
            onClick={() => setOrientationFilter('landscape')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              orientationFilter === 'landscape'
                ? 'bg-orange-400 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Landscape
          </button>
          <button
            onClick={() => setOrientationFilter('portrait')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              orientationFilter === 'portrait'
                ? 'bg-orange-400 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Portrait
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {movies
            .filter((m) => m.orientation === orientationFilter)
            .map((movie) => (
              <div key={movie.id}>
                <MovieCard movie={movie} />
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold mb-6">Search Results</h1>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
