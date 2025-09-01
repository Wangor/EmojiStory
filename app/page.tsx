'use client';

/* eslint-disable import/no-unresolved */
import { FilmSlate, MagicWand, Play, Stop } from '@phosphor-icons/react';
import { useState, useRef } from 'react';
import type { Animation } from '../components/AnimationTypes';
import { EmojiPlayer } from '../components/EmojiPlayer';
import { SAMPLE_ANIMATION } from '../lib/sampleAnimation';

export default function Page() {
  const [storyText, setStoryText] = useState<string>(
    'A cat finds a red balloon and chases it across the city.'
  );
  const [animation, setAnimation] = useState<Animation | null>(SAMPLE_ANIMATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<{ play: () => void; stop: () => void } | null>(null);

  const canPlay = !!animation && animation.scenes.length > 0;

  async function generateWithAI() {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/storyboard', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ story: storyText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to generate');
      setAnimation(data.animation as Animation);
    } catch (e:any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <FilmSlate weight="bold" size={32} /> Emoji Movie MVP
      </h1>
      <textarea
        value={storyText}
        onChange={(e) => setStoryText(e.target.value)}
        rows={5}
        className="w-full p-3 text-lg border rounded-md"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => setAnimation(SAMPLE_ANIMATION)}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 flex items-center gap-2"
        >
          <FilmSlate weight="bold" /> Use Sample
        </button>
        <button
          onClick={generateWithAI}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
        >
          <MagicWand weight="bold" /> {loading ? 'Generating…' : 'Generate with AI'}
        </button>
        <button
          onClick={() => playerRef.current?.play()}
          disabled={!canPlay}
          className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
        >
          <Play weight="bold" /> Play
        </button>
        <button
          onClick={() => playerRef.current?.stop()}
          disabled={!canPlay}
          className="px-4 py-2 bg-red-600 text-white rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-red-700"
        >
          <Stop weight="bold" /> Stop
        </button>
      </div>
      {error && <p className="text-red-700 mt-2">Error: {error}</p>}
      <div className="mt-5">
        {animation && (
          <EmojiPlayer
            ref={playerRef}
            animation={animation}
            width={900}
            height={500}
          />
        )}
      </div>
    </main>
  );
}
