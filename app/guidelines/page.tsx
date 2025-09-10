import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Content Guidelines - EmojiStory',
  description: 'Learn about allowed content, reporting processes, and moderation actions.'
};

export default function GuidelinesPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Content Guidelines</h1>
      <p>EmojiStory is a place for creativity. To keep it welcoming for everyone, please follow these rules.</p>

      <h2 className="text-2xl font-semibold">Allowed Content</h2>
      <ul className="list-disc list-inside">
        <li>Be respectful—no harassment, hate speech, or bullying.</li>
        <li>Keep it family-friendly. Avoid explicit, violent, or hateful imagery.</li>
        <li>No spam, scams, or deceptive practices.</li>
      </ul>

      <h2 className="text-2xl font-semibold">Reporting Content</h2>
      <p>
        If you see a movie or comment that violates these guidelines, use the in-app report option or email
        <Link href="mailto:hello@emojiclips.com" className="text-blue-600 hover:underline"> hello@emojiclips.com</Link>
        or use our <Link href="/contact" className="text-blue-600 hover:underline">contact form</Link>.
      </p>

      <h2 className="text-2xl font-semibold">Moderation Actions</h2>
      <p>
        We may remove content, issue warnings, or suspend accounts that breach these rules. Severe or repeated violations
        can lead to permanent bans.
      </p>

      <p>
        For additional details, see our{' '}
        <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>.
      </p>
    </main>
  );
}

