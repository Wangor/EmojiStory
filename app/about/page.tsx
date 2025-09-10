import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About EmojiStory',
  description: 'Learn about EmojiStory and how we turn stories into emoji movies.'
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">About EmojiStory</h1>
      <p>
        EmojiStory is an experimental studio that transforms short stories into playful emoji movies.
        We aim to make storytelling simple, creative, and fun for everyone.
      </p>
      <p>
        Whether you are sharing a joke, documenting an adventure, or crafting a fantasy,
        our tools help you express ideas through animated emoji scenes.
      </p>
    </main>
  );
}
