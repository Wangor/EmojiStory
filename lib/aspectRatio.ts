import type { AspectRatio } from '../components/AnimationTypes';

export function getCanvasDimensions(aspectRatio: AspectRatio = '16:9', base = 480) {
  if (aspectRatio === '9:16') {
    const height = base;
    const width = Math.round((base * 9) / 16);
    return { width, height };
  }
  const width = base;
  const height = Math.round((base * 9) / 16);
  return { width, height };
}
