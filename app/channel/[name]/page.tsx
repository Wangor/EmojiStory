'use client';

import { useEffect, useState } from 'react';
import {
  getChannelWithMovies,
  getUser,
  followChannel,
  unfollowChannel,
  supabase,
  getChannelFollowers,
} from '../../../lib/supabaseClient';
import { MovieCard } from '../../../components/MovieCard';
import Image from 'next/image';

export default function ChannelViewPage({ params }: { params: { name: string } }) {
  const { name } = params;
  const channelName = decodeURIComponent(name);
  const [channel, setChannel] = useState<any | null>(null);
  const [movies, setMovies] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState<any[]>([]);

  useEffect(() => {
    if (!channelName) return;
    getChannelWithMovies(channelName)
      .then(async ({ channel: ch, movies: mv }) => {
        setChannel(ch);
        setMovies(mv);
        try {
          const [u, fw] = await Promise.all([
            getUser().catch(() => null),
            getChannelFollowers(ch.id).catch(() => []),
          ]);
          setCurrentUser(u);
          setFollowers(fw);
          if (u) {
            const { data } = await supabase
              .from('follows')
              .select('*')
              .eq('follower_id', u.id)
              .eq('channel_id', ch.id)
              .maybeSingle();
            setIsFollowing(!!data);
          }
        } catch {
          // ignore
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [channelName]);

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
          <p className="text-gray-500 mt-2">
            {followers.length} follower{followers.length === 1 ? '' : 's'}
          </p>
          {currentUser && currentUser.id !== channel.user_id && (
            <button
              onClick={async () => {
                try {
                  if (isFollowing) {
                    await unfollowChannel(channel.id);
                    setIsFollowing(false);
                  } else {
                    await followChannel(channel.id);
                    setIsFollowing(true);
                  }
                  setFollowers(await getChannelFollowers(channel.id));
                } catch {
                  // ignore
                }
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              {isFollowing ? 'Unfollow' : 'Follow'}
            </button>
          )}
          {followers.length > 0 && (
            <ul className="mt-6 flex flex-wrap justify-center gap-4">
              {followers.map((f) => (
                <li key={f.id} className="flex items-center space-x-2">
                  {f.avatar_url && (
                    <Image
                      src={f.avatar_url}
                      alt={f.display_name || 'Follower'}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <span className="text-sm text-gray-700">
                    {f.display_name || 'Unnamed'}
                  </span>
                </li>
              ))}
            </ul>
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

