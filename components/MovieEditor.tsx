'use client';

import React, { useState } from 'react';
import {
    FilmSlateIcon,
    UserIcon,
    UsersIcon,
    PlayIcon,
    ResizeIcon,
    ArrowsOutCardinalIcon,
    PlusIcon,
    TrashIcon,
    ClockIcon,
    ChatTextIcon,
    EyeIcon,
    EyeSlashIcon,
    CaretDownIcon,
    CaretRightIcon,
    CopyIcon,
    SmileyWinkIcon,
    TextTIcon,
    PaletteIcon,
    HashIcon,
    MountainsIcon,
    ArrowsClockwiseIcon
} from '@phosphor-icons/react';
import { Animation, Scene, Actor, EmojiActor, TextActor, Keyframe } from './AnimationTypes';
import { EmojiPlayer } from './EmojiPlayer';
import SceneCanvas from './SceneCanvas';

// Keep editor canvas and player in sync by sharing the same aspect ratio
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 270;

function uuid() {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
}

type SceneEditorProps = {
    scene: Scene;
    fps: number;
    onChange: (s: Scene) => void;
    onRemove: () => void;
    onDuplicate: () => void;
    sceneIndex: number;
};

export default function MovieEditor() {
    const [animation, setAnimation] = useState<Animation>({
        title: 'Untitled Movie',
        description: '',
        fps: 30,
        scenes: []
    });
    const [activeSceneIndex, setActiveSceneIndex] = useState(0);

    const updateScene = (idx: number, scene: Scene) => {
        setAnimation((a) => {
            const scenes = [...a.scenes];
            scenes[idx] = scene;
            return { ...a, scenes };
        });
    };

    const addScene = () => {
        const scene: Scene = {
            id: uuid(),
            duration_ms: 2000,
            backgroundActors: [],
            actors: []
        };
        setAnimation((a) => {
            const newScenes = [...a.scenes, scene];
            return { ...a, scenes: newScenes };
        });
        setActiveSceneIndex(animation.scenes.length);
    };

    const removeScene = (idx: number) => {
        setAnimation((a) => {
            const scenes = [...a.scenes];
            scenes.splice(idx, 1);
            return { ...a, scenes };
        });
        if (activeSceneIndex >= idx && activeSceneIndex > 0) {
            setActiveSceneIndex(activeSceneIndex - 1);
        }
    };

    const duplicateScene = (idx: number) => {
        const scene = animation.scenes[idx];
        const duplicated: Scene = {
            ...scene,
            id: uuid(),
            actors: scene.actors.map(a => ({ ...a, id: uuid() })),
            backgroundActors: scene.backgroundActors.map(a => ({ ...a, id: uuid() }))
        };
        setAnimation((a) => {
            const scenes = [...a.scenes];
            scenes.splice(idx + 1, 0, duplicated);
            return { ...a, scenes };
        });
        setActiveSceneIndex(idx + 1);
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="border-b bg-white shadow-sm">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
                                <FilmSlateIcon weight="bold" size={24} className="text-white" />
                            </div>
                            <h1 className="text-xl font-semibold text-gray-900">Movie Editor</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <ClockIcon size={16} className="text-gray-500" />
                                <label className="text-sm font-medium text-gray-700">FPS:</label>
                                <input
                                    type="number"
                                    className="border border-gray-300 rounded-md px-2 py-1 w-16 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={animation.fps}
                                    onChange={(e) => setAnimation((a) => ({ ...a, fps: Number(e.target.value) || 30 }))}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <FilmSlateIcon size={16} className="text-gray-500" />
                        <label className="text-sm font-medium text-gray-700">Title:</label>
                        <input
                            className="border border-gray-300 rounded-md px-3 py-2 flex-1 max-w-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={animation.title}
                            placeholder="Enter movie title..."
                            onChange={(e) => setAnimation((a) => ({ ...a, title: e.target.value }))}
                        />
                    </div>
                </div>
            </div>

            <div className="flex-1 flex min-h-0">
                {/* Left Panel - Scene Editor */}
                <div className="w-1/2 border-r border-gray-200 flex flex-col bg-white">
                    {/* Scene Tabs */}
                    <div className="border-b border-gray-200 bg-gray-50">
                        <div className="flex overflow-x-auto">
                            {animation.scenes.map((scene, idx) => (
                                <div key={scene.id} className="flex">
                                    <button
                                        className={`px-4 py-3 text-sm border-r border-gray-200 whitespace-nowrap flex items-center gap-2 transition-colors ${
                                            activeSceneIndex === idx
                                                ? 'bg-white border-b-2 border-b-blue-500 text-blue-600 font-medium shadow-sm'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                        onClick={() => setActiveSceneIndex(idx)}
                                    >
                                        <FilmSlateIcon size={14} />
                                        Scene {idx + 1}
                                    </button>
                                </div>
                            ))}
                            <button
                                className="px-4 py-3 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-r border-gray-200 flex items-center gap-2 transition-colors"
                                onClick={addScene}
                            >
                                <PlusIcon size={14} />
                                Add Scene
                            </button>
                        </div>
                    </div>

                    {/* Scene Content */}
                    <div className="flex-1 overflow-y-auto">
                        {animation.scenes.length > 0 && animation.scenes[activeSceneIndex] ? (
                            <SceneEditor
                                key={animation.scenes[activeSceneIndex].id}
                                scene={animation.scenes[activeSceneIndex]}
                                fps={animation.fps}
                                onChange={(scene) => updateScene(activeSceneIndex, scene)}
                                onRemove={() => removeScene(activeSceneIndex)}
                                onDuplicate={() => duplicateScene(activeSceneIndex)}
                                sceneIndex={activeSceneIndex}
                            />
                        ) : (
                            <div className="flex items-center justify-center h-64 text-gray-500">
                                <div className="text-center">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                        <FilmSlateIcon size={24} className="text-gray-400" />
                                    </div>
                                    <p className="text-lg font-medium mb-2">No scenes yet</p>
                                    <p className="text-sm text-gray-400 mb-4">Create your first scene to get started</p>
                                    <button
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                        onClick={addScene}
                                    >
                                        <PlusIcon size={16} />
                                        Create First Scene
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Preview */}
                <div className="w-1/2 flex flex-col bg-white">
                    <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                        <div className="flex items-center gap-2">
                            <EyeIcon size={16} className="text-gray-500" />
                            <h2 className="font-medium text-gray-900">Preview</h2>
                            {animation.scenes.length > 0 && (
                                <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                  {animation.scenes.length} scene{animation.scenes.length !== 1 ? 's' : ''}
                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 p-6 flex items-center justify-center bg-gray-50">
                        {animation.scenes.length > 0 ? (
                            <div className="w-full max-w-lg">
                                <EmojiPlayer animation={animation} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
                            </div>
                        ) : (
                            <div className="w-full max-w-md h-64 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center text-gray-400 bg-white">
                                <div className="text-center">
                                    <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-lg flex items-center justify-center">
                                        <PlayIcon size={20} className="text-gray-400" />
                                    </div>
                                    <p className="font-medium">Preview will appear here</p>
                                    <p className="text-sm mt-1">Add scenes to see your movie</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SceneEditor({ scene, fps, onChange, onRemove, onDuplicate, sceneIndex }: SceneEditorProps) {
    const [activeSection, setActiveSection] = useState<'canvas' | 'actors' | 'background'>('canvas');

    const update = (fields: Partial<Scene>) => onChange({ ...scene, ...fields });

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
                            <FilmSlateIcon size={16} className="text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-gray-900">Scene {sceneIndex + 1} Settings</h3>
                    </div>
                    <div className="flex gap-2">
                        <button
                            className="inline-flex items-center gap-1 px-3 py-1 text-xs text-blue-600 hover:bg-blue-100 rounded-md transition-colors"
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
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                            <ClockIcon size={14} />
                            Duration (ms)
                        </label>
                        <input
                            type="number"
                            className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                            className="border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={scene.caption ?? ''}
                            placeholder="Optional caption..."
                            onChange={(e) => update({ caption: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Section Navigation */}
            <div className="mb-6">
                <div className="flex border-b border-gray-200">
                    {[
                        {
                            key: 'canvas',
                            label: 'Canvas',
                            icon: <ArrowsOutCardinalIcon size={16} />,
                            count: ''
                        },
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
                            count: scene.backgroundActors.length > 0 ? `(${scene.backgroundActors.length})` : ''
                        }
                    ].map(({ key, label, icon, count }) => (
                        <button
                            key={key}
                            className={`flex items-center gap-2 px-4 py-3 text-sm transition-colors ${
                                activeSection === key
                                    ? 'border-b-2 border-b-blue-500 text-blue-600 font-medium'
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

            {/* Section Content */}
            {activeSection === 'canvas' && (
                <div>
                    <SceneCanvas
                        scene={scene}
                        fps={fps}
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        onSceneChange={onChange}
                    />
                </div>
            )}

            {activeSection === 'background' && (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <MountainsIcon size={20} className="text-gray-500" />
                            <h4 className="font-medium text-gray-900">Background Actors</h4>
                        </div>
                        <button
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
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
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                                onClick={addActor}
                            >
                                <SmileyWinkIcon size={16} />
                                Add Emoji
                            </button>
                            <button
                                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                                onClick={addTextActor}
                            >
                                <TextTIcon size={16} />
                                Add Text
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
    );
}

type ActorEditorProps = {
    actor: Actor;
    onChange: (a: Actor) => void;
    onRemove: () => void;
    allowTypeChange?: boolean;
};

function ActorEditor({ actor, onChange, onRemove, allowTypeChange = true }: ActorEditorProps) {
    const [isExpanded, setIsExpanded] = useState(false);

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
        }
    };

    const getActorPreview = () => {
        if (actor.type === 'emoji') {
            return (actor as EmojiActor).emoji;
        } else if (actor.type === 'text') {
            return `"${(actor as TextActor).text}"`;
        }
        return actor.type;
    };

    const getActorIcon = () => {
        if (actor.type === 'emoji') {
            return <SmileyWinkIcon size={16} className="text-blue-600" />;
        } else if (actor.type === 'text') {
            return <TextTIcon size={16} className="text-purple-600" />;
        }
        return <UserIcon size={16} className="text-gray-600" />;
    };

    return (
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
                                </select>
                            </div>
                        )}

                        {actor.type === 'emoji' && (
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                    <SmileyWinkIcon size={14} />
                                    Emoji
                                </label>
                                <input
                                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-20 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    value={(actor as EmojiActor).emoji}
                                    onChange={(e) => update({ emoji: e.target.value })}
                                />
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
                                    Animation Keyframes
                                </label>
                                <button
                                    className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                    onClick={addKeyframe}
                                >
                                    <PlusIcon size={12} />
                                    Add Keyframe
                                </button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {actor.tracks.map((track, idx) => (
                                    <div key={idx} className="border border-gray-200 rounded-md p-3 bg-white">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-medium text-gray-600">
                                                Keyframe {idx + 1} - {track.t}ms
                                            </span>
                                            <button
                                                className="text-xs text-red-600 hover:text-red-700"
                                                onClick={() => removeKeyframe(idx)}
                                            >
                                                <TrashIcon size={12} />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-5 gap-2">
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
                                                <label className="block text-xs text-gray-600 mb-1">Scale</label>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    className="border border-gray-300 rounded px-2 py-1 text-xs w-full focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                    value={track.scale ?? 1}
                                                    onChange={(e) => updateTrack(idx, 'scale', Number(e.target.value))}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">
                                                    <ArrowsClockwiseIcon size={10} className="inline mr-1" />
                                                    Rotate (deg)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="1"
                                                    className="border border-gray-300 rounded px-2 py-1 text-xs w-full focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                                                    value={track.rotate ?? 0}
                                                    onChange={(e) => updateTrack(idx, 'rotate', Number(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {actor.tracks.length === 0 && (
                                    <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-md">
                                        No keyframes yet. Add one to animate this actor.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
