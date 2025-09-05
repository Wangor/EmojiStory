'use client';

/* eslint-disable import/no-unresolved */
import { FilmSlate, MagicWand } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MovieCard } from '../components/MovieCard';
import { getAllMovies } from '../lib/supabaseClient';

export default function Page() {
  const [movies, setMovies] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    getAllMovies().then(setMovies).catch((e) => setError(e.message));
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 flex items-center justify-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <FilmSlate weight="bold" size={36} className="text-white" />
            </div>
            Emoji Movie Studio
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Transform your stories into animated emoji movies using AI
          </p>
        </div>

        {/* Call to Action */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => router.push('/create')}
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            <MagicWand weight="bold" size={20} className="group-hover:scale-110 transition-transform" />
            Generate with AI
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 text-red-500 mt-0.5">⚠️</div>
              <div>
                <h3 className="font-semibold text-red-800 mb-1">Error</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {movies.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4 text-center">Latest Movies</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {movies.map((m) => (
                <div
                  key={m.id}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    if (!target.closest('a,button')) {
                      router.push(`/movies/${m.id}`);
                    }
                  }}
                  className="cursor-pointer"
                >
                  <MovieCard movie={m} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

