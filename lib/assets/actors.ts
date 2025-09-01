// Common actor emoji with suggested default scales. This list is not exhaustive;
// the AI may use any emoji and infer reasonable scales based on real‑world size.
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
  { id: 'rabbit', emoji: '🐰', scale: 1, description: 'happy rabbit' },
  { id: 'fox', emoji: '🦊', scale: 1, description: 'sly fox' },
  { id: 'bear', emoji: '🐻', scale: 1.1, description: 'brown bear' },
  { id: 'panda', emoji: '🐼', scale: 1.1, description: 'cute panda' },
  { id: 'koala', emoji: '🐨', scale: 1.1, description: 'sleepy koala' },
  { id: 'lion', emoji: '🦁', scale: 1.2, description: 'brave lion' },
  { id: 'tiger', emoji: '🐯', scale: 1.2, description: 'striped tiger' },
  { id: 'monkey', emoji: '🐵', scale: 1, description: 'cheeky monkey' },
  { id: 'pig', emoji: '🐷', scale: 1, description: 'pink pig' },
  { id: 'chicken', emoji: '🐔', scale: 1, description: 'clucky chicken' },
  { id: 'cow', emoji: '🐮', scale: 1.3, description: 'spotted cow' },
  { id: 'mouse', emoji: '🐭', scale: 0.9, description: 'little mouse' },
  { id: 'unicorn', emoji: '🦄', scale: 1.3, description: 'magical unicorn' },
  { id: 'dragon', emoji: '🐉', scale: 1.4, description: 'green dragon' },
  { id: 'alien', emoji: '👽', scale: 1, description: 'friendly alien' },
  { id: 'ghost', emoji: '👻', scale: 1.2, description: 'silly ghost' },
  { id: 'fish', emoji: '🐟', scale: 1, description: 'blue fish' },
  { id: 'bird', emoji: '🐦', scale: 1, description: 'blue bird' },
  { id: 'frog', emoji: '🐸', scale: 1, description: 'green frog' },
  { id: 'horse', emoji: '🐴', scale: 1.3, description: 'galloping horse' },
  { id: 'sheep', emoji: '🐑', scale: 1.1, description: 'fluffy sheep' },
  { id: 'wolf', emoji: '🐺', scale: 1.2, description: 'howling wolf' },
  { id: 'boy', emoji: '👦', scale: 1, description: 'young boy' },
  { id: 'girl', emoji: '👧', scale: 1, description: 'young girl' },
];
