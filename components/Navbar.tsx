'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUser, signOut } from '../lib/supabaseClient';

export function Navbar() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  async function handleSignOut() {
    await signOut();
    setUser(null);
  }

  return (
    <nav className="bg-white shadow p-4 flex justify-between">
      <Link href="/" className="font-bold">Emoji Movie Studio</Link>
      <div className="flex gap-4 items-center">
        {user ? (
          <>
            <Link href="/movies" className="underline">My Movies</Link>
            <button onClick={handleSignOut} className="text-sm text-red-600">Logout</button>
          </>
        ) : (
          <>
            <Link href="/auth/login" className="underline">Login</Link>
            <Link href="/auth/register" className="underline">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

