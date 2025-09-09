import type { ReactNode } from 'react';
import '../tailwind/output.css';
import { Navbar } from '../components/Navbar';

export const metadata = {
  title: 'Emojiclips.com - Tell your story with emojis',
  description: 'Turn stories into emoji mini-movies',
  openGraph: {
    title: 'Emoji Movie MVP',
    description: 'Turn stories into emoji mini-movies',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
    <head>
        <meta name="google-adsense-account" content="ca-pub-6062140948853666" />
    </head>

    <body className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
