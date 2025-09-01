'use client';

import { useEffect, useState } from 'react';
import { getMoviesByUser } from '../../lib/supabaseClient';
import type { Animation } from '../../components/AnimationTypes';
import { EmojiPlayer } from '../../components/EmojiPlayer';

export default function MoviesPage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMoviesByUser()
      .then(setMovies)
      .catch(e => setError(e.message));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">My Movies</h1>
      {error && <p className="text-red-600 text-center">{error}</p>}
      <ul className="mb-8 space-y-2">
        {movies.map(m => (
          <li key={m.id} className="flex justify-between items-center border p-2 rounded">
            <div>
              <div className="font-medium">{m.title || m.story.slice(0,30)}</div>
              {m.description && <div className="text-xs text-gray-500">{m.description}</div>}
            </div>
            <button onClick={() => setSelected(m)} className="text-blue-600 underline">Play</button>
          </li>
        ))}
      </ul>
      {selected && (
        <div className="flex justify-center">
          <EmojiPlayer animation={selected.animation as Animation} width={600} height={300} />
        </div>
      )}
    </div>
  );
}

