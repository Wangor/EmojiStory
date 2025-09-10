import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - EmojiStory',
  description: 'Read about how EmojiStory respects and protects your privacy.'
};

export default function PrivacyPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p>
        We value your privacy and are committed to safeguarding your personal information.
      </p>
      <p>
        EmojiStory only collects the data necessary to provide our service and never sells your information to third parties.
      </p>
    </main>
  );
}
