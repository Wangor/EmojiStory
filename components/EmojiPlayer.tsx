'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { Actor, Animation, Scene, Effect } from './AnimationTypes';

const EFFECT_VARIANTS: Record<Effect, { hidden: any; show: any }> = {
  'fade-in': {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 0.6 } }
  },
  bounce: {
    hidden: { scale: 0.8, opacity: 0 },
    show: { scale: 1, opacity: 1, transition: { type: 'spring', bounce: 0.4 } }
  }
};

function wrapWithEffects(
  element: React.ReactElement,
  effects: Effect[] | undefined,
  tag: 'div' | 'span'
): React.ReactElement {
  const effs = effects ?? [];
  return effs.reduce((child, eff) => {
    const variant = EFFECT_VARIANTS[eff];
    if (!variant) return child;
    const MotionTag = tag === 'div' ? motion.div : motion.span;
    return (
      <MotionTag variants={variant} initial="hidden" animate="show">
        {child}
      </MotionTag>
    );
  }, element);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function sampleAt(times: number[], values: number[], p: number) {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];
  for (let i = 1; i < times.length; i++) {
    if (p <= times[i]) {
      const t0 = times[i - 1];
      const t1 = times[i];
      const v0 = values[i - 1];
      const v1 = values[i];
      const tt = (p - t0) / (t1 - t0);
      return lerp(v0, v1, tt);
    }
  }
  return values[values.length - 1];
}

// Simple demo animation used when no animation is supplied
export const SAMPLE_ANIMATION: Animation = {
  title: 'Sample Movie',
  description: 'Demo animation',
  fps: 30,
  scenes: [
    {
      id: 'sample-scene',
      duration_ms: 3000,
      backgroundActors: [],
      actors: [
        {
          id: 'sample-actor',
          type: 'emoji',
          emoji: '🎬',
          start: { x: 0.1, y: 0.1, scale: 1 },
          tracks: [
            { t: 0, x: 0.1, y: 0.1 },
            { t: 1500, x: 0.8, y: 0.3 },
            { t: 3000, x: 0.2, y: 0.8 }
          ]
        }
      ]
    }
  ]
};

export const EmojiPlayer = forwardRef(function EmojiPlayer(
  {
    animation = SAMPLE_ANIMATION,
    width,
    height,
    onPlayChange,
    loop = true // auto-loop by default
  }: {
    animation?: Animation;
    width: number;
    height: number;
    onPlayChange?: (p: boolean) => void;
    loop?: boolean;
  },
  ref: React.Ref<{ play: () => void; stop: () => void }>
) {
  const [sceneIndex, setSceneIndex] = useState(0);
  // Start in playing state so the animation begins automatically
  const [playing, setPlaying] = useState(true);
  // Progress of the current scene (0-1)
  const [progress, setProgress] = useState(0);

  // rAF-driven playback clock
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);
  // Track how much of the current scene has elapsed so we can pause/resume
  const elapsedRef = useRef(0);

  const totalScenes = animation.scenes.length;
  const scene = animation.scenes[sceneIndex];
  const duration = Math.max(1, scene?.duration_ms ?? 1);

  function clearRaf() {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  function startRaf() {
    clearRaf();
    const tick = (now: number) => {
      if (startedAtRef.current == null) {
        startedAtRef.current = now - elapsedRef.current;
      }
      const elapsed = now - startedAtRef.current;
      elapsedRef.current = elapsed;
      setProgress(elapsed / duration);
      if (elapsed >= duration) {
        elapsedRef.current = 0;
        setProgress(0);
        setSceneIndex((i) => {
          const next = i + 1;
          if (next >= totalScenes) {
            if (loop && totalScenes > 0) {
              // Loop back to start
              return 0;
            } else {
              // Stop at the end if not looping
              setPlaying(false);
              return i;
            }
          }
          return next;
        });
        startedAtRef.current = null; // next scene will re-arm via effect
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  useImperativeHandle(
    ref,
    () => ({
      play() {
        setPlaying(true);
      },
      stop() {
        // Explicit stop resets to the start
        setPlaying(false);
        clearRaf();
        elapsedRef.current = 0;
        startedAtRef.current = null;
        setProgress(0);
        setSceneIndex(0);
      }
    }),
    []
  );

  useEffect(() => {
    onPlayChange?.(playing);
  }, [playing, onPlayChange]);

  // Keep sceneIndex valid if the animation changes
  useEffect(() => {
    setSceneIndex((i) => {
      if (totalScenes === 0) return 0;
      return Math.max(0, Math.min(i, totalScenes - 1));
    });
  }, [totalScenes]);

  // Drive playback clock
  useEffect(() => {
    clearRaf();
    if (!playing) {
      // Pause: clock stopped but keep current progress
      return;
    }
    if (!scene) return;
    startRaf();
    return clearRaf;
  }, [playing, sceneIndex, duration, totalScenes, loop]);

  // Reset bookkeeping when the scene index changes
  useEffect(() => {
    elapsedRef.current = 0;
    startedAtRef.current = null;
    setProgress(0);
  }, [sceneIndex]);

  // When the animation changes, reset to the start and autoplay
  useEffect(() => {
    elapsedRef.current = 0;
    startedAtRef.current = null;
    setSceneIndex(0);
    setProgress(0);
    setPlaying(true);
  }, [animation]);

  // Controls
  const canPrev = sceneIndex > 0;
  const canNext = sceneIndex < totalScenes - 1;

  const handlePrev = () => {
    setSceneIndex((i) => Math.max(0, i - 1));
  };

  const handleNext = () => {
    setSceneIndex((i) => Math.min(totalScenes - 1, i + 1));
  };

  const handlePlayPause = () => {
    setPlaying((p) => {
      if (p) {
        // going from playing -> paused: capture elapsed time and stop clock immediately
        clearRaf();
        if (startedAtRef.current != null) {
          const now = performance.now();
          elapsedRef.current = now - startedAtRef.current;
        }
        startedAtRef.current = null;
        return false;
      } else {
        // resume from paused
        startedAtRef.current = null;
        return true;
      }
    });
  };

  return (
    <div className="w-full">
      {/* Main video container */}
      <div
        className="relative rounded-xl border border-gray-200 shadow-lg overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 cursor-pointer"
        style={{ width, height }}
        onClick={handlePlayPause}
      >
        {/* Title overlay */}
        <div className="absolute top-3 left-4 text-xs text-gray-300 font-medium pointer-events-none z-10">
          {animation.title}
        </div>

        {scene && (
          <SceneView
            key={scene.id + ':' + sceneIndex}
            scene={scene}
            width={width}
            height={height}
            progress={progress}
          />
        )}

        {/* Pause overlay */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center z-20 cursor-pointer">
            <div className="bg-black/50 rounded-full p-6">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Scene counter */}
        <div className="absolute bottom-3 right-4 px-2 py-1 bg-black/30 backdrop-blur-sm rounded-md text-xs text-gray-200 font-mono">
          {sceneIndex + 1}/{totalScenes}
        </div>
      </div>

      {/* Transport controls */}
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={handlePrev}
          disabled={!canPrev}
          className="group flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-sm"
          aria-label="Previous scene"
        >
          <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          onClick={handlePlayPause}
          disabled={totalScenes === 0}
          className="group flex items-center justify-center w-14 h-14 rounded-full bg-gray-900 hover:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-900 disabled:hover:shadow-md"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 002 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <button
          onClick={handleNext}
          disabled={!canNext}
          className="group flex items-center justify-center w-12 h-12 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-sm"
          aria-label="Next scene"
        >
          <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414zm6 0a1 1 0 011.414 0l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414-1.414L14.586 10l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Progress indicator */}
      <div className="flex justify-center mt-4">
        <div className="flex gap-1">
          {Array.from({ length: totalScenes }, (_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                i === sceneIndex 
                  ? 'bg-gray-800 scale-125' 
                  : i < sceneIndex 
                    ? 'bg-gray-400' 
                    : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

function SceneView({
  scene,
  width,
  height,
  progress
}: {
  scene: Scene;
  width: number;
  height: number;
  progress: number;
}) {
  const content = (
    <div style={{ position: 'relative', width, height }}>
      {scene.backgroundActors
        .slice()
        .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
        .map((a) => (
          <ActorView
            key={'bg-' + a.id}
            actor={a}
            w={width}
            h={height}
            duration={scene.duration_ms}
            progress={progress}
          />
        ))}
      {scene.actors
        .slice()
        .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
        .map((a) => (
          <ActorView
            key={a.id}
            actor={a}
            w={width}
            h={height}
            duration={scene.duration_ms}
            progress={progress}
          />
        ))}
      {scene.caption && (
        <div className="absolute bottom-4 left-0 right-0 text-center text-white font-medium text-lg px-4">
          <div className="inline-block bg-black/40 backdrop-blur-sm px-3 py-1 rounded-lg">
            {scene.caption}
          </div>
        </div>
      )}
    </div>
  );
  return wrapWithEffects(content, scene.effects, 'div');
}

function ActorView({
  actor,
  w: _w,
  h: _h,
  duration,
  progress
}: {
  actor: Actor;
  w: number;
  h: number;
  duration: number;
  progress: number;
}) {
  const frames = [
    actor.start && {
      t: 0,
      x: actor.start.x,
      y: actor.start.y,
      rotate: 0,
      scale: actor.start.scale
    },
    ...actor.tracks
  ]
    .filter(Boolean)
    .sort((a, b) => a.t - b.t);

  const times = frames.map((k) => k.t / Math.max(1, duration));
  const xVals = frames.map((k) => k.x * 100);
  const yVals = frames.map((k) => k.y * 100);
  const rotateVals = frames.map((k) => k.rotate ?? 0);
  const scaleVals = frames.map((k) => k.scale ?? actor.start?.scale ?? 1);

  const x = sampleAt(times, xVals, progress);
  const y = sampleAt(times, yVals, progress);
  const rotate = sampleAt(times, rotateVals, progress);
  const scale = sampleAt(times, scaleVals, progress);

  if (actor.type === 'emoji') {
    const size = Math.round(48 * (actor.start?.scale ?? 1));
    const node = (
      <span
        role="img"
        aria-label={actor.ariaLabel ?? actor.emoji}
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          fontSize: size,
          transformOrigin: 'center center',
          transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`
        }}
      >
        <span style={{ display: 'inline-block', transform: actor.flipX ? 'scaleX(-1)' : undefined }}>
          {actor.emoji}
        </span>
      </span>
    );
    return wrapWithEffects(node, actor.effects, 'span');
  }
  if (actor.type === 'text') {
    const size = actor.fontSize ?? Math.round(32 * (actor.start?.scale ?? 1));
    const node = (
      <span
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          transformOrigin: 'center center',
          transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`,
          color: actor.color ?? 'white',
          fontSize: size,
          whiteSpace: 'pre'
        }}
      >
        {actor.text}
      </span>
    );
    return wrapWithEffects(node, actor.effects, 'span');
  }
  if (actor.type === 'composite') {
    if (actor.parts.length === 0) return null;

    // Calculate bounding box of all parts
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of actor.parts) {
      const s = p.start?.scale ?? 1;
      const x0 = p.start?.x ?? 0;
      const y0 = p.start?.y ?? 0;
      minX = Math.min(minX, x0);
      minY = Math.min(minY, y0);
      maxX = Math.max(maxX, x0 + s);
      maxY = Math.max(maxY, y0 + s);
    }

    const bbox = { minX, minY, maxX, maxY };

    // Dominant part determines base scale
    const dominantScale = Math.max(...actor.parts.map((p) => p.start?.scale ?? 1));
    const unitSize =
      actor.meta?.sizeOverride ?? Math.round((48 * (actor.start?.scale ?? 1)) / dominantScale);

    const width = (bbox.maxX - bbox.minX) * unitSize;
    const height = (bbox.maxY - bbox.minY) * unitSize;

    const node = (
      <span
        role="img"
        aria-label={actor.ariaLabel ?? 'composite'}
        style={{
          position: 'absolute',
          left: `${x}%`,
          top: `${y}%`,
          width,
          height,
          display: 'inline-block',
          transformOrigin: 'center center',
          transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`
        }}
      >
        <span
          style={{
            position: 'relative',
            width,
            height,
            display: 'inline-block',
            transform: actor.flipX ? 'scaleX(-1)' : undefined
          }}
        >
          {actor.parts.map((p) => {
            const partScale = p.start?.scale ?? 1;
            const partSize = unitSize * partScale;
            const offsetX = ((p.start?.x ?? 0) - bbox.minX) * unitSize;
            const offsetY = ((p.start?.y ?? 0) - bbox.minY) * unitSize;
            return (
              <span
                key={p.id}
                aria-label={p.ariaLabel ?? p.emoji}
                style={{
                  position: 'absolute',
                  left: offsetX,
                  top: offsetY,
                  fontSize: partSize,
                  transformOrigin: 'center center'
                }}
              >
                <span style={{ display: 'inline-block', transform: p.flipX ? 'scaleX(-1)' : undefined }}>
                  {p.emoji}
                </span>
              </span>
            );
          })}
        </span>
      </span>
    );
    return wrapWithEffects(node, actor.effects, 'span');
  }
  return null;
}
