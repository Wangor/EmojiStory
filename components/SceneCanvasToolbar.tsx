'use client';

import React from 'react';
import { ArrowsOutCardinalIcon, ResizeIcon, UserIcon, MountainsIcon, ArrowsClockwiseIcon } from '@phosphor-icons/react';

type SceneCanvasToolbarProps = {
    layer: 'actors' | 'background';
    setLayer: (l: 'actors' | 'background') => void;
    tool: 'move' | 'scale' | 'rotate';
    setTool: (t: 'move' | 'scale' | 'rotate') => void;
};

export default function SceneCanvasToolbar({ layer, setLayer, tool, setTool }: SceneCanvasToolbarProps) {
    return (
        <div className="flex justify-between items-center">
            <div className="flex gap-2">
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            layer === 'actors'
                                ? 'bg-white text-orange-400 shadow-sm'
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
                                ? 'bg-white text-orange-400 shadow-sm'
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
                            ? 'bg-white text-orange-400 shadow-sm'
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
                            ? 'bg-white text-orange-400 shadow-sm'
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
                            ? 'bg-white text-orange-400 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                    }`}
                    onClick={() => setTool('rotate')}
                >
                    <ArrowsClockwiseIcon size={14} />
                    Rotate
                </button>
            </div>
        </div>
    );
}

