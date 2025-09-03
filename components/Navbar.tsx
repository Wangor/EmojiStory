'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, signOut } from '../lib/supabaseClient';
import {
  FilmSlateIcon,
  SignOut,
  User,
  UserPlus,
  UserCircle,
  MagnifyingGlass,
} from '@phosphor-icons/react';

export function Navbar() {
  const [user, setUser] = useState<any>(null);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    getUser().then(setUser);
  }, []);

  async function handleSignOut() {
    await signOut();
    setUser(null);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = search.trim();
    if (q.length > 0) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
      setSearch('');
    }
  }

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          <Link
            href="/"
            className="text-white font-bold text-xl hover:text-gray-200 transition-colors duration-200"
          >
            🎬 Emojiclips.com - Tell your story with emojis
          </Link>

          <div className="flex-1 flex justify-center px-4">
            <form onSubmit={handleSearch} className="w-full max-w-md">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search movies..."
                  className="w-full rounded-md py-2 pl-4 pr-10 text-sm focus:outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <MagnifyingGlass size={18} weight="bold" />
                </button>
              </div>
            </form>
          </div>

          <div className="flex gap-6 items-center ml-4">
            <Link
              href="/movies"
              className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors duration-200 px-3 py-2 rounded-md hover:bg-white/10"
            >
              <FilmSlateIcon size={18} weight="fill" />
              <span>Movies</span>
            </Link>
            {user ? (
              <>
                <Link
                  href="/mychannel"
                  prefetch={false}
                  className="flex items-center gap-2 text-white hover:text-gray-200 transition-colors duration-200 px-3 py-2 rounded-md hover:bg-white/10"
                >
                  <UserCircle size={18} weight="bold" />
                  <span>My Channel</span>
                </Link>
                <Link
                  href="/mymovies"
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
