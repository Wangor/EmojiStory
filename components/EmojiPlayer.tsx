'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import type { Actor, Animation, Scene } from './AnimationTypes';

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
    <div>
      <div
        style={{
          width,
          height,
          border: '1px solid #e5e7eb',
          borderRadius: 12,
          overflow: 'hidden',
          position: 'relative',
          background: '#0b1020'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 8,
            color: '#9ca3af',
            fontSize: 12,
            pointerEvents: 'none'
          }}
        >
          {animation.title}
        </div>
        {scene && (
          <SceneView key={scene.id + ':' + sceneIndex} scene={scene} width={width} height={height} />
        )}
        <div
          style={{
            position: 'absolute',
            right: 8,
            bottom: 8,
            padding: '4px 8px',
            fontSize: 12,
            color: '#9ca3af'
          }}
        >
          Scene {sceneIndex + 1}/{totalScenes}
        </div>
      </div>

      {/* Transport controls */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 8
        }}
      >
        <button onClick={handlePrev} disabled={!canPrev} aria-label="Previous scene">
          ⏮️ Prev
        </button>
        <button
          onClick={handlePlayPause}
          disabled={totalScenes === 0}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? '⏸️ Pause' : '▶️ Play'}
        </button>
        <button onClick={handleNext} disabled={!canNext} aria-label="Next scene">
          Next ⏭️
        </button>
      </div>
    </div>
  );
});

function SceneView({ scene, width, height }: { scene: Scene; width: number; height: number }) {
  return (
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
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 0,
            right: 0,
            textAlign: 'center',
            color: 'white',
            textShadow: '0 2px 4px rgba(0,0,0,.6)',
            fontSize: 20
          }}
        >
          {scene.caption}
        </div>
      )}
    </div>
  );
}

function ActorView({ actor, w, h, duration }: { actor: Actor; w: number; h: number; duration: number }) {
  const controls = useAnimationControls();
  const times = actor.tracks.map((k) => k.t / Math.max(1, duration));
  const x = actor.tracks.map((k) => k.x * w);
  const y = actor.tracks.map((k) => k.y * h);
  const rotate = actor.tracks.map((k) => k.rotate ?? 0);
  const scale = actor.tracks.map((k) => k.scale ?? actor.start?.scale ?? 1);

  React.useEffect(() => {
    controls.start({
      x,
      y,
      rotate,
      scale,
      transition: { times, duration: duration / 1000, ease: 'easeInOut' }
    });
  }, [controls, duration]); // arrays derived from props

  if (actor.type === 'emoji') {
    const size = Math.round(48 * (actor.start?.scale ?? 1));
    return (
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

    return (
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
  }
  return null;
}
