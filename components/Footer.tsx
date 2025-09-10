import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-gray-100 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between text-sm text-gray-600">
        <p className="mb-4 sm:mb-0">&copy; {new Date().getFullYear()} EmojiStory</p>
        <div className="flex gap-4">
          <Link href="/about" className="hover:text-gray-900">About</Link>
          <Link href="/contact" className="hover:text-gray-900">Contact</Link>
          <Link href="/privacy" className="hover:text-gray-900">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-900">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
