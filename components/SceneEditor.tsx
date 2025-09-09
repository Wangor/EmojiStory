'use client';

import React, { useState } from 'react';
import {
    ChatTextIcon,
    ClockIcon,
    CopyIcon,
    FilmSlateIcon,
    MountainsIcon,
    PaletteIcon,
    PlusIcon,
    SmileyWinkIcon,
    TextTIcon,
    TrashIcon,
    UserIcon,
    UsersIcon
} from '@phosphor-icons/react';
import {
    Actor,
    AspectRatio,
    CompositeActor,
    EmojiActor,
    Scene,
    TextActor
} from './AnimationTypes';
import ActorEditor from './ActorEditor';
import SceneCanvas from './SceneCanvas';
import { getCanvasDimensions } from '../lib/aspectRatio';
import { uuid } from '../lib/uuid';

export type SceneEditorProps = {
    aspectRatio: AspectRatio;
    emojiFont?: string;
    fps: number;
    onChange: (s: Scene) => void;
    onDuplicate: () => void;
    onRemove: () => void;
    scene: Scene;
    sceneIndex: number;
};

export default function SceneEditor({ scene, fps, onChange, onRemove, onDuplicate, sceneIndex, emojiFont, aspectRatio }: SceneEditorProps) {
    const [activeSection, setActiveSection] = useState<'actors' | 'background'>('actors');

    const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = getCanvasDimensions(aspectRatio);

    const update = (fields: Partial<Scene>) => onChange({ ...scene, ...fields });
    const defaultBg = emojiFont === 'Noto Emoji' ? '#ffffff' : '#000000';

    const updateActor = (idx: number, actor: Actor) => {
        const actors = [...scene.actors];
        actors[idx] = actor;
        update({ actors });
    };

    const addActor = () => {
        const actor: EmojiActor = {
            id: uuid(),
            type: 'emoji',
            emoji: '😀',
            start: { x: 0.5, y: 0.5, scale: 1 },
            tracks: [{ t: 0, x: 0.5, y: 0.5, rotate: 0 }]
        };
        update({ actors: [...scene.actors, actor] });
    };

    const addTextActor = () => {
        const actor: TextActor = {
            id: uuid(),
            type: 'text',
            text: 'Hello World',
            start: { x: 0.5, y: 0.5, scale: 1 },
            tracks: [{ t: 0, x: 0.5, y: 0.5, rotate: 0 }]
        };
        update({ actors: [...scene.actors, actor] });
    };

    const addCompositeActor = () => {
        const actor: CompositeActor = {
            id: uuid(),
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
        update({ actors: [...scene.actors, actor] });
    };

    const removeActor = (idx: number) => {
        const actors = [...scene.actors];
        actors.splice(idx, 1);
        update({ actors });
    };

    const updateBackground = (idx: number, actor: EmojiActor) => {
        const backgroundActors = [...scene.backgroundActors];
        backgroundActors[idx] = actor;
        update({ backgroundActors });
    };

    const addBackground = () => {
        const actor: EmojiActor = {
            id: uuid(),
            type: 'emoji',
            emoji: '🌄',
            start: { x: 0.5, y: 0.5, scale: 1 },
            tracks: [{ t: 0, x: 0.5, y: 0.5, rotate: 0 }]
        };
        update({ backgroundActors: [...scene.backgroundActors, actor] });
    };

    const removeBackground = (idx: number) => {
        const backgroundActors = [...scene.backgroundActors];
        backgroundActors.splice(idx, 1);
        update({ backgroundActors });
    };

    return (
        <div className="p-6">
            {/* Scene Settings */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FilmSlateIcon size={16} className="text-orange-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Scene {sceneIndex + 1} Settings</h3>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs text-orange-400 hover:bg-orange-100 rounded-md transition-colors"
                            onClick={onDuplicate}
                        >
                            <CopyIcon size={12} />
                            Duplicate
                        </button>
                        <button
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            onClick={onRemove}
                        >
                            <TrashIcon size={12} />
                            Delete
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <ClockIcon size={14} />
                            Duration (ms)
                        </label>
                        <input
                            type="number"
                            className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                            value={scene.duration_ms}
                            onChange={(e) => update({ duration_ms: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <ChatTextIcon size={14} />
                            Caption
                        </label>
                        <input
                            className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                            value={scene.caption ?? ''}
                            placeholder="Optional caption..."
                            onChange={(e) => update({ caption: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <PaletteIcon size={14} />
                            Background
                        </label>
                        <div className="flex items-center gap-2">
                            <input
                                type="color"
                                className="h-10 w-12 rounded-md border border-gray-300"
                                value={scene.backgroundColor ?? defaultBg}
                                onChange={(e) => update({ backgroundColor: e.target.value })}
                            />
                            <button
                                className="text-xs text-gray-500 hover:text-gray-700"
                                onClick={() => update({ backgroundColor: undefined })}
                            >
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col gap-6">
                <div className="flex justify-center">
                    <SceneCanvas
                        scene={scene}
                        fps={fps}
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        aspectRatio={aspectRatio}
                        onSceneChange={onChange}
                        emojiFont={emojiFont}
                    />
                </div>
                <div className="w-full">
                    <div className="mb-4">
                        <div className="flex border-b border-gray-200">
                            {[
                                {
                                    key: 'actors',
                                    label: 'Actors',
                                    icon: <UserIcon size={16} />,
                                    count: scene.actors.length > 0 ? `(${scene.actors.length})` : ''
                                },
                                {
                                    key: 'background',
                                    label: 'Background',
                                    icon: <MountainsIcon size={16} />,
                                    count:
                                        scene.backgroundActors.length > 0
                                            ? `(${scene.backgroundActors.length})`
                                            : ''
                                }
                            ].map(({ key, label, icon, count }) => (
                                <button
                                    key={key}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors ${
                                        activeSection === key
                                            ? 'border-b-2 border-b-orange-300 text-orange-400 font-medium'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                                    onClick={() => setActiveSection(key as any)}
                                >
                                    {icon}
                                    {label} {count}
                                </button>
                            ))}
                        </div>
                    </div>
                    {activeSection === 'background' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <MountainsIcon size={20} className="text-gray-500" />
                                    <h4 className="font-medium text-gray-900">Background Actors</h4>
                                </div>
                                <button
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-orange-400 text-white rounded-lg hover:bg-orange-500 transition-colors shadow-sm"
                                    onClick={addBackground}
                                >
                                    <PlusIcon size={16} />
                                    Add Background
                                </button>
                            </div>
                            <div className="space-y-3">
                                {scene.backgroundActors.map((a, i) => (
                                    <ActorEditor
                                        key={a.id}
                                        actor={a}
                                        onChange={(ac) => updateBackground(i, ac as EmojiActor)}
                                        onRemove={() => removeBackground(i)}
                                        allowTypeChange={false}
                                        emojiFont={emojiFont}
                                    />
                                ))}
                                {scene.backgroundActors.length === 0 && (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                        <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-lg flex items-center justify-center">
                                            <MountainsIcon size={20} className="text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 font-medium">No background actors yet</p>
                                        <p className="text-gray-400 text-sm mt-1">Add landscape or scenery elements</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    {activeSection === 'actors' && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <UsersIcon size={20} className="text-gray-500" />
                                    <h4 className="font-medium text-gray-900">Actors</h4>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                                        onClick={addActor}
                                    >
                                        <SmileyWinkIcon size={16} />
                                        Add Emoji
                                    </button>
                                    <button
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                                        onClick={addTextActor}
                                    >
                                        <TextTIcon size={16} />
                                        Add Text
                                    </button>
                                    <button
                                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                                        onClick={addCompositeActor}
                                    >
                                        <UsersIcon size={16} />
                                        Add Composite
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {scene.actors.map((a, i) => (
                                    <ActorEditor
                                        key={a.id}
                                        actor={a}
                                        onChange={(ac) => updateActor(i, ac)}
                                        onRemove={() => removeActor(i)}
                                        emojiFont={emojiFont}
                                    />
                                ))}
                                {scene.actors.length === 0 && (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                        <div className="w-12 h-12 mx-auto mb-3 bg-gray-200 rounded-lg flex items-center justify-center">
                                            <UsersIcon size={20} className="text-gray-400" />
                                        </div>
                                        <p className="text-gray-500 font-medium">No actors yet</p>
                                        <p className="text-gray-400 text-sm mt-1">Add characters to bring your scene to life</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

