'use client';

import React, { useState, useEffect } from 'react';
import {
    FilmSlateIcon,
    ClockIcon,
    PlusIcon,
    EyeIcon,
    PlayIcon,
    MagicWandIcon,
    FloppyDiskIcon
} from '@phosphor-icons/react';
import { Animation, Scene } from './AnimationTypes';
import { EmojiPlayer } from './EmojiPlayer';
import SceneEditor from './SceneEditor';
import { uuid } from '../lib/uuid';
import { insertMovie, updateMovie, getUserChannels } from '../lib/supabaseClient';
import { useEmojiFont } from '../lib/emojiFonts';

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 270;

interface MovieEditorProps {
    movie?: any;
}

export default function MovieEditor({ movie }: MovieEditorProps) {
    const [animation, setAnimation] = useState<Animation>({
        title: 'Untitled Movie',
        description: '',
        fps: 30,
        scenes: [],
        emojiFont: undefined
    });
    const [activeSceneIndex, setActiveSceneIndex] = useState(0);
    const [showGenerator, setShowGenerator] = useState(false);
    const [storyText, setStoryText] = useState(movie?.story || '');
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [movieId, setMovieId] = useState<string | undefined>(movie?.id);
    const [channelId, setChannelId] = useState<string | undefined>(movie?.channel_id);
    const [channels, setChannels] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    useEmojiFont(animation.emojiFont);

    useEffect(() => {
        if (movie?.animation) {
            setAnimation({
                ...movie.animation,
                emojiFont: movie.emoji_font || movie.animation.emojiFont,
                title: movie.title ?? movie.animation.title ?? 'Untitled Movie',
                description:
                    movie.description ?? movie.animation.description ?? '',
            });
        }
        if (movie?.id) setMovieId(movie.id);
        if (movie?.channel_id) setChannelId(movie.channel_id);
        if (movie?.story) setStoryText(movie.story);
    }, [movie]);

    useEffect(() => {
        getUserChannels()
            .then(ch => {
                setChannels(ch);
                if (!channelId && ch.length === 1) {
                    setChannelId(ch[0].id);
                }
            })
            .catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    const saveMovie = async () => {
        setSaving(true);
        setSaveMessage(null);
        try {
            const animationToSave = { ...animation };
            const selectedFont = animationToSave.emojiFont;
            if (!selectedFont) {
                delete (animationToSave as any).emojiFont;
            }
            const payload = {
                channel_id: channelId!,
                title: animation.title,
                description: animation.description,
                story: storyText,
                emoji_font: selectedFont ?? null,
                animation: animationToSave,
            } as const;
            let saved;
            if (movieId) {
                saved = await updateMovie({ id: movieId, ...payload });
            } else {
                if (!channelId) throw new Error('No channel');
                saved = await insertMovie(payload);
            }
            setMovieId(saved.id);
            setSaveMessage('Saved!');
        } catch (e: any) {
            setSaveMessage(e.message || 'Failed to save');
        } finally {
            setSaving(false);
            setTimeout(() => setSaveMessage(null), 3000);
        }
    };

    const generateWithAI = async () => {
        setGenerating(true);
        setError(null);
        try {
            const res = await fetch('/api/storyboard', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ story: storyText })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to generate');
            setAnimation(data.animation as Animation);
            setActiveSceneIndex(0);
            setShowGenerator(false);
        } catch (e: any) {
            setError(e.message || 'Unknown error');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <div className="border-b bg-white shadow-sm">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-orange-400 to-yellow-400 rounded-lg shadow-sm">
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
                                className="border border-gray-300 rounded-md px-2 py-1 w-16 text-sm focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                                value={animation.fps}
                                onChange={(e) => setAnimation((a) => ({ ...a, fps: Number(e.target.value) || 30 }))}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700">Emoji Font:</label>
                            <select
                                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                                value={animation.emojiFont || ''}
                                onChange={(e) =>
                                    setAnimation((a) => ({
                                        ...a,
                                        emojiFont: e.target.value || undefined,
                                    }))
                                }
                            >
                                <option value="">System default</option>
                                <option value="Noto Color Emoji">Noto Color Emoji</option>
                                <option value="Noto Emoji">Noto Emoji (Monochrome)</option>
                                <option value="Twemoji">Twemoji</option>
                                <option value="OpenMoji">OpenMoji</option>
                                <option value="Blobmoji">Blobmoji</option>
                            </select>
                        </div>
                        {channels.length > 1 && (
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium text-gray-700">Channel:</label>
                                <select
                                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                                        value={channelId || ''}
                                        onChange={(e) => setChannelId(e.target.value)}
                                    >
                                        <option value="" disabled>
                                            Select channel
                                        </option>
                                        {channels.map((ch) => (
                                            <option key={ch.id} value={ch.id}>
                                                {ch.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <button
                                className="inline-flex items-center gap-2 px-3 py-2 bg-orange-400 text-white rounded-md hover:bg-orange-500 transition-colors disabled:opacity-50"
                                onClick={saveMovie}
                                disabled={saving || !channelId}
                            >
                                <FloppyDiskIcon size={16} />
                                {saving ? 'Saving…' : 'Save'}
                            </button>
                            <button
                                className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-orange-400 text-orange-400 rounded-md transition-colors"
                                onClick={() => setShowGenerator(true)}
                            >
                                <MagicWandIcon size={16} />
                                Generate with AI
                            </button>
                            {saveMessage && (
                                <span className="text-sm text-gray-600">{saveMessage}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <FilmSlateIcon size={16} className="text-gray-500" />
                        <label className="text-sm font-medium text-gray-700">Title:</label>
                        <input
                            className="border border-gray-300 rounded-md px-3 py-2 flex-1 max-w-md focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                            value={animation.title}
                            placeholder="Enter movie title..."
                            onChange={(e) => setAnimation((a) => ({ ...a, title: e.target.value }))}
                        />
                    </div>
                    {showGenerator && (
                        <div className="mt-4">
                            <textarea
                                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-orange-300 focus:border-transparent"
                                rows={3}
                                placeholder="Describe your story..."
                                value={storyText}
                                onChange={(e) => setStoryText(e.target.value)}
                            />
                            <div className="mt-2 flex gap-2">
                                <button
                                    className="px-3 py-2 bg-orange-400 text-white rounded-md hover:bg-orange-500 transition-colors disabled:opacity-50"
                                    onClick={generateWithAI}
                                    disabled={generating || !storyText.trim()}
                                >
                                    {generating ? 'Generating…' : 'Generate'}
                                </button>
                                <button
                                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                                    onClick={() => setShowGenerator(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                        </div>
                    )}
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
                                                ? 'bg-white border-b-2 border-b-orange-500 text-orange-400 font-medium shadow-sm'
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
                                emojiFont={animation.emojiFont}
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
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-orange-400 text-white rounded-lg hover:bg-orange-500 transition-colors shadow-sm"
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

