import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact EmojiStory',
  description: 'Get in touch with the EmojiStory team.'
};

export default function ContactPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <p>
        Have questions, feedback, or just want to say hello? We would love to hear from you.
        Every message helps us improve the experience of building movies out of emojis.
      </p>
      <p>
        Send us an email at{' '}
        <Link href="mailto:hello@emojistory.com" className="text-blue-600 hover:underline">
          hello@emojistory.com
        </Link>{' '}
        and we will get back to you.
      </p>
      <h2 className="text-2xl font-semibold">Other Ways to Connect</h2>
      <ul className="list-disc list-inside">
        <li>
          Follow our updates on{' '}
          <Link
            href="https://twitter.com"
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Twitter
          </Link>
          .
        </li>
        <li>
          Join the conversation on our{' '}
          <Link href="#" className="text-blue-600 hover:underline">
            community forum
          </Link>{' '}
          to share ideas and get support.
        </li>
        <li>
          Report bugs or request features on{' '}
          <Link
            href="https://github.com"
            className="text-blue-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </Link>
          .
        </li>
      </ul>
      <p>
        We aim to respond within two business days. Your patience is appreciated as our tiny team works
        through messages.
      </p>
    </main>
  );
}
