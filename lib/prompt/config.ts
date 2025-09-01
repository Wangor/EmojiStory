export interface EffectConfig {
  name: string;
  description: string;
}

export interface PromptConfig {
  maxScenes: number;
  maxActorsPerScene: number;
  maxTotalDurationMs: number;
  effects: readonly EffectConfig[];
}

export const defaultPromptConfig: PromptConfig = {
  maxScenes: 10,
  maxActorsPerScene: 5,
  maxTotalDurationMs: 90_000,
  effects: [
    { name: 'fade-in', description: 'actor fades in from transparent.' },
    { name: 'bounce', description: 'actor enters with a springy bounce.' },
  ] as const,
};
