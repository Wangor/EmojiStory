'use client';

/* eslint-disable import/no-unresolved */
import { FilmSlate, MagicWand } from '@phosphor-icons/react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MovieCard } from '../components/MovieCard';
import {
  getAllMovies,
  getTrendingMovies,
  getRecommendedMovies,
  getFollowingMovies,
} from '../lib/supabaseClient';

export default function Page() {
  const [movies, setMovies] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [extrasLoaded, setExtrasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(0);
  const loadedIds = useRef(new Set<string>());
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();
  const pageSize = 8;

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const from = pageRef.current * pageSize;
      const to = from + pageSize - 1;
      const newMovies = await getAllMovies({ from, to });
      const unique = newMovies.filter((m) => !loadedIds.current.has(m.id));
      unique.forEach((m) => loadedIds.current.add(m.id));
      setMovies((prev) => [...prev, ...unique]);
      if (newMovies.length < pageSize) {
        setHasMore(false);
      }
      pageRef.current += 1;
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [pageSize, loading, hasMore]);

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const fetchExtras = async () => {
      try {
        const [trend, rec, fol] = await Promise.all([
          getTrendingMovies(),
          getRecommendedMovies(),
          getFollowingMovies(),
        ]);
        setTrending(trend);
        setRecommended(rec);
        setFollowing(fol);
      } catch {
        // ignore
      } finally {
        setExtrasLoaded(true);
      }
    };
    fetchExtras();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 300
      ) {
        loadMore();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-4">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center justify-center gap-3 mb-1">
            <div className="p-2 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-xl shadow-lg">
              <FilmSlate weight="bold" size={32} className="text-white" />
            </div>
            Emoji Movie Studio
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Create AI-powered emoji movies from your stories
          </p>
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
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4 text-center">Latest Movies</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-center">Following</h2>
          {following.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {following.map((m) => (
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
          ) : (
            extrasLoaded && (
              <p className="text-center text-gray-600">
                Follow channels to see their movies.
              </p>
            )
          )}
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-center">Trending</h2>
          {trending.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {trending.map((m) => (
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
          ) : (
            extrasLoaded && (
              <p className="text-center text-gray-600">
                No trending movies yet.
              </p>
            )
          )}
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-center">Recommended for You</h2>
          {recommended.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recommended.map((m) => (
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
          ) : (
            extrasLoaded && (
              <p className="text-center text-gray-600">
                Sign in or like movies to see recommendations.
              </p>
            )
          )}
        </div>

        {/* Call to Action */}
        <div className="flex justify-center mt-12 mb-6">
          <button
            onClick={() => router.push('/create')}
            className="group flex items-center gap-2 px-6 py-3 bg-orange-400 hover:bg-orange-500 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            <MagicWand weight="bold" size={20} className="group-hover:scale-110 transition-transform" />
            Create
          </button>
        </div>
      </div>
    </main>
  );
}

