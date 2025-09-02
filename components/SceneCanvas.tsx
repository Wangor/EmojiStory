'use client';

import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { ArrowsOutCardinalIcon, ResizeIcon, UserIcon, MountainsIcon, ArrowsClockwiseIcon } from '@phosphor-icons/react';
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
    const [tool, setTool] = useState<'move' | 'scale' | 'rotate'>('move');
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

    const rotateRef = useRef<{
        id: string;
        startRotation: number;
        startAngle: number;
        centerX: number;
        centerY: number;
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
            return { x: s.x, y: s.y, scale: s.scale, rotate: 0 };
        }
        if (t <= tracks[0].t) {
            const s = actor.start || tracks[0];
            return {
                x: tracks[0].x,
                y: tracks[0].y,
                scale: tracks[0].scale ?? s.scale ?? 1,
                rotate: tracks[0].rotate ?? 0
            };
        }
        for (let i = 1; i < tracks.length; i++) {
            const prev = tracks[i - 1];
            const next = tracks[i];
            if (t <= next.t) {
                const tt = (t - prev.t) / (next.t - prev.t);
                return {
                    x: lerp(prev.x, next.x, tt),
                    y: lerp(prev.y, next.y, tt),
                    scale: lerp(prev.scale ?? actor.start?.scale ?? 1, next.scale ?? actor.start?.scale ?? 1, tt),
                    rotate: lerp(prev.rotate ?? 0, next.rotate ?? 0, tt)
                };
            }
        }
        const last = tracks[tracks.length - 1];
        return {
            x: last.x,
            y: last.y,
            scale: last.scale ?? actor.start?.scale ?? 1,
            rotate: last.rotate ?? 0
        };
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
        updateActor(id, { t, x, y, scale: pose.scale, rotate: pose.rotate });
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
        const pose = sample(findActor(s.id), t);
        updateActor(s.id, { t, x: s.x, y: s.y, scale: newScale, rotate: pose.rotate });
    };

    const handleScaleEnd = () => {
        scaleRef.current = null;
        window.removeEventListener('pointermove', handleScaleMove);
        window.removeEventListener('pointerup', handleScaleEnd);
    };

    const handleRotateStart = (e: React.PointerEvent, actorId: string) => {
        if (!containerRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        setSelected(actorId);
        const t = Math.round(currentFrame * frameMs);
        const pose = sample(findActor(actorId), t);
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + pose.x * rect.width;
        const centerY = rect.top + pose.y * rect.height;

        // Calculate initial angle from center to mouse
        const dx = e.clientX - centerX;
        const dy = e.clientY - centerY;
        const startAngle = Math.atan2(dy, dx) * (180 / Math.PI);

        rotateRef.current = {
            id: actorId,
            startRotation: pose.rotate,
            startAngle,
            centerX,
            centerY,
            x: pose.x,
            y: pose.y
        };
        window.addEventListener('pointermove', handleRotateMove);
        window.addEventListener('pointerup', handleRotateEnd);
    };

    const handleRotateMove = (e: PointerEvent) => {
        const r = rotateRef.current;
        if (!r) return;

        const dx = e.clientX - r.centerX;
        const dy = e.clientY - r.centerY;
        const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
        const angleDiff = currentAngle - r.startAngle;
        const newRotation = r.startRotation + angleDiff;

        const t = Math.round(currentFrame * frameMs);
        const pose = sample(findActor(r.id), t);
        updateActor(r.id, { t, x: r.x, y: r.y, scale: pose.scale, rotate: newRotation });
    };

    const handleRotateEnd = () => {
        rotateRef.current = null;
        window.removeEventListener('pointermove', handleRotateMove);
        window.removeEventListener('pointerup', handleRotateEnd);
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
            transform: `translate(-50%, -50%) scale(${pose.scale}) rotate(${pose.rotate}deg)`,
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
                        : interactive && tool === 'rotate'
                            ? (e) => handleRotateStart(e, a.id)
                            : () => interactive && setSelected(a.id)
                }
                className={`absolute select-none ${
                    interactive && tool === 'move' ? 'cursor-move' :
                        interactive && tool === 'rotate' ? 'cursor-alias' : 'cursor-pointer'
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
                {interactive && isSelected && tool === 'rotate' && (
                    <div className="absolute -top-8 left-1/2 -ml-1.5 w-3 h-3 bg-white border-2 border-green-500 rounded-full shadow-sm cursor-alias">
                        <div className="absolute top-3 left-1/2 w-0.5 h-5 bg-green-500 -ml-px"></div>
                    </div>
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
                            <UserIcon size={14} />
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
                                ? 'bg-white text-blue-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                        onClick={() => setTool('scale')}
                    >
                        <ResizeIcon size={14} />
                        Scale
                    </button>
                    <button
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            tool === 'rotate'
                                ? 'bg-white text-green-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                        }`}
                        onClick={() => setTool('rotate')}
                    >
                        <ArrowsClockwiseIcon size={14} />
                        Rotate
                    </button>
                </div>
            </div>

            {/* Frame Control */}
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Frame:</label>
                    <input
                        type="range"
                        className="flex-1"
                        min="0"
                        max={Math.max(1, scene.duration_ms / frameMs)}
                        step="1"
                        value={currentFrame}
                        onChange={(e) => setCurrentFrame(Number(e.target.value))}
                    />
                    <span className="text-sm text-gray-500 min-w-[60px]">
            {currentFrame} / {Math.round(scene.duration_ms / frameMs)}
          </span>
                </div>
                <div className="text-xs text-gray-400">
                    {Math.round(currentFrame * frameMs)}ms
                </div>
            </div>

            {/* Canvas */}
            <div
                ref={containerRef}
                className="relative bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                style={{
                    aspectRatio: `${width}/${height}`,
                    width: '100%',
                    maxHeight: '400px'
                }}
            >
                {/* Background Actors */}
                {scene.backgroundActors.map((a) => renderActor(a as Actor, true))}

                {/* Foreground Actors */}
                {scene.actors.map((a) => renderActor(a, false))}

                {/* Animation Paths */}
                {allActors.length > 0 && (
                    <svg
                        className="absolute inset-0 pointer-events-none"
                        style={{ width: '100%', height: '100%' }}
                    >
                        {allActors.map((a, i) => {
                            const path = buildPath(a);
                            if (!path || path.split(' ').length < 2) return null;
                            return (
                                <polyline
                                    key={a.id}
                                    points={path}
                                    stroke={colors[i % colors.length]}
                                    strokeWidth="2"
                                    fill="none"
                                    strokeDasharray="4 4"
                                    opacity="0.6"
                                />
                            );
                        })}
                    </svg>
                )}
            </div>

            {/* Actor Info */}
            {selected && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <UserIcon size={12} className="text-blue-600" />
                            </div>
                            <span className="font-medium text-blue-900">
                Selected: {findActor(selected).type}
              </span>
                        </div>
                        <div className="text-sm text-blue-700">
                            Frame {currentFrame} ({Math.round(currentFrame * frameMs)}ms)
                        </div>
                    </div>
                    {(() => {
                        const actor = findActor(selected);
                        const t = Math.round(currentFrame * frameMs);
                        const pose = sample(actor, t);
                        return (
                            <div className="mt-2 grid grid-cols-4 gap-3 text-xs">
                                <div>
                                    <span className="text-blue-600 font-medium">X:</span>
                                    <span className="text-blue-800 ml-1">{pose.x.toFixed(2)}</span>
                                </div>
                                <div>
                                    <span className="text-blue-600 font-medium">Y:</span>
                                    <span className="text-blue-800 ml-1">{pose.y.toFixed(2)}</span>
                                </div>
                                <div>
                                    <span className="text-blue-600 font-medium">Scale:</span>
                                    <span className="text-blue-800 ml-1">{pose.scale.toFixed(2)}</span>
                                </div>
                                <div>
                                    <span className="text-blue-600 font-medium">Rotate:</span>
                                    <span className="text-blue-800 ml-1">{pose.rotate.toFixed(1)}°</span>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
