'use client';

import React, { useState } from 'react';
import {
    SmileyWinkIcon,
    TextTIcon,
    HashIcon,
    ArrowsOutCardinalIcon,
    ResizeIcon,
    PaletteIcon,
    ClockIcon,
    TrashIcon,
    CaretDownIcon,
    CaretRightIcon,
    PlusIcon,
    ArrowsClockwiseIcon,
    UserIcon,
    UsersIcon,
    DotsSixVerticalIcon
} from '@phosphor-icons/react';
import { Actor, EmojiActor, TextActor, Keyframe, CompositeActor } from './AnimationTypes';
import { uuid } from '../lib/uuid';
import EmojiCatalogue from './EmojiCatalogue';

export type ActorEditorProps = {
    actor: Actor;
    onChange: (a: Actor) => void;
    onRemove: () => void;
    allowTypeChange?: boolean;
};

export default function ActorEditor({ actor, onChange, onRemove, allowTypeChange = true }: ActorEditorProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showEmojiCatalogue, setShowEmojiCatalogue] = useState(false);
    const [partCatalogueIndex, setPartCatalogueIndex] = useState<number | null>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

    const update = (fields: any) => onChange({ ...actor, ...fields });

    const updateStart = (field: keyof NonNullable<Actor['start']>, value: number) => {
        const start = { x: 0, y: 0, scale: 1, ...(actor as any).start };
        (start as any)[field] = value;
        update({ start });
    };

    const updateTrack = (idx: number, field: keyof Keyframe, value: number) => {
        const tracks = [...actor.tracks];
        const kf = { ...tracks[idx] } as any;
        kf[field] = value;
        tracks[idx] = kf;
        update({ tracks });
    };

    const addKeyframe = () => {
        const tracks = [...actor.tracks, { t: 500, x: 0.5, y: 0.5, rotate: 0 }];
        update({ tracks });
    };

    const removeKeyframe = (idx: number) => {
        const tracks = [...actor.tracks];
        tracks.splice(idx, 1);
        update({ tracks });
    };

    const handleTypeChange = (t: string) => {
        if (t === actor.type) return;
        if (t === 'emoji') {
            const a: EmojiActor = {
                id: actor.id,
                type: 'emoji',
                emoji: '😀',
                start: { x: 0.5, y: 0.5, scale: 1 },
                tracks: [{ t: 0, x: 0.5, y: 0.5, rotate: 0 }]
            };
            onChange(a);
        } else if (t === 'text') {
            const a: TextActor = {
                id: actor.id,
                type: 'text',
                text: 'Hello World',
                start: { x: 0.5, y: 0.5, scale: 1 },
                tracks: [{ t: 0, x: 0.5, y: 0.5, rotate: 0 }]
            };
            onChange(a);
        } else if (t === 'composite') {
            const a: CompositeActor = {
                id: actor.id,
                type: 'composite',
                parts: [
                    {
                        id: uuid(),
                        type: 'emoji',
                        emoji: '😀',
                        start: { x: 0, y: 0, scale: 1 },
                        tracks: []
                    }
                ],
                start: { x: 0.5, y: 0.5, scale: 1 },
                tracks: [{ t: 0, x: 0.5, y: 0.5, rotate: 0 }]
            };
            onChange(a);
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        if (partCatalogueIndex !== null) {
            updatePart(partCatalogueIndex, { emoji });
        } else {
            update({ emoji });
        }
        setShowEmojiCatalogue(false);
        setPartCatalogueIndex(null);
    };

    const updatePart = (idx: number, fields: Partial<EmojiActor>) => {
        const parts = [...(actor as CompositeActor).parts];
        parts[idx] = { ...parts[idx], ...fields } as EmojiActor;
        update({ parts });
    };

    const updatePartStart = (
        idx: number,
        field: keyof NonNullable<EmojiActor['start']>,
        value: number
    ) => {
        const parts = [...(actor as CompositeActor).parts];
        const part = { ...parts[idx] } as EmojiActor;
        const start = { x: 0, y: 0, scale: 1, ...(part.start || {}) } as any;
        start[field] = value;
        part.start = start;
        parts[idx] = part;
        update({ parts });
    };

    const addPart = () => {
        const parts = [
            ...(actor as CompositeActor).parts,
            {
                id: uuid(),
                type: 'emoji',
                emoji: '😀',
                start: { x: 0, y: 0, scale: 1 },
                tracks: []
            } as EmojiActor
        ];
        update({ parts });
    };

    const removePart = (idx: number) => {
        const parts = [...(actor as CompositeActor).parts];
        parts.splice(idx, 1);
        update({ parts });
    };

    const reorderParts = (fromIndex: number, toIndex: number) => {
        if (fromIndex === toIndex) return;
        const parts = [...(actor as CompositeActor).parts];
        const [movedPart] = parts.splice(fromIndex, 1);
        parts.splice(toIndex, 0, movedPart);
        update({ parts });
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', ''); // For Firefox compatibility
        // Set the drag image to be transparent to avoid visual conflicts
        const dragImage = new Image();
        dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
        e.dataTransfer.setDragImage(dragImage, 0, 0);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        // Only clear if we're actually leaving the container, not just moving to a child
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX;
        const y = e.clientY;
        if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
            setDragOverIndex(null);
        }
    };

    const handleDrop = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== index) {
            reorderParts(draggedIndex, index);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const openEmojiCatalogueForPart = (idx: number) => {
        setPartCatalogueIndex(idx);
        setShowEmojiCatalogue(true);
    };

    const openEmojiCatalogueForActor = () => {
        setPartCatalogueIndex(null);
        setShowEmojiCatalogue(true);
    };

    const renderPartsPreview = () => {
        if (actor.type !== 'composite') return null;
        const comp = actor as CompositeActor;
        if (comp.parts.length === 0) return null;

        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
        for (const p of comp.parts) {
            const s = p.start?.scale ?? 1;
            const x0 = p.start?.x ?? 0;
            const y0 = p.start?.y ?? 0;
            minX = Math.min(minX, x0);
            minY = Math.min(minY, y0);
            maxX = Math.max(maxX, x0 + s);
            maxY = Math.max(maxY, y0 + s);
        }

        const dominant = Math.max(...comp.parts.map((p) => p.start?.scale ?? 1));
        const unitSize = Math.round(32 / dominant);
        const widthPx = (maxX - minX) * unitSize;
        const heightPx = (maxY - minY) * unitSize;
        // Use a larger container but smaller scaling to fit more content
        const scale = Math.min(96 / widthPx, 96 / heightPx, 1);

        return (
            <div className="w-24 h-24 flex items-center justify-center overflow-hidden border border-gray-200 rounded-md bg-gray-50">
                <div
                    style={{
                        width: widthPx * scale,
                        height: heightPx * scale,
                        position: 'relative'
                    }}
                >
                    {comp.parts.map((p) => {
                        const ps = p.start?.scale ?? 1;
                        const partSize = unitSize * ps * scale;
                        const x = ((p.start?.x ?? 0) - minX) * unitSize * scale;
                        const y = ((p.start?.y ?? 0) - minY) * unitSize * scale;
                        return (
                            <span
                                key={p.id}
                                style={{
                                    position: 'absolute',
                                    left: x,
                                    top: y,
                                    fontSize: partSize
                                }}
                            >
                                <span
                                    style={{
                                        display: 'inline-block',
                                        transform: p.flipX ? 'scaleX(-1)' : undefined
                                    }}
                                >
                                    {p.emoji}
                                </span>
                            </span>
                        );
                    })}
                </div>
            </div>
        );
    };

    const getActorPreview = () => {
        if (actor.type === 'emoji') {
            return (actor as EmojiActor).emoji;
        } else if (actor.type === 'text') {
            return `"${(actor as TextActor).text}"`;
        } else if (actor.type === 'composite') {
            return (actor as CompositeActor).parts.map((p) => p.emoji).join('');
        }
        return 'Unknown';
    };

    const getActorIcon = () => {
        if (actor.type === 'emoji') {
            return <SmileyWinkIcon size={16} className="text-blue-600" />;
        } else if (actor.type === 'text') {
            return <TextTIcon size={16} className="text-purple-600" />;
        } else if (actor.type === 'composite') {
            return <UsersIcon size={16} className="text-green-600" />;
        }
        return <UserIcon size={16} className="text-gray-600" />;
    };

    return (
        <>
            <div className="border border-gray-200 rounded-lg shadow-sm bg-white overflow-hidden">
                {/* Actor Header */}
                <div className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                    <button
                        className="flex items-center gap-3 flex-1 text-left"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <div className="flex items-center gap-2">
                            {getActorIcon()}
                            <span className="text-lg">{getActorPreview()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{actor.type}</span>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                                <ClockIcon size={12} />
                                {actor.tracks.length} keyframe{actor.tracks.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                        <div className="ml-auto text-gray-400">
                            {isExpanded ? <CaretDownIcon size={16} /> : <CaretRightIcon size={16} />}
                        </div>
                    </button>
                    <button
                        className="ml-3 inline-flex items-center gap-1 px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        onClick={onRemove}
                    >
                        <TrashIcon size={14} />
                        Remove
                    </button>
                </div>

                {/* Actor Details */}
                {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50">
                        <div className="p-4 space-y-4">
                            {allowTypeChange && (
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <HashIcon size={14} />
                                        Type
                                    </label>
                                    <select
                                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={actor.type}
                                        onChange={(e) => handleTypeChange(e.target.value)}
                                    >
                                        <option value="emoji">Emoji</option>
                                        <option value="text">Text</option>
                                        <option value="composite">Composite</option>
                                    </select>
                                </div>
                            )}

                            {actor.type === 'emoji' && (
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <SmileyWinkIcon size={14} />
                                        Emoji
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-20 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={(actor as EmojiActor).emoji}
                                            onChange={(e) => update({ emoji: e.target.value })}
                                        />
                                        <button
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                                            onClick={openEmojiCatalogueForActor}
                                        >
                                            <SmileyWinkIcon size={14} />
                                            Browse
                                        </button>
                                    </div>
                                </div>
                            )}

                            {actor.type === 'text' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                            <TextTIcon size={14} />
                                            Text Content
                                        </label>
                                        <input
                                            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={(actor as TextActor).text}
                                            placeholder="Enter text..."
                                            onChange={(e) => update({ text: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                                <PaletteIcon size={14} />
                                                Color
                                            </label>
                                            <input
                                                type="color"
                                                className="border border-gray-300 rounded-md w-full h-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={(actor as TextActor).color ?? '#ffffff'}
                                                onChange={(e) => update({ color: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                                <ResizeIcon size={14} />
                                                Font Size
                                            </label>
                                            <input
                                                type="number"
                                                className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                value={(actor as TextActor).fontSize ?? ''}
                                                placeholder="32"
                                                onChange={(e) => update({ fontSize: e.target.value ? Number(e.target.value) : undefined })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {actor.type === 'composite' && (
                                <div className="flex flex-col items-center mb-6">
                                    <label className="text-sm font-medium text-gray-700 mb-3">Composite Preview</label>
                                    {renderPartsPreview()}
                                </div>
                            )}

                            {actor.type === 'composite' && (
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <UsersIcon size={14} />
                                        Parts
                                    </label>
                                    <div className="space-y-3">
                                        {(actor as CompositeActor).parts.map((p, idx) => (
                                            <div
                                                key={p.id}
                                                className={`border border-gray-200 rounded-md p-3 bg-white space-y-2 ${
                                                    draggedIndex === idx ? 'opacity-50' : ''
                                                } ${
                                                    dragOverIndex === idx ? 'border-blue-400 bg-blue-50' : ''
                                                }`}
                                                onDragOver={(e) => handleDragOver(e, idx)}
                                                onDragLeave={handleDragLeave}
                                                onDrop={(e) => handleDrop(e, idx)}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className="cursor-move text-gray-400 hover:text-gray-600 p-1 -m-1"
                                                        draggable={true}
                                                        onDragStart={(e) => handleDragStart(e, idx)}
                                                        onDragEnd={handleDragEnd}
                                                        title="Drag to reorder"
                                                    >
                                                        <DotsSixVerticalIcon size={14} />
                                                    </div>
                                                    <input
                                                        className="border border-gray-300 rounded-md px-3 py-1 text-sm w-20 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                        value={p.emoji}
                                                        onChange={(e) => updatePart(idx, { emoji: e.target.value })}
                                                    />
                                                    <button
                                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                                        onClick={() => openEmojiCatalogueForPart(idx)}
                                                    >
                                                        <SmileyWinkIcon size={12} />
                                                        Browse
                                                    </button>
                                                    <button
                                                        className="ml-auto text-xs text-red-600 hover:text-red-700"
                                                        onClick={() => removePart(idx)}
                                                    >
                                                        <TrashIcon size={12} />
                                                    </button>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2">
                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-1">X</label>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            className="border border-gray-300 rounded px-2 py-1 text-xs w-full focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                            value={p.start?.x ?? 0}
                                                            onChange={(e) => updatePartStart(idx, 'x', Number(e.target.value))}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-1">Y</label>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            className="border border-gray-300 rounded px-2 py-1 text-xs w-full focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                            value={p.start?.y ?? 0}
                                                            onChange={(e) => updatePartStart(idx, 'y', Number(e.target.value))}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs text-gray-600 mb-1">Scale</label>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            className="border border-gray-300 rounded px-2 py-1 text-xs w-full focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                            value={p.start?.scale ?? 1}
                                                            onChange={(e) => updatePartStart(idx, 'scale', Number(e.target.value))}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {(actor as CompositeActor).parts.length === 0 && (
                                            <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-md">
                                                No parts yet. Add one to build your composite actor.
                                            </div>
                                        )}
                                        <button
                                            className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                                            onClick={addPart}
                                        >
                                            <PlusIcon size={12} />
                                            Add Part
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                                    <ArrowsOutCardinalIcon size={14} />
                                    Starting Position & Rotation
                                </label>
                                <div className="grid grid-cols-4 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">X Position</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={(actor.start?.x ?? 0).toString()}
                                            onChange={(e) => updateStart('x', Number(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Y Position</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={(actor.start?.y ?? 0).toString()}
                                            onChange={(e) => updateStart('y', Number(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Scale</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value={(actor.start?.scale ?? 1).toString()}
                                            onChange={(e) => updateStart('scale', Number(e.target.value))}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-600 mb-1">Rotation (deg)</label>
                                        <input
                                            type="number"
                                            step="1"
                                            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            value="0"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <ClockIcon size={14} />
                                        Keyframes
                                    </label>
                                    <button
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                        onClick={addKeyframe}
                                    >
                                        <PlusIcon size={12} />
                                        Add
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {actor.tracks.map((track, idx) => (
                                        <div key={idx} className="border border-gray-200 rounded-md p-3 bg-white space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-gray-700">
                                                    Keyframe {idx + 1}
                                                </span>
                                                {actor.tracks.length > 1 && (
                                                    <button
                                                        className="text-xs text-red-600 hover:text-red-700"
                                                        onClick={() => removeKeyframe(idx)}
                                                    >
                                                        <TrashIcon size={12} />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-4 gap-2">
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">Time (ms)</label>
                                                    <input
                                                        type="number"
                                                        className="border border-gray-300 rounded px-2 py-1 text-xs w-full focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                        value={track.t}
                                                        onChange={(e) => updateTrack(idx, 't', Number(e.target.value))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">X</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        className="border border-gray-300 rounded px-2 py-1 text-xs w-full focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                        value={track.x}
                                                        onChange={(e) => updateTrack(idx, 'x', Number(e.target.value))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">Y</label>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        className="border border-gray-300 rounded px-2 py-1 text-xs w-full focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                        value={track.y}
                                                        onChange={(e) => updateTrack(idx, 'y', Number(e.target.value))}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">Rotate</label>
                                                    <input
                                                        type="number"
                                                        step="1"
                                                        className="border border-gray-300 rounded px-2 py-1 text-xs w-full focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                        value={track.rotate}
                                                        onChange={(e) => updateTrack(idx, 'rotate', Number(e.target.value))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <ArrowsClockwiseIcon size={14} />
                                        Loop
                                    </label>
                                    <select
                                        className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={(actor as any).loop ?? 'none'}
                                        onChange={(e) => update({ loop: e.target.value })}
                                    >
                                        <option value="none">None</option>
                                        <option value="float">Float</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <ResizeIcon size={14} />
                                        Z-Index
                                    </label>
                                    <input
                                        type="number"
                                        className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        value={(actor as any).z ?? 0}
                                        onChange={(e) => update({ z: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <UserIcon size={14} />
                                    Accessibility Label
                                </label>
                                <input
                                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={(actor as any).ariaLabel ?? ''}
                                    placeholder="Describe this actor..."
                                    onChange={(e) => update({ ariaLabel: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {showEmojiCatalogue && (
                <EmojiCatalogue
                    onSelectEmoji={handleEmojiSelect}
                    isOpen={showEmojiCatalogue}
                    onClose={() => {
                        setShowEmojiCatalogue(false);
                        setPartCatalogueIndex(null);
                    }}
                />
            )}
        </>
    );
}
