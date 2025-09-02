'use client';

import MovieEditor from '../../components/MovieEditor';

export default function EditorPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Movie Editor</h1>
      <MovieEditor />
    </div>
  );
}

