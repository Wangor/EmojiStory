'use client';

import React, { useState } from 'react';
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
      duration_ms: 1000,
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
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold">Movie Editor</h1>
          <div className="flex gap-2">
            <label className="text-sm font-medium">FPS:</label>
            <input
              type="number"
              className="border rounded px-2 py-1 w-16 text-sm"
              value={animation.fps}
              onChange={(e) => setAnimation((a) => ({ ...a, fps: Number(e.target.value) || 30 }))}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            className="border rounded px-2 py-1 w-full max-w-md"
            value={animation.title}
            onChange={(e) => setAnimation((a) => ({ ...a, title: e.target.value }))}
          />
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Panel - Scene Editor */}
        <div className="w-1/2 border-r flex flex-col">
          {/* Scene Tabs */}
          <div className="border-b bg-gray-50">
            <div className="flex overflow-x-auto">
              {animation.scenes.map((scene, idx) => (
                <button
                  key={scene.id}
                  className={`px-4 py-2 text-sm border-r whitespace-nowrap ${
                    activeSceneIndex === idx 
                      ? 'bg-white border-b-2 border-b-gray-800 font-medium' 
                      : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveSceneIndex(idx)}
                >
                  Scene {idx + 1}
                </button>
              ))}
              <button
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 border-r"
                onClick={addScene}
              >
                + Add Scene
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
                sceneIndex={activeSceneIndex}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <p>No scenes yet</p>
                  <button
                    className="mt-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                    onClick={addScene}
                  >
                    Create First Scene
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-1/2 flex flex-col">
          <div className="border-b p-3 bg-gray-50">
            <h2 className="font-semibold">Preview</h2>
          </div>
          <div className="flex-1 p-4 flex items-center justify-center">
            {animation.scenes.length > 0 ? (
              <EmojiPlayer animation={animation} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
            ) : (
              <div className="w-full max-w-md h-64 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                Preview will appear here
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SceneEditor({ scene, fps, onChange, onRemove, sceneIndex }: SceneEditorProps) {
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
      tracks: [{ t: 0, x: 0.5, y: 0.5 }]
    };
    update({ actors: [...scene.actors, actor] });
  };

  const addTextActor = () => {
    const actor: TextActor = {
      id: uuid(),
      type: 'text',
      text: 'Text',
      start: { x: 0.5, y: 0.5, scale: 1 },
      tracks: [{ t: 0, x: 0.5, y: 0.5 }]
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
      tracks: [{ t: 0, x: 0.5, y: 0.5 }]
    };
    update({ backgroundActors: [...scene.backgroundActors, actor] });
  };

  const removeBackground = (idx: number) => {
    const backgroundActors = [...scene.backgroundActors];
    backgroundActors.splice(idx, 1);
    update({ backgroundActors });
  };

  return (
    <div className="p-4">
      {/* Scene Settings */}
      <div className="mb-4 p-3 border rounded bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Scene {sceneIndex + 1} Settings</h3>
          <button
            className="text-sm text-red-600 hover:underline"
            onClick={onRemove}
          >
            Delete Scene
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Duration (ms)</label>
            <input
              type="number"
              className="border rounded px-2 py-1 w-full"
              value={scene.duration_ms}
              onChange={(e) => update({ duration_ms: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Caption</label>
            <input
              className="border rounded px-2 py-1 w-full"
              value={scene.caption ?? ''}
              onChange={(e) => update({ caption: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="mb-4">
        <div className="flex border-b">
          {[
            { key: 'canvas', label: 'Canvas', count: '' },
            { key: 'actors', label: 'Actors', count: `(${scene.actors.length})` },
            { key: 'background', label: 'Background', count: `(${scene.backgroundActors.length})` }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              className={`px-4 py-2 text-sm ${
                activeSection === key 
                  ? 'border-b-2 border-b-gray-800 font-medium' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveSection(key as any)}
            >
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
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Background Actors</h4>
            <button
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              onClick={addBackground}
            >
              Add Background Actor
            </button>
          </div>
          <div className="space-y-2">
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
              <div className="text-center py-8 text-gray-500">
                No background actors yet
              </div>
            )}
          </div>
        </div>
      )}

      {activeSection === 'actors' && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">Actors</h4>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                onClick={addActor}
              >
                Add Emoji
              </button>
              <button
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                onClick={addTextActor}
              >
                Add Text
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {scene.actors.map((a, i) => (
              <ActorEditor
                key={a.id}
                actor={a}
                onChange={(ac) => updateActor(i, ac)}
                onRemove={() => removeActor(i)}
              />
            ))}
            {scene.actors.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No actors yet
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
    const tracks = [...actor.tracks, { t: 0, x: 0.5, y: 0.5 }];
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
        tracks: [{ t: 0, x: 0.5, y: 0.5 }]
      };
      onChange(a);
    } else if (t === 'text') {
      const a: TextActor = {
        id: actor.id,
        type: 'text',
        text: 'Text',
        start: { x: 0.5, y: 0.5, scale: 1 },
        tracks: [{ t: 0, x: 0.5, y: 0.5 }]
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

  return (
    <div className="border rounded">
      {/* Actor Header */}
      <div className="flex items-center justify-between p-3 hover:bg-gray-50">
        <button
          className="flex items-center gap-2 flex-1 text-left"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="text-lg">{getActorPreview()}</span>
          <span className="text-sm text-gray-600">
            {actor.type} • {actor.tracks.length} keyframes
          </span>
          <span className="text-xs text-gray-400 ml-auto">
            {isExpanded ? '▼' : '▶'}
          </span>
        </button>
        <button
          className="text-red-600 text-sm hover:underline ml-2"
          onClick={onRemove}
        >
          Remove
        </button>
      </div>

      {/* Actor Details */}
      {isExpanded && (
        <div className="p-3 border-t bg-gray-50 space-y-3">
          {allowTypeChange && (
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                className="border rounded px-2 py-1 text-sm"
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
              <label className="block text-sm font-medium mb-1">Emoji</label>
              <input
                className="border rounded px-2 py-1 text-sm w-20"
                value={(actor as EmojiActor).emoji}
                onChange={(e) => update({ emoji: e.target.value })}
              />
            </div>
          )}

          {actor.type === 'text' && (
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Text</label>
                <input
                  className="border rounded px-2 py-1 text-sm w-full"
                  value={(actor as TextActor).text}
                  onChange={(e) => update({ text: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Color</label>
                  <input
                    className="border rounded px-2 py-1 text-sm w-full"
                    value={(actor as TextActor).color ?? ''}
                    placeholder="#000000"
                    onChange={(e) => update({ color: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Font Size</label>
                  <input
                    type="number"
                    className="border rounded px-2 py-1 text-sm w-full"
                    value={(actor as TextActor).fontSize ?? ''}
                    placeholder="32"
                    onChange={(e) => update({ fontSize: e.target.value ? Number(e.target.value) : undefined })}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Starting Position</label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">X</label>
                <input
                  type="number"
                  step="0.1"
                  className="border rounded px-2 py-1 text-sm w-full"
                  value={(actor.start?.x ?? 0).toString()}
                  onChange={(e) => updateStart('x', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Y</label>
                <input
                  type="number"
                  step="0.1"
                  className="border rounded px-2 py-1 text-sm w-full"
                  value={(actor.start?.y ?? 0).toString()}
                  onChange={(e) => updateStart('y', Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">Scale</label>
                <input
                  type="number"
                  step="0.1"
                  className="border rounded px-2 py-1 text-sm w-full"
                  value={(actor.start?.scale ?? 1).toString()}
                  onChange={(e) => updateStart('scale', Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Keyframes</label>
              <button
                className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100"
                onClick={addKeyframe}
              >
                Add Keyframe
              </button>
            </div>

            {actor.tracks.length > 0 && (
              <div className="space-y-1">
                <div className="grid grid-cols-5 gap-1 text-xs text-gray-600 font-medium">
                  <div>Time (ms)</div>
                  <div>X</div>
                  <div>Y</div>
                  <div>Scale</div>
                  <div></div>
                </div>
                {actor.tracks.map((k, i) => (
                  <div key={i} className="grid grid-cols-5 gap-1 items-center">
                    <input
                      type="number"
                      className="border rounded px-1 py-1 text-xs"
                      value={k.t}
                      onChange={(e) => updateTrack(i, 't', Number(e.target.value))}
                    />
                    <input
                      type="number"
                      step="0.1"
                      className="border rounded px-1 py-1 text-xs"
                      value={k.x}
                      onChange={(e) => updateTrack(i, 'x', Number(e.target.value))}
                    />
                    <input
                      type="number"
                      step="0.1"
                      className="border rounded px-1 py-1 text-xs"
                      value={k.y}
                      onChange={(e) => updateTrack(i, 'y', Number(e.target.value))}
                    />
                    <input
                      type="number"
                      step="0.1"
                      className="border rounded px-1 py-1 text-xs"
                      value={k.scale ?? ''}
                      onChange={(e) => updateTrack(i, 'scale', Number(e.target.value))}
                    />
                    <button
                      className="text-red-600 hover:underline text-xs"
                      onClick={() => removeKeyframe(i)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {actor.tracks.length === 0 && (
              <div className="text-center py-4 text-gray-500 text-sm">
                No keyframes yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
