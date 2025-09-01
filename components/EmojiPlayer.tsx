'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
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

export const EmojiPlayer = forwardRef(function EmojiPlayer(
  {
    animation,
    width,
    height,
    onPlayChange,
    loop = true // auto-loop by default
  }: {
    animation: Animation;
    width: number;
    height: number;
    onPlayChange?: (p: boolean) => void;
    loop?: boolean;
  },
  ref: React.Ref<{ play: () => void; stop: () => void }>
) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(false);

  // rAF-driven playback clock
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<number | null>(null);

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
    startedAtRef.current = null;
    const tick = (now: number) => {
      if (startedAtRef.current == null) startedAtRef.current = now;
      const elapsed = now - startedAtRef.current;
      if (elapsed >= duration) {
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
      // Pause: do not reset scene index; just stop the clock
      return;
    }
    if (!scene) return;
    startRaf();
    return clearRaf;
  }, [playing, sceneIndex, duration, totalScenes, loop]);

  // Controls
  const canPrev = sceneIndex > 0;
  const canNext = sceneIndex < totalScenes - 1;

  const handlePrev = () => {
    setSceneIndex((i) => Math.max(0, i - 1));
  };

  const handleNext = () => {
    setSceneIndex((i) => Math.min(totalScenes - 1, i + 1));
  };

  const handlePlayPause = () => setPlaying((p) => !p);

  return (
    <div className="w-full">
      {/* Main video container */}
      <div
        className="relative rounded-xl border border-gray-200 shadow-lg overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800"
        style={{ width, height }}
      >
        {/* Title overlay */}
        <div className="absolute top-3 left-4 text-xs text-gray-300 font-medium pointer-events-none z-10">
          {animation.title}
        </div>

        {scene && (
          <SceneView key={scene.id + ':' + sceneIndex} scene={scene} width={width} height={height} />
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

function SceneView({ scene, width, height }: { scene: Scene; width: number; height: number }) {
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
          />
        ))}
      {scene.actors
        .slice()
        .sort((a, b) => (a.z ?? 0) - (b.z ?? 0))
        .map((a) => (
          <ActorView key={a.id} actor={a} w={width} h={height} duration={scene.duration_ms} />
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

function ActorView({ actor, w, h, duration }: { actor: Actor; w: number; h: number; duration: number }) {
  const controls = useAnimationControls();
  const times = actor.tracks.map((k) => k.t / Math.max(1, duration));
  const x = actor.tracks.map((k) => k.x * w);
  const y = actor.tracks.map((k) => k.y * h);
  const rotate = actor.tracks.map((k) => k.rotate ?? 0);
  const scale = actor.tracks.map((k) => k.scale ?? actor.start?.scale ?? 1);

  React.useEffect(() => {
    const transition: any = { times, duration: duration / 1000, ease: 'easeInOut' };
    if (actor.loop === 'float') {
      transition.repeat = Infinity;
      transition.repeatType = 'mirror';
    }
    controls.start({ x, y, rotate, scale, transition });
  }, [controls, duration, actor.loop]); // arrays derived from props

  if (actor.type === 'emoji') {
    const size = Math.round(48 * (actor.start?.scale ?? 1));
    const node = (
      <motion.span
        role="img"
        aria-label={actor.ariaLabel ?? actor.emoji}
        style={{ position: 'absolute', fontSize: size, transformOrigin: 'center center' }}
        initial={{ x: x[0], y: y[0], rotate: rotate[0], scale: scale[0] }}
        animate={controls}
      >
        <span style={{ display: 'inline-block', transform: actor.flipX ? 'scaleX(-1)' : undefined }}>
          {actor.emoji}
        </span>
      </motion.span>
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
      <motion.span
        role="img"
        aria-label={actor.ariaLabel ?? 'composite'}
        style={{
          position: 'absolute',
          width,
          height,
          transformOrigin: 'center center',
          display: 'inline-block'
        }}
        initial={{ x: x[0], y: y[0], rotate: rotate[0], scale: scale[0] }}
        animate={controls}
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
      </motion.span>
    );
    return wrapWithEffects(node, actor.effects, 'span');
  }
  return null;
}
