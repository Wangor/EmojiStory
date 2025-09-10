import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - EmojiStory',
  description: 'Review the rules and guidelines for using EmojiStory.'
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p>
        By using EmojiStory, you agree to abide by our terms and policies designed to keep the community safe and enjoyable.
      </p>
      <p>
        Please make sure you understand these terms before creating or sharing content on our platform.
      </p>
    </main>
  );
}
