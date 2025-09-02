'use client';

import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { ArrowsOutCardinalIcon, Resize, User, MountainsIcon } from '@phosphor-icons/react';
import { Scene, Actor, Keyframe, TextActor } from './AnimationTypes';

type SceneCanvasProps = {
  scene: Scene;
  fps: number;
  width: number;
  height: number;
  onSceneChange: (s: Scene) => void;
};

export default function SceneCanvas({ scene, fps, width, height, onSceneChange }: SceneCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [currentFrame, setCurrentFrame] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [tool, setTool] = useState<'move' | 'scale'>('move');
  const [layer, setLayer] = useState<'actors' | 'background'>('actors');

  const dragRef = useRef<{
    id: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const scaleRef = useRef<{
    id: string;
    startScale: number;
    startX: number;
    startY: number;
    x: number;
    y: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const update = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const frameMs = 1000 / fps;

  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

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
    const target = layer === 'actors' ? 'actors' : 'backgroundActors';
    const actors = (scene[target] as Actor[]).map((a) => {
      if (a.id !== id) return a;
      let updated = upsert(a, kf);
      if (kf.t === 0) {
        const start = {
          ...(updated.start ?? { x: kf.x, y: kf.y, scale: kf.scale ?? 1 }),
          x: kf.x,
          y: kf.y,
          scale: kf.scale ?? updated.start?.scale ?? 1
        };
        updated = { ...updated, start };
      }
      return updated;
    });
    onSceneChange({ ...scene, [target]: actors } as Scene);
  }

  const findActor = (id: string) => {
    const list = layer === 'actors' ? scene.actors : scene.backgroundActors;
    return list.find((a) => a.id === id)!;
  };

  const handleMoveStart = (actorId: string, e: React.PointerEvent) => {
    if (!containerRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    setSelected(actorId);
    const rect = containerRef.current.getBoundingClientRect();
    const t = Math.round(currentFrame * frameMs);
    const pose = sample(findActor(actorId), t);
    const left = rect.left + pose.x * rect.width;
    const top = rect.top + pose.y * rect.height;
    const offsetX = e.clientX - left;
    const offsetY = e.clientY - top;
    dragRef.current = { id: actorId, offsetX, offsetY };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleMoveEnd);
  };

  const handleMove = (e: PointerEvent) => {
    if (!dragRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const { id, offsetX, offsetY } = dragRef.current;
    const x = clamp01((e.clientX - rect.left - offsetX) / rect.width);
    const y = clamp01((e.clientY - rect.top - offsetY) / rect.height);
    const t = Math.round(currentFrame * frameMs);
    const pose = sample(findActor(id), t);
    updateActor(id, { t, x, y, scale: pose.scale });
  };

  const handleMoveEnd = () => {
    dragRef.current = null;
    window.removeEventListener('pointermove', handleMove);
    window.removeEventListener('pointerup', handleMoveEnd);
  };

  const handleScaleStart = (e: React.PointerEvent, actorId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelected(actorId);
    const t = Math.round(currentFrame * frameMs);
    const pose = sample(findActor(actorId), t);
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
    const t = Math.round(currentFrame * frameMs);
    const newScale = Math.max(0.1, s.startScale + diff / 100);
    updateActor(s.id, { t, x: s.x, y: s.y, scale: newScale });
  };

  const handleScaleEnd = () => {
    scaleRef.current = null;
    window.removeEventListener('pointermove', handleScaleMove);
    window.removeEventListener('pointerup', handleScaleEnd);
  };

  const colors = ['#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4'];

  function buildPath(a: Actor) {
    const pts = [a.start && { t: 0, x: a.start.x, y: a.start.y }, ...a.tracks]
      .filter((k: any) => typeof k?.x === 'number' && typeof k?.y === 'number')
      .sort((a, b) => (a as any).t - (b as any).t)
      .map((k) => `${(k as any).x * size.w},${(k as any).y * size.h}`);
    return pts.join(' ');
  }

  useEffect(() => {
    setSelected(null);
  }, [layer]);

  const renderActor = (a: Actor, isBg: boolean) => {
    const t = Math.round(currentFrame * frameMs);
    const pose = sample(a, t);

    const baseFontSize = a.type === 'emoji'
      ? Math.round(48 * (a.start?.scale ?? 1))
      : a.type === 'text' && (a as any).fontSize
        ? (a as any).fontSize
        : Math.round(32 * (a.start?.scale ?? 1));

    const style: React.CSSProperties = {
      left: pose.x * 100 + '%',
      top: pose.y * 100 + '%',
      transform: `translate(-50%, -50%) scale(${pose.scale})`,
      transformOrigin: 'center center',
      opacity: layer === 'actors' && isBg ? 0.5 : 1,
      fontSize: baseFontSize
    };

    const interactive = (layer === 'background' && isBg) || (layer === 'actors' && !isBg);
    const isSelected = selected === a.id;

    return (
      <div
        key={a.id}
        onPointerDown={
          interactive && tool === 'move'
            ? (e) => handleMoveStart(a.id, e)
            : () => interactive && setSelected(a.id)
        }
        className={`absolute select-none ${
          interactive && tool === 'move' ? 'cursor-move' : 'cursor-pointer'
        } ${
          isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
        } ${interactive ? 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-1' : ''}`}
        style={style}
      >
        {a.type === 'emoji' && <span>{(a as any).emoji}</span>}
        {a.type === 'text' && (
          <span style={{ color: (a as TextActor).color }}>
            {(a as TextActor).text}
          </span>
        )}
        {interactive && isSelected && tool === 'scale' && (
          <div
            onPointerDown={(e) => handleScaleStart(e, a.id)}
            className="absolute w-3 h-3 bg-white border-2 border-blue-500 bottom-0 right-0 cursor-se-resize rounded-sm shadow-sm"
          />
        )}
      </div>
    );
  };

  const allActors: Actor[] = [...(scene.backgroundActors as Actor[]), ...scene.actors];

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                layer === 'actors' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setLayer('actors')}
            >
              <User size={14} />
              Actors
            </button>
            <button
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                layer === 'background' 
                  ? 'bg-white text-green-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setLayer('background')}
            >
              <MountainsIcon size={14} />
              Background
            </button>
          </div>
        </div>

        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              tool === 'move' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setTool('move')}
          >
            <ArrowsOutCardinalIcon size={14} />
            Move
          </button>
          <button
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              tool === 'scale' 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => setTool('scale')}
          >
            <Resize size={14} />
            Scale
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative w-full border-2 border-gray-300 rounded-lg overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg"
        style={{ aspectRatio: `${width}/${height}` }}
      >
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 ${size.w} ${size.h}`}
        >
          {allActors.map((a, i) => {
            const points = buildPath(a);
            if (!points) return null;
            const isBg = i < (scene.backgroundActors as Actor[]).length;
            return (
              <polyline
                key={a.id}
                points={points}
                fill="none"
                stroke={colors[i % colors.length]}
                strokeWidth={selected === a.id ? 3 : 2}
                strokeDasharray={isBg ? "5,5" : "none"}
                opacity={layer === 'actors' && isBg ? 0.3 : 0.8}
              />
            );
          })}
        </svg>
        {scene.backgroundActors.map((a) => renderActor(a as Actor, true))}
        {scene.actors.map((a) => renderActor(a, false))}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <input
          type="range"
          min={0}
          max={Math.round(scene.duration_ms / frameMs)}
          step={1}
          value={currentFrame}
          onChange={(e) => setCurrentFrame(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>Frame {currentFrame}</span>
          <span>{Math.round(currentFrame * frameMs)}ms / {scene.duration_ms}ms</span>
          <span>Total: {Math.round(scene.duration_ms / frameMs)} frames</span>
        </div>
      </div>
    </div>
  );
}
