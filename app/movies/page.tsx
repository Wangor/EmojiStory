import Link from 'next/link';
import { FilmSlateIcon } from '@phosphor-icons/react';
import { getAllMovies } from '../../lib/supabaseServer';
import { MovieCard } from '../../components/MovieCard';

const PAGE_SIZE = 24;

interface MoviesPageProps {
  searchParams?: {
    page?: string;
  };
}

export default async function MoviesPage({ searchParams }: MoviesPageProps) {
  const page = Math.max(1, Number(searchParams?.page) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE;

  try {
    // TODO: Add category/tag filters when these fields are available
    const movies = await getAllMovies({ from, to });
    const hasMore = movies.length > PAGE_SIZE;
    const visible = movies.slice(0, PAGE_SIZE);

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
                    href={`/movies?page=${page - 1}`}
                    className="px-4 py-2 text-sm bg-white border rounded-md hover:bg-gray-50"
                  >
                    Previous
                  </Link>
                ) : (
                  <span />
                )}
                {hasMore && (
                  <Link
                    href={`/movies?page=${page + 1}`}
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
