import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About EmojiStory',
  description: 'Learn about EmojiStory and how we turn stories into emoji movies.'
};

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">About EmojiStory</h1>
      <p>
        EmojiStory is an experimental studio that transforms short stories into playful emoji movies.
        We aim to make storytelling simple, creative, and fun for everyone.
      </p>
      <p>
        The project started as a small hackathon idea and has grown into a sandbox for exploring
        how generative AI and whimsical design can bring tiny narratives to life.
      </p>
      <h2 className="text-2xl font-semibold">Our Mission</h2>
      <p>
        We believe anyone should be able to share a story without needing expensive software
        or a background in animation. Our mission is to lower the barrier to creative expression
        by providing a playful canvas made entirely of emojis.
      </p>
      <h2 className="text-2xl font-semibold">How It Works</h2>
      <p>
        Using a mix of OpenAI tools and open-source animation libraries, EmojiStory converts your
        written prompts into short emoji scenes. The system chooses characters, sets backgrounds,
        and animates emotions to match the script.
      </p>
      <ul className="list-disc list-inside">
        <li>Create a script using simple text prompts.</li>
        <li>Pick from a library of emoji characters and locations.</li>
        <li>Share your finished emoji movie with friends or the community.</li>
      </ul>
      <h2 className="text-2xl font-semibold">What&apos;s Next</h2>
      <p>
        We are continually experimenting with new features such as collaborative story building,
        sound effects, and export options. Follow along and help shape the future of EmojiStory.
      </p>
    </main>
  );
}
