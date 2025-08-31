import type { ReactNode } from 'react';

export const metadata = {
  title: 'Emoji Movie MVP',
  description: 'Turn stories into emoji mini-movies'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial' }}>
        {children}
      </body>
    </html>
  );
}
