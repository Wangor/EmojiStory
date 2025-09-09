'use client';

import React from 'react';
import { UserIcon } from '@phosphor-icons/react';
import { Actor } from './AnimationTypes';

type SceneCanvasActorInfoProps = {
    actor: Actor;
    currentFrame: number;
    frameMs: number;
    sample: (actor: Actor, t: number) => { x: number; y: number; scale: number; rotate: number };
};

export default function SceneCanvasActorInfo({ actor, currentFrame, frameMs, sample }: SceneCanvasActorInfoProps) {
    const t = Math.round(currentFrame * frameMs);
    const pose = sample(actor, t);
    return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserIcon size={12} className="text-blue-600" />
                    </div>
                    <span className="font-medium text-blue-900">Selected: {actor.type} ({actor.id})</span>
                </div>
                <div className="text-sm text-blue-700">
                    Frame {currentFrame} ({Math.round(currentFrame * frameMs)}ms)
                </div>
            </div>
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
        </div>
    );
}

