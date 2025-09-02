'use client';

import React, { useState } from 'react';
import { Animation, Scene, Actor, EmojiActor, TextActor, Keyframe } from './AnimationTypes';
import { EmojiPlayer } from './EmojiPlayer';
import SceneCanvas from './SceneCanvas';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;

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
};

export default function MovieEditor() {
  const [animation, setAnimation] = useState<Animation>({
    title: 'Untitled Movie',
    description: '',
    fps: 30,
    scenes: []
  });

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
    setAnimation((a) => ({ ...a, scenes: [...a.scenes, scene] }));
  };

  const removeScene = (idx: number) => {
    setAnimation((a) => {
      const scenes = [...a.scenes];
      scenes.splice(idx, 1);
      return { ...a, scenes };
    });
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="md:w-1/2 space-y-4">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <input
            className="border rounded px-2 py-1 w-full"
            value={animation.title}
            onChange={(e) => setAnimation((a) => ({ ...a, title: e.target.value }))}
          />
        </div>
        {animation.scenes.map((s, i) => (
          <SceneEditor
            key={s.id}
            scene={s}
            fps={animation.fps}
            onChange={(sc) => updateScene(i, sc)}
            onRemove={() => removeScene(i)}
          />
        ))}
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded"
          onClick={addScene}
        >
          Add Scene
        </button>
      </div>
      <div className="md:w-1/2">
        {animation.scenes.length > 0 ? (
          <EmojiPlayer animation={animation} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
        ) : (
          <div className="w-full h-64 border-2 border-dashed flex items-center justify-center text-gray-400">
            No scenes yet
          </div>
        )}
      </div>
    </div>
  );
}

function SceneEditor({ scene, fps, onChange, onRemove }: SceneEditorProps) {
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
    <div className="border rounded p-3 space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Scene</h3>
        <button className="text-red-600" onClick={onRemove}>
          Remove
        </button>
      </div>
      <div>
        <label className="block text-sm">Duration (ms)</label>
        <input
          type="number"
          className="border rounded px-2 py-1 w-full"
          value={scene.duration_ms}
          onChange={(e) => update({ duration_ms: parseInt(e.target.value) || 0 })}
        />
      </div>
      <div>
        <label className="block text-sm">Caption</label>
        <input
          className="border rounded px-2 py-1 w-full"
          value={scene.caption ?? ''}
          onChange={(e) => update({ caption: e.target.value })}
        />
      </div>

      <SceneCanvas
        scene={scene}
        fps={fps}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onSceneChange={onChange}
      />

      <div>
        <h4 className="font-medium">Background Actors</h4>
        {scene.backgroundActors.map((a, i) => (
          <ActorEditor
            key={a.id}
            actor={a}
            onChange={(ac) => updateBackground(i, ac as EmojiActor)}
            onRemove={() => removeBackground(i)}
            allowTypeChange={false}
          />
        ))}
        <button className="mt-2 text-sm text-blue-600" onClick={addBackground}>
          Add Background Actor
        </button>
      </div>

      <div>
        <h4 className="font-medium">Actors</h4>
        {scene.actors.map((a, i) => (
          <ActorEditor
            key={a.id}
            actor={a}
            onChange={(ac) => updateActor(i, ac)}
            onRemove={() => removeActor(i)}
          />
        ))}
        <div className="flex gap-2 mt-2">
          <button className="text-sm text-blue-600" onClick={addActor}>
            Add Emoji Actor
          </button>
          <button className="text-sm text-blue-600" onClick={addTextActor}>
            Add Text Actor
          </button>
        </div>
      </div>
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

  return (
    <div className="border rounded p-2 mt-2 space-y-2">
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium">Actor</div>
        <button className="text-red-600 text-xs" onClick={onRemove}>
          Remove
        </button>
      </div>
      {allowTypeChange && (
        <div>
          <label className="block text-xs">Type</label>
          <select
            className="border rounded px-1 py-0.5 text-sm"
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
          <label className="block text-xs">Emoji</label>
          <input
            className="border rounded px-1 py-0.5 text-sm"
            value={(actor as EmojiActor).emoji}
            onChange={(e) => update({ emoji: e.target.value })}
          />
        </div>
      )}

      {actor.type === 'text' && (
        <>
          <div>
            <label className="block text-xs">Text</label>
            <input
              className="border rounded px-1 py-0.5 text-sm w-full"
              value={(actor as TextActor).text}
              onChange={(e) => update({ text: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs">Color</label>
            <input
              className="border rounded px-1 py-0.5 text-sm"
              value={(actor as TextActor).color ?? ''}
              onChange={(e) => update({ color: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs">Font Size</label>
            <input
              type="number"
              className="border rounded px-1 py-0.5 text-sm"
              value={(actor as TextActor).fontSize ?? ''}
              onChange={(e) => update({ fontSize: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        </>
      )}

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs">Start X</label>
          <input
            type="number"
            className="border rounded px-1 py-0.5 text-sm w-full"
            value={(actor.start?.x ?? 0).toString()}
            onChange={(e) => updateStart('x', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-xs">Start Y</label>
          <input
            type="number"
            className="border rounded px-1 py-0.5 text-sm w-full"
            value={(actor.start?.y ?? 0).toString()}
            onChange={(e) => updateStart('y', Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-xs">Scale</label>
          <input
            type="number"
            className="border rounded px-1 py-0.5 text-sm w-full"
            value={(actor.start?.scale ?? 1).toString()}
            onChange={(e) => updateStart('scale', Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center">
          <span className="text-xs font-medium">Keyframes</span>
          <button className="text-xs text-blue-600" onClick={addKeyframe}>
            Add
          </button>
        </div>
        {actor.tracks.map((k, i) => (
          <div key={i} className="grid grid-cols-5 gap-1 mt-1 text-xs items-center">
            <input
              type="number"
              className="border rounded px-1 py-0.5"
              value={k.t}
              onChange={(e) => updateTrack(i, 't', Number(e.target.value))}
            />
            <input
              type="number"
              className="border rounded px-1 py-0.5"
              value={k.x}
              onChange={(e) => updateTrack(i, 'x', Number(e.target.value))}
            />
            <input
              type="number"
              className="border rounded px-1 py-0.5"
              value={k.y}
              onChange={(e) => updateTrack(i, 'y', Number(e.target.value))}
            />
            <input
              type="number"
              className="border rounded px-1 py-0.5"
              value={k.scale ?? ''}
              onChange={(e) => updateTrack(i, 'scale', Number(e.target.value))}
            />
            <button
              className="text-red-600"
              onClick={() => removeKeyframe(i)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

