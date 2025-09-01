import type { Animation } from '../components/AnimationTypes';

export const SAMPLE_ANIMATION: Animation = {
  title: 'The Lost Balloon',
  fps: 30,
  scenes: [
    {
      id: 'scene-1',
      duration_ms: 6000,
      backgroundActors: [
        {
          id: 'bg-1',
          type: 'emoji',
          emoji: '🌆',
          start: { x: 0.5, y: 0.6, scale: 3 },
          tracks: [
            { t: 0, x: 0.5, y: 0.6, scale: 3 },
            { t: 3000, x: 0.5, y: 0.58, scale: 3 },
            { t: 6000, x: 0.5, y: 0.6, scale: 3 }
          ],
          loop: 'float',
          z: -100
        }
      ],
      caption: 'A cat spots a red balloon.',
      actors: [
        {
          id: 'cat1',
          type: 'emoji',
          emoji: '🐱',
          start: { x: 0.1, y: 0.8, scale: 1 },
          tracks: [
            { t: 0, x: 0.1, y: 0.8 },
            { t: 2000, x: 0.4, y: 0.8, rotate: 0 },
            { t: 4000, x: 0.5, y: 0.7, rotate: -10 },
            { t: 6000, x: 0.55, y: 0.7, rotate: 0 }
          ]
        },
        {
          id: 'balloon',
          type: 'emoji',
          emoji: '🎈',
          start: { x: 0.75, y: 0.15, scale: 1.2 },
          tracks: [
            { t: 0, x: 0.75, y: 0.15 },
            { t: 3000, x: 0.78, y: 0.12 },
            { t: 6000, x: 0.82, y: 0.10 }
          ]
        }
      ]
    },
    {
      id: 'scene-2',
      duration_ms: 5000,
      backgroundActors: [
        {
          id: 'bg-2',
          type: 'emoji',
          emoji: '🌬️',
          start: { x: 0.5, y: 0.5, scale: 3 },
          tracks: [
            { t: 0, x: 0.5, y: 0.5, scale: 3 },
            { t: 2500, x: 0.5, y: 0.52, scale: 3 },
            { t: 5000, x: 0.5, y: 0.5, scale: 3 }
          ],
          loop: 'float',
          z: -100
        }
      ],
      caption: 'A gust lifts it higher—the chase is on!',
      actors: [
        {
          id: 'cat1',
          type: 'emoji',
          emoji: '🐱',
          start: { x: 0.55, y: 0.7, scale: 1 },
          tracks: [
            { t: 0, x: 0.55, y: 0.7 },
            { t: 2500, x: 0.65, y: 0.6, rotate: 10 },
            { t: 5000, x: 0.8, y: 0.55, rotate: 0 }
          ]
        },
        {
          id: 'balloon',
          type: 'emoji',
          emoji: '🎈',
          start: { x: 0.82, y: 0.10, scale: 1.2 },
          tracks: [
            { t: 0, x: 0.82, y: 0.10 },
            { t: 2500, x: 0.84, y: 0.06 },
            { t: 5000, x: 0.86, y: 0.04 }
          ]
        }
      ]
    }
  ]
};
