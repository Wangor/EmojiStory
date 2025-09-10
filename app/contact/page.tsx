import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contact EmojiStory',
  description: 'Get in touch with the EmojiStory team.'
};

export default function ContactPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <p>
        Have questions, feedback, or just want to say hello? We would love to hear from you.
      </p>
      <p>
        Send us an email at <Link href="mailto:hello@emojistory.com" className="text-blue-600 hover:underline">hello@emojistory.com</Link>
        and we will get back to you.
      </p>
    </main>
  );
}
