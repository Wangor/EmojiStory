export interface AssetDefinition {
  id: string;
  emoji: string;
  scale: number;
  description: string;
}

export const ACTORS: readonly AssetDefinition[] = [
  { id: 'cat', emoji: '🐱', scale: 1, description: 'curious cat' },
  { id: 'dog', emoji: '🐶', scale: 1, description: 'playful dog' },
  { id: 'person', emoji: '🧍', scale: 1, description: 'standing person' },
  { id: 'balloon', emoji: '🎈', scale: 1.2, description: 'red balloon' },
  { id: 'robot', emoji: '🤖', scale: 1, description: 'friendly robot' },
  { id: 'car', emoji: '🚗', scale: 1.5, description: 'compact car' },
];
