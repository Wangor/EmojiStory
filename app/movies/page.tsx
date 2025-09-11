import Link from 'next/link';
import { FilmSlateIcon } from '@phosphor-icons/react/dist/ssr';
import { getAllMovies } from '../../lib/supabaseServer';
import { MovieCard } from '../../components/MovieCard';

const PAGE_SIZE = 24;

interface MoviesPageProps {
  searchParams?: {
    page?: string;
    category?: string;
    tag?: string;
    orientation?: 'portrait' | 'landscape';
  };
}

export default async function MoviesPage({ searchParams }: MoviesPageProps) {
  const page = Math.max(1, Number(searchParams?.page) || 1);
  const category = searchParams?.category || '';
  const tag = searchParams?.tag || '';
  const orientationFilter =
    searchParams?.orientation === 'portrait' ? 'portrait' : 'landscape';
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE;

  try {
    const movies = await getAllMovies({
      from,
      to,
      categories: category ? [category] : undefined,
      tags: tag ? [tag] : undefined,
    });
    const hasMore = movies.length > PAGE_SIZE;
    const visible = movies
      .slice(0, PAGE_SIZE)
      .filter((m) => m.orientation === orientationFilter);

    const baseParams = new URLSearchParams();
    if (category) baseParams.set('category', category);
    if (tag) baseParams.set('tag', tag);
    if (orientationFilter) baseParams.set('orientation', orientationFilter);
    const prevQuery = new URLSearchParams(baseParams);
    prevQuery.set('page', String(page - 1));
    const nextQuery = new URLSearchParams(baseParams);
    nextQuery.set('page', String(page + 1));

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 flex items-center justify-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-xl shadow-lg">
                <FilmSlateIcon weight="bold" size={36} className="text-white" />
              </div>
              Released Movies
            </h1>
            <p className="text-gray-600 text-lg">Browse publicly released emoji movies</p>
          </div>

          <form method="get" className="mb-8 flex flex-wrap items-center justify-center gap-4">
            <input
              type="text"
              name="category"
              placeholder="Category"
              defaultValue={category}
              className="px-3 py-2 border rounded-md text-sm"
            />
            <input
              type="text"
              name="tag"
              placeholder="Tag"
              defaultValue={tag}
              className="px-3 py-2 border rounded-md text-sm"
            />
            <input type="hidden" name="orientation" value={orientationFilter} />
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-white border rounded-md hover:bg-gray-50"
            >
              Filter
            </button>
          </form>

          <div className="flex justify-center mb-6 gap-4">
            <Link
              href={`/movies?${new URLSearchParams({
                ...(category && { category }),
                ...(tag && { tag }),
                orientation: 'landscape',
              }).toString()}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                orientationFilter === 'landscape'
                  ? 'bg-orange-400 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Landscape
            </Link>
            <Link
              href={`/movies?${new URLSearchParams({
                ...(category && { category }),
                ...(tag && { tag }),
                orientation: 'portrait',
              }).toString()}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                orientationFilter === 'portrait'
                  ? 'bg-orange-400 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Portrait
            </Link>
          </div>

          {visible.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 opacity-30">
                <FilmSlateIcon weight="light" size={96} className="text-gray-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-3">No Movies Yet</h2>
              <p className="text-gray-500 mb-6 max-w-md mx-auto">No movies have been released yet.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {visible.map((movie) => (
                  <Link key={movie.id} href={`/movies/${movie.id}`} className="block">
                    <MovieCard movie={movie} />
                  </Link>
                ))}
              </div>
              <div className="flex justify-between mt-8">
                {page > 1 ? (
                  <Link
                    href={`/movies?${prevQuery.toString()}`}
                    className="px-4 py-2 text-sm bg-white border rounded-md hover:bg-gray-50"
                  >
                    Previous
                  </Link>
                ) : (
                  <span />
                )}
                {hasMore && (
                  <Link
                    href={`/movies?${nextQuery.toString()}`}
                    className="px-4 py-2 text-sm bg-white border rounded-md hover:bg-gray-50"
                  >
                    Next
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  } catch (error: any) {
    console.error('Error loading movies:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl max-w-2xl mx-auto">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚠️</div>
              <div>
                <h3 className="font-semibold text-red-800 mb-2">Unable to Load Movies</h3>
                <p className="text-red-700">
                  {error instanceof Error ? error.message : 'Unknown error'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
