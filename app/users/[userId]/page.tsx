'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProfileById, getUserChannels, getMoviesByUser } from '../../../lib/supabaseClient';
import { MovieCard } from '../../../components/MovieCard';
import Image from 'next/image';

export default function UserPage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  const [profile, setProfile] = useState<any | null>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [movies, setMovies] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [p, ch, mv] = await Promise.all([
          getProfileById(userId).catch(() => null),
          getUserChannels(userId),
          getMoviesByUser(userId).catch(() => []),
        ]);
        setProfile(p);
        setChannels(ch || []);
        setMovies(mv || []);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            {profile?.display_name || 'Unknown User'}
          </h1>
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt="Avatar"
              width={96}
              height={96}
              className="w-24 h-24 rounded-full mx-auto mt-4 object-cover"
            />
          ) : (
            <p className="text-gray-500 mt-4">This user hasn&apos;t set up a profile yet.</p>
          )}
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Channels</h2>
          {channels.length === 0 ? (
            <p className="text-gray-500">This user has no channels yet.</p>
          ) : (
            <ul className="space-y-4">
              {channels.map((ch) => (
                <li key={ch.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                  <Link
                    href={`/channel/${encodeURIComponent(ch.name)}`}
                    className="text-lg font-medium text-blue-600 hover:underline"
                  >
                    {ch.name}
                  </Link>
                  {ch.description && (
                    <p className="text-sm text-gray-600">{ch.description}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Movies</h2>
          {movies.length === 0 ? (
            <p className="text-gray-500">No movies yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {movies.map((movie) => (
                <div
                  key={movie.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
                >
                  <MovieCard movie={movie} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

