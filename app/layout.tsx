import type { ReactNode } from 'react';
import Head from 'next/head';
import '../tailwind/output.css';
import { Navbar } from '../components/Navbar';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <Head>
        <title>Emojiclips.com - Tell your story with emojis</title>
        <meta name="description" content="Turn stories into emoji mini-movies" />
        <meta property="og:title" content="Emoji Movie MVP" />
        <meta property="og:description" content="Turn stories into emoji mini-movies" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
