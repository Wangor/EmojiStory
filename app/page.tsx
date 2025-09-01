'use client';

/* eslint-disable import/no-unresolved */
import { FilmSlate, MagicWand, Play, Stop } from '@phosphor-icons/react';
import { useState, useRef, useEffect } from 'react';
import type { Animation } from '../components/AnimationTypes';
import { EmojiPlayer } from '../components/EmojiPlayer';
import { MovieCard } from '../components/MovieCard';
import { SAMPLE_ANIMATION } from '../lib/sampleAnimation';
import { insertMovie, getUser, getAllMovies } from '../lib/supabaseClient';

export default function Page() {
  const [storyText, setStoryText] = useState<string>(
    'A cat finds a red balloon and chases it across the city.'
  );
  const [animation, setAnimation] = useState<Animation | null>(SAMPLE_ANIMATION);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [movies, setMovies] = useState<any[]>([]);
  const playerRef = useRef<{ play: () => void; stop: () => void } | null>(null);

  const canPlay = !!animation && animation.scenes.length > 0;
  const wordCount = storyText.trim().split(/\s+/).filter(word => word.length > 0).length;

  useEffect(() => {
    getUser().then(setUser);
    getAllMovies().then(setMovies).catch((e) => setError(e.message));
  }, []);

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
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 flex items-center justify-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <FilmSlate weight="bold" size={36} className="text-white" />
            </div>
            Emoji Movie Studio
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Transform your stories into animated emoji movies using AI
          </p>
        </div>

        {/* Story Input */}
        <div className="mb-8">
          <label htmlFor="story-input" className="block text-sm font-semibold text-gray-700 mb-3 text-center">
            Tell Your Story
          </label>
          <textarea
            id="story-input"
            value={storyText}
            onChange={(e) => setStoryText(e.target.value)}
            rows={4}
            placeholder="Describe your story... Be creative!"
            className="w-full p-4 text-lg border border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm resize-none text-center"
          />
          <div className="text-center mt-2">
            <span className="text-sm text-gray-400">
              {wordCount} {wordCount === 1 ? 'word' : 'words'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <button
            onClick={() => setAnimation(SAMPLE_ANIMATION)}
            className="group flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl shadow-sm hover:shadow-md hover:border-gray-300 transition-all duration-200 font-medium"
          >
            <FilmSlate weight="bold" size={20} className="group-hover:scale-110 transition-transform" />
            Use Sample
          </button>

          <button
            onClick={generateWithAI}
            disabled={loading || !storyText.trim()}
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-600 disabled:hover:to-blue-700"
          >
            <MagicWand
              weight="bold"
              size={20}
              className={`transition-transform ${loading ? 'animate-spin' : 'group-hover:scale-110'}`}
            />
            {loading ? 'Generating…' : 'Generate with AI'}
          </button>

          <button
            onClick={() => playerRef.current?.play()}
            disabled={!canPlay}
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play weight="bold" size={20} className="group-hover:scale-110 transition-transform" />
            Play
          </button>

          <button
            onClick={() => playerRef.current?.stop()}
            disabled={!canPlay}
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Stop weight="bold" size={20} className="group-hover:scale-110 transition-transform" />
            Stop
          </button>

          <button
            onClick={async () => {
              try {
                setError(null);
                if (!user) {
                  setError('Please login to save');
                  return;
                }
                const saved = await insertMovie({
                  title: animation?.title || storyText.substring(0, 30),
                  description: animation?.description || '',
                  story: storyText,
                  animation,
                });
                setMovies((m) => [saved, ...m]);
              } catch (e: any) {
                setError(e.message);
              }
            }}
            disabled={!canPlay}
            className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
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

        {/* Player */}
        <div className="flex justify-center">
          {animation ? (
            <div className="w-full max-w-4xl">
              <EmojiPlayer
                ref={playerRef}
                animation={animation}
                width={900}
                height={500}
              />
            </div>
          ) : (
            <div className="w-full max-w-4xl h-96 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 opacity-50">
                  <FilmSlate weight="light" size={64} />
                </div>
                <p className="text-lg font-medium mb-2">No animation loaded</p>
                <p className="text-sm">Use the sample or generate a new story with AI</p>
              </div>
            </div>
          )}
        </div>
        {movies.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4 text-center">Latest Movies</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {movies.map((m) => (
                <div
                  key={m.id}
                  onClick={(e) => {
                    // Only set animation if the click wasn't on the channel link
                    const target = e.target as HTMLElement;
                    if (!target.closest('a')) {
                      setAnimation(m.animation as Animation);
                    }
                  }}
                  className="cursor-pointer"
                >
                  <MovieCard movie={m} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
