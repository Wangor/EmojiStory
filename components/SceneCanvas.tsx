'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Scene, Actor, Keyframe, TextActor } from './AnimationTypes';

type SceneCanvasProps = {
  scene: Scene;
  fps: number;
  onSceneChange: (s: Scene) => void;
};

export default function SceneCanvas({ scene, fps, onSceneChange }: SceneCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  // track the current frame rather than raw milliseconds to avoid floating
  // point precision issues when scrubbing the timeline. the frame is later
  // converted back into milliseconds when sampling or writing keyframes.
  const [currentFrame, setCurrentFrame] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const scaleRef = useRef<{
    id: string;
    startScale: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    }
  }, []);

  const frameMs = 1000 / fps;

  function lerp(a: number, b: number, t: number) {
    return a + (b - a) * t;
  }

  function sample(actor: Actor, t: number) {
    const tracks = [...actor.tracks].sort((a, b) => a.t - b.t);
    if (tracks.length === 0) {
      const s = actor.start || { x: 0, y: 0, scale: 1 };
      return { x: s.x, y: s.y, scale: s.scale };
    }
    if (t <= tracks[0].t) {
      const s = actor.start || tracks[0];
      return { x: tracks[0].x, y: tracks[0].y, scale: tracks[0].scale ?? s.scale ?? 1 };
    }
    for (let i = 1; i < tracks.length; i++) {
      const prev = tracks[i - 1];
      const next = tracks[i];
      if (t <= next.t) {
        const tt = (t - prev.t) / (next.t - prev.t);
        return {
          x: lerp(prev.x, next.x, tt),
          y: lerp(prev.y, next.y, tt),
          scale: lerp(prev.scale ?? actor.start?.scale ?? 1, next.scale ?? actor.start?.scale ?? 1, tt)
        };
      }
    }
    const last = tracks[tracks.length - 1];
    return { x: last.x, y: last.y, scale: last.scale ?? actor.start?.scale ?? 1 };
  }

  function upsert(actor: Actor, kf: Keyframe): Actor {
    const tracks = [...actor.tracks];
    const idx = tracks.findIndex((k) => k.t === kf.t);
    if (idx >= 0) {
      tracks[idx] = { ...tracks[idx], ...kf };
    } else {
      tracks.push(kf);
    }
    tracks.sort((a, b) => a.t - b.t);
    return { ...actor, tracks };
  }

  function updateActor(id: string, kf: Keyframe) {
    const actors = scene.actors.map((a) => (a.id === id ? upsert(a, kf) : a));
    onSceneChange({ ...scene, actors });
  }

  const handleDragEnd = (actorId: string, info: any) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (info.point.x - rect.left) / rect.width;
    const y = (info.point.y - rect.top) / rect.height;
    const t = currentFrame * frameMs;
    const pose = sample(scene.actors.find((a) => a.id === actorId)!, t);
    updateActor(actorId, { t, x, y, scale: pose.scale });
  };

  const handleScaleStart = (e: React.PointerEvent, actorId: string) => {
    e.stopPropagation();
    const t = currentFrame * frameMs;
    const pose = sample(scene.actors.find((a) => a.id === actorId)!, t);
    scaleRef.current = {
      id: actorId,
      startScale: pose.scale,
      startX: e.clientX,
      startY: e.clientY,
      x: pose.x,
      y: pose.y
    };
    window.addEventListener('pointermove', handleScaleMove);
    window.addEventListener('pointerup', handleScaleEnd);
  };

  const handleScaleMove = (e: PointerEvent) => {
    const s = scaleRef.current;
    if (!s) return;
    const diff = e.clientY - s.startY;
    const t = currentFrame * frameMs;
    const newScale = Math.max(0.1, s.startScale + diff / 100);
    updateActor(s.id, { t, x: s.x, y: s.y, scale: newScale });
  };

  const handleScaleEnd = () => {
    scaleRef.current = null;
    window.removeEventListener('pointermove', handleScaleMove);
    window.removeEventListener('pointerup', handleScaleEnd);
  };

  const selectedActor = scene.actors.find((a) => a.id === selected);
  const pathPoints = selectedActor
    ? selectedActor.tracks.map((k) => `${k.x * size.w},${k.y * size.h}`).join(' ')
    : '';

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="relative w-full h-64 border overflow-hidden">
        <svg className="absolute inset-0 pointer-events-none">
          {selectedActor && <polyline points={pathPoints} fill="none" stroke="blue" />}
        </svg>
        {scene.actors.map((a) => {
          const pose = sample(a, currentFrame * frameMs);
          const style: React.CSSProperties = {
            left: pose.x * 100 + '%',
            top: pose.y * 100 + '%',
            transform: `translate(-50%, -50%) scale(${pose.scale})`
          };
          return (
            <motion.div
              key={a.id}
              drag
              dragMomentum={false}
              dragConstraints={containerRef}
              onDragStart={() => setSelected(a.id)}
              onDragEnd={(e, info) => handleDragEnd(a.id, info)}
              className={`absolute cursor-move select-none ${selected === a.id ? 'ring-2 ring-blue-500' : ''}`}
              style={style}
            >
              {a.type === 'emoji' && <span>{(a as any).emoji}</span>}
              {a.type === 'text' && (
                <span style={{ color: (a as TextActor).color, fontSize: (a as TextActor).fontSize }}>
                  {(a as TextActor).text}
                </span>
              )}
              {selected === a.id && (
                <div
                  onPointerDown={(e) => handleScaleStart(e, a.id)}
                  className="absolute w-3 h-3 bg-white border border-blue-500 bottom-0 right-0 cursor-se-resize"
                />
              )}
            </motion.div>
          );
        })}
      </div>
      <input
        type="range"
        min={0}
        max={Math.round(scene.duration_ms / frameMs)}
        step={1}
        value={currentFrame}
        onChange={(e) => setCurrentFrame(Number(e.target.value))}
        className="w-full"
      />
      <div className="text-xs text-center">
        Frame {currentFrame} / {Math.round(scene.duration_ms / frameMs)}
      </div>
    </div>
  );
}

