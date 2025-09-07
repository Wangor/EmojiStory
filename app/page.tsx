import Link from 'next/link';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { MovieCard } from '../components/MovieCard';

export default async function Page() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    },
  );

  const pageSize = 8;
  let error: string | null = null;

  const [
    { data: moviesData, error: moviesError },
    { data: trendingData, error: trendingError },
    { data: userData },
  ] = await Promise.all([
    supabase
      .from('movies')
      .select(`*, channels!movies_channel_id_fkey(id, name, user_id)`)
      .not('publish_datetime', 'is', null)
      .lte('publish_datetime', new Date().toISOString())
      .order('created_at', { ascending: false })
      .range(0, pageSize - 1),
    supabase
      .from('movies')
      .select(
        `*, channels!movies_channel_id_fkey(id, name, user_id), likes(user_id)`,
      )
      .not('publish_datetime', 'is', null)
      .lte('publish_datetime', new Date().toISOString())
      .limit(50),
    supabase.auth.getUser(),
  ]);

  if (moviesError) error = moviesError.message;
  if (trendingError && !error) error = trendingError.message;

  const movies = moviesData || [];

  let trending = (trendingData || []).slice();
  trending.sort((a: any, b: any) => (b.likes?.length || 0) - (a.likes?.length || 0));
  trending = trending.slice(0, 8);

  const user = userData?.user;
  let recommended: any[] = [];
  let following: any[] = [];

  if (user) {
    const { data: recData } = await supabase
      .from('movies')
      .select(
        `*, channels!movies_channel_id_fkey(id, name, user_id), likes(user_id)`,
      )
      .not('publish_datetime', 'is', null)
      .lte('publish_datetime', new Date().toISOString())
      .neq('user_id', user.id)
      .limit(50);
    const recMovies = (recData || []).filter(
      (m: any) => !(m.likes || []).some((l: any) => l.user_id === user.id),
    );
    recMovies.sort(
      (a: any, b: any) => (b.likes?.length || 0) - (a.likes?.length || 0),
    );
    recommended = recMovies.slice(0, 8);

    const { data: follows } = await supabase
      .from('follows')
      .select('channel_id')
      .eq('follower_id', user.id);
    const ids = (follows || []).map((f: any) => f.channel_id);
    if (ids.length > 0) {
      const { data: followingData } = await supabase
        .from('movies')
        .select(`*, channels!movies_channel_id_fkey(id, name, user_id)`)
        .in('channel_id', ids)
        .not('publish_datetime', 'is', null)
        .lte('publish_datetime', new Date().toISOString())
        .order('created_at', { ascending: false });
      following = followingData || [];
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="text-center mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center justify-center gap-3 mb-1">
            <div className="p-2 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-xl shadow-lg">
              <span
                className="text-2xl"
                role="img"
                aria-label="clapper board"
              >
                🎬
              </span>
            </div>
            Emoji Movie Studio
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Create AI-powered emoji movies from your stories
          </p>
        </div>

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
              {movies.map((m: any) => (
                <Link key={m.id} href={`/movies/${m.id}`} className="cursor-pointer">
                  <MovieCard movie={m} />
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-center">Following</h2>
          {following.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {following.map((m: any) => (
                <Link key={m.id} href={`/movies/${m.id}`} className="cursor-pointer">
                  <MovieCard movie={m} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">
              Follow channels to see their movies.
            </p>
          )}
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-center">Trending</h2>
          {trending.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {trending.map((m: any) => (
                <Link key={m.id} href={`/movies/${m.id}`} className="cursor-pointer">
                  <MovieCard movie={m} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">
              No trending movies yet.
            </p>
          )}
        </div>

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4 text-center">Recommended for You</h2>
          {recommended.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recommended.map((m: any) => (
                <Link key={m.id} href={`/movies/${m.id}`} className="cursor-pointer">
                  <MovieCard movie={m} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600">
              Sign in or like movies to see recommendations.
            </p>
          )}
        </div>

        <div className="flex justify-center mt-12 mb-6">
          <Link
            href="/create"
            className="group flex items-center gap-2 px-6 py-3 bg-orange-400 hover:bg-orange-500 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium"
          >
            <span
              className="group-hover:scale-110 transition-transform"
              role="img"
              aria-label="magic wand"
            >
              🪄
            </span>
            Create
          </Link>
        </div>
      </div>
    </main>
  );
}

