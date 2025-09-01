'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getUser, signOut } from '../lib/supabaseClient';
import { FilmSlateIcon, SignOut, User, UserPlus } from '@phosphor-icons/react';

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
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/"
            className="text-white font-bold text-xl hover:text-gray-200 transition-colors duration-200"
          >
            🎬 Emoji Movie Studio
          </Link>

          <div className="flex gap-6 items-center">
            {user ? (
              <>
                <Link
                  href="/movies"
                  className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors duration-200 px-3 py-2 rounded-md hover:bg-white/10"
                >
                  <FilmSlateIcon size={18} weight="fill" />
                  <span>My Movies</span>
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-white hover:text-red-200 transition-colors duration-200 px-3 py-2 rounded-md hover:bg-red-500/20 border border-transparent hover:border-red-300/30"
                >
                  <SignOut size={18} weight="bold" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors duration-200 px-3 py-2 rounded-md hover:bg-white/10"
                >
                  <User size={18} weight="bold" />
                  <span>Login</span>
                </Link>
                <Link
                  href="/auth/register"
                  className="flex items-center gap-2 bg-white text-purple-600 hover:bg-gray-100 transition-colors duration-200 px-4 py-2 rounded-md font-medium"
                >
                  <UserPlus size={18} weight="bold" />
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
