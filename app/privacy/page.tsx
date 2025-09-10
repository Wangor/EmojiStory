import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - EmojiClips',
  description: 'Read about how EmojiClips respects and protects your privacy.'
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p>
        We value your privacy and are committed to safeguarding your personal information.
        This policy outlines what data we collect, how we use it, and the choices you have.
      </p>
      <h2 className="text-2xl font-semibold">Information We Collect</h2>
      <p>
        When you create an account or use EmojiClips, we may collect basic information such as your
        email address and usage statistics. This data helps us maintain your account and improve the
        service.
      </p>
      <h2 className="text-2xl font-semibold">How We Use Information</h2>
      <p>
        The information we gather allows us to operate, maintain, and enhance EmojiClips. We do not
        sell your data to third parties and only share information when necessary to provide the service
        or comply with legal obligations.
      </p>
      <h2 className="text-2xl font-semibold">Cookies and Tracking</h2>
      <p>
        We may use cookies to remember your preferences and keep you logged in. You can disable cookies
        in your browser settings, but some features of EmojiClips may not work properly without them.
      </p>
      <h2 className="text-2xl font-semibold">Data Security</h2>
      <p>
        We implement industry-standard measures to protect your information. However, no method of
        transmission or storage is completely secure, so we cannot guarantee absolute security.
      </p>
      <h2 className="text-2xl font-semibold">Contact</h2>
      <p>
        If you have questions about this policy, email us at{' '}
        <Link href="mailto:hello@emojiclips.com" className="text-blue-600 hover:underline">
          hello@emojiclips.com
        </Link>
        .
      </p>
    </main>
  );
}
