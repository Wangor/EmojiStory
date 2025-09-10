import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service - EmojiStory',
  description: 'Review the rules and guidelines for using EmojiStory.'
};

export default function TermsPage() {
  return (
    <main className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p>
        By using EmojiStory, you agree to abide by our terms and policies designed to keep the community safe and
        enjoyable. Please read the rules below carefully.
      </p>
      <h2 className="text-2xl font-semibold">Your Responsibilities</h2>
      <p>
        You are responsible for the content you create and share. Please be respectful of others and follow all
        applicable laws.
      </p>
      <ul className="list-disc list-inside">
        <li>No illegal or harmful content.</li>
        <li>Respect intellectual property rights and only upload material you have permission to use.</li>
        <li>Do not attempt to disrupt or abuse the service.</li>
      </ul>
      <h2 className="text-2xl font-semibold">Content Ownership</h2>
      <p>
        You retain ownership of the stories and emoji movies you create. By posting them on EmojiStory, you grant us a
        non-exclusive license to host and display your content so that the service functions as intended.
      </p>
      <h2 className="text-2xl font-semibold">Changes to These Terms</h2>
      <p>
        We may update these terms from time to time. When we do, we will revise the &quot;last updated&quot; date and, if
        the changes are significant, provide a notice on the site. Continued use of EmojiStory after changes take effect
        constitutes acceptance of the new terms.
      </p>
      <h2 className="text-2xl font-semibold">Contact</h2>
      <p>
        If you have any questions about these terms, please email
        <Link href="mailto:legal@emojistory.com" className="text-blue-600 hover:underline"> legal@emojistory.com</Link>.
      </p>
    </main>
  );
}
