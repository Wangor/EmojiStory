'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import MovieEditor from '../../components/MovieEditor';
import { getMovieById } from '../../lib/supabaseClient';

export default function EditorPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [movie, setMovie] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      setLoading(true);
      getMovieById(id)
        .then(setMovie)
        .catch((e: any) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">
        {id ? 'Edit Movie' : 'Movie Editor'}
      </h1>
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
      {loading ? <p>Loading...</p> : <MovieEditor movie={movie ?? undefined} />}
    </div>
  );
}

