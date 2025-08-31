'use client';

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
    <main style={{ maxWidth: 960, margin: '24px auto', padding: '0 16px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>🎬 Emoji Movie MVP</h1>
      <textarea
        value={storyText}
        onChange={(e) => setStoryText(e.target.value)}
        rows={5}
        style={{ width: '100%', padding: 12, fontSize: 16 }}
      />
      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => setAnimation(SAMPLE_ANIMATION)}>Use Sample</button>
        <button onClick={generateWithAI} disabled={loading}>{loading ? 'Generating…' : 'Generate with AI'}</button>
        <button onClick={() => playerRef.current?.play()} disabled={!canPlay}>Play</button>
        <button onClick={() => playerRef.current?.stop()} disabled={!canPlay}>Stop</button>
      </div>
      {error && <p style={{ color: '#b91c1c', marginTop: 8 }}>Error: {error}</p>}
      <div style={{ marginTop: 20 }}>
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
