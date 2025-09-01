import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Emoji Movie MVP',
  description: 'Turn stories into emoji mini-movies',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
