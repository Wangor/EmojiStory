'use client';

import { useEffect, useState } from 'react';
import { getChannelWithMovies } from '../../../lib/supabaseClient';
import { MovieCard } from '../../../components/MovieCard';

export default function ChannelViewPage({ params }: { params: { name: string } }) {
  const { name } = params;
  const [channel, setChannel] = useState<any | null>(null);
  const [movies, setMovies] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) return;
    getChannelWithMovies(name)
      .then(({ channel, movies }) => {
        setChannel(channel);
        setMovies(movies);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [name]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    );
  }

  if (error || !channel) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">{error || 'Channel not found'}</div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{channel.name}</h1>
          {channel.description && (
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">{channel.description}</p>
          )}
        </div>

        {movies.length === 0 ? (
          <p className="text-center text-gray-500">No movies yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <div key={movie.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

