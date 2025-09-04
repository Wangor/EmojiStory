'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import MovieEditor from '../../components/MovieEditor';
import { getMovieById, getUser } from '../../lib/supabaseClient';

function EditorContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const copy = searchParams.get('copy');
  const router = useRouter();
  const [movie, setMovie] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    getUser().then(u => {
      if (!u) {
        router.replace('/auth/login');
      } else {
        setAuthChecked(true);
      }
    });
  }, [router]);

  useEffect(() => {
    const targetId = id || copy;
    if (targetId) {
      setLoading(true);
      getMovieById(targetId, { allowReleased: !!copy })
        .then(m => {
          if (copy) {
            const { id: _omit, ...rest } = m;
            setMovie(rest);
          } else {
            setMovie(m);
          }
        })
        .catch((e: any) => setError(e.message))
        .finally(() => setLoading(false));
    }
  }, [id, copy]);

  if (!authChecked) {
    return <div className="p-6 max-w-6xl mx-auto">Checking authentication...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">
        {id ? 'Edit Movie' : copy ? 'Copy Movie' : 'Movie Editor'}
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

export default function EditorPage() {
  return (
    <Suspense fallback={<div className="p-6 max-w-6xl mx-auto">Loading editor...</div>}>
      <EditorContent />
    </Suspense>
  );
}
