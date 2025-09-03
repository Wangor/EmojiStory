'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, signOut, getProfile } from '../lib/supabaseClient';
import {
    FilmSlateIcon,
    SignOut,
    User,
    UserPlus,
    UserCircle,
    MagnifyingGlass,
    CaretDown,
    List,
} from '@phosphor-icons/react';

export function Navbar() {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        async function loadUserData() {
            const userData = await getUser();
            setUser(userData);
            if (userData) {
                try {
                    const profileData = await getProfile();
                    setProfile(profileData);
                } catch (error) {
                    console.log('No profile found');
                }
            }
        }
        loadUserData();
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    async function handleSignOut() {
        await signOut();
        setUser(null);
        setProfile(null);
        setIsDropdownOpen(false);
        setIsMobileMenuOpen(false);
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        const q = search.trim();
        if (q.length > 0) {
            router.push(`/search?q=${encodeURIComponent(q)}`);
            setSearch('');
        }
    }

    function getAvatarContent() {
        if (profile?.avatar_url) {
            return (
                <div className="relative w-8 h-8 rounded-full overflow-hidden">
                    <Image
                        src={profile.avatar_url}
                        alt="User Avatar"
                        fill
                        className="object-cover"
                        sizes="32px"
                    />
                </div>
            );
        }

        const displayName = profile?.display_name || user?.email;
        if (displayName) {
            const initial = displayName.charAt(0).toUpperCase();
            return (
                <div className="w-8 h-8 rounded-full bg-orange-200/20 flex items-center justify-center text-black font-medium">
                    {initial}
                </div>
            );
        }

        return (
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                <User size={16} weight="bold" />
            </div>
        );
    }

    return (
        <nav className="bg-gradient-to-r from-brand-600 to-brand-700 shadow-brand-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link
                            href="/"
                            className="flex items-center gap-3 text-white font-bold text-xl hover:text-gray-200 transition-colors duration-200"
                        >
                            <div className="relative w-60 h-36">
                                <Image
                                    src="/logo.png"
                                    alt="Emojiclips Logo"
                                    fill
                                    className="object-contain"
                                    sizes="200px"
                                    priority
                                />
                            </div>
                        </Link>
                    </div>

                    {/* Search Bar - Hidden on mobile */}
                    <div className="hidden md:flex flex-1 justify-center px-4 max-w-md mx-4">
                        <form onSubmit={handleSearch} className="w-full">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search movies..."
                                    className="w-full rounded-md py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 border border-gray-300"
                                />
                                <button
                                    type="submit"
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-600 transition-colors"
                                >
                                    <MagnifyingGlass size={18} weight="bold" />
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link
                            href="/movies"
                            className="flex items-center gap-2 text-black hover:text-gray-200 transition-colors duration-200 px-3 py-2 rounded-md hover:bg-white/10"
                        >
                            <FilmSlateIcon size={18} weight="fill" />
                            <span>Movies</span>
                        </Link>

                        {user ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="flex items-center gap-2 text-black hover:text-gray-200 transition-colors duration-200 px-3 py-2 rounded-md hover:bg-white/10"
                                >
                                    {getAvatarContent()}
                                    <CaretDown size={16} weight="bold" />
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                                        <Link
                                            href="/profile"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors duration-200"
                                        >
                                            <User size={16} weight="bold" />
                                            Profile
                                        </Link>
                                        <Link
                                            href="/mychannel"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors duration-200"
                                        >
                                            <UserCircle size={16} weight="bold" />
                                            My Channel
                                        </Link>
                                        <Link
                                            href="/mymovies"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors duration-200"
                                        >
                                            <FilmSlateIcon size={16} weight="fill" />
                                            My Movies
                                        </Link>
                                        <hr className="my-1 border-gray-200" />
                                        <button
                                            onClick={handleSignOut}
                                            className="flex items-center gap-3 px-4 py-2 text-accent-700 hover:bg-accent-50 transition-colors duration-200 w-full text-left"
                                        >
                                            <SignOut size={16} weight="bold" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
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
                                    className="flex items-center gap-2 bg-white text-brand-600 hover:bg-gray-100 transition-colors duration-200 px-4 py-2 rounded-md font-medium shadow-sm"
                                >
                                    <UserPlus size={18} weight="bold" />
                                    <span>Register</span>
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="text-white hover:text-gray-200 p-2 rounded-md hover:bg-white/10 transition-colors"
                        >
                            <List size={24} weight="bold" />
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden bg-brand-700/95 backdrop-blur-sm border-t border-brand-500/30">
                        {/* Mobile Search */}
                        <div className="px-4 py-3 border-b border-brand-500/30">
                            <form onSubmit={handleSearch}>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search movies..."
                                        className="w-full rounded-md py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 border border-gray-300"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-600 transition-colors"
                                    >
                                        <MagnifyingGlass size={18} weight="bold" />
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="px-2 py-3 space-y-1">
                            <Link
                                href="/movies"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="flex items-center gap-3 text-white hover:bg-white/10 px-3 py-2 rounded-md transition-colors duration-200"
                            >
                                <FilmSlateIcon size={20} weight="fill" />
                                Movies
                            </Link>

                            {user ? (
                                <>
                                    <div className="flex items-center gap-3 px-3 py-2 text-white border-b border-brand-500/30 pb-3 mb-3">
                                        {getAvatarContent()}
                                        <span className="font-medium">
                      {profile?.display_name || user?.email || 'User'}
                    </span>
                                    </div>
                                    <Link
                                        href="/profile"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-3 text-white hover:bg-white/10 px-3 py-2 rounded-md transition-colors duration-200 ml-6"
                                    >
                                        <User size={20} weight="bold" />
                                        Profile
                                    </Link>
                                    <Link
                                        href="/mychannel"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-3 text-white hover:bg-white/10 px-3 py-2 rounded-md transition-colors duration-200 ml-6"
                                    >
                                        <UserCircle size={20} weight="bold" />
                                        My Channel
                                    </Link>
                                    <Link
                                        href="/mymovies"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-3 text-white hover:bg-white/10 px-3 py-2 rounded-md transition-colors duration-200 ml-6"
                                    >
                                        <FilmSlateIcon size={20} weight="fill" />
                                        My Movies
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center gap-3 text-accent-300 hover:bg-accent-500/20 px-3 py-2 rounded-md transition-colors duration-200 ml-6 w-full text-left"
                                    >
                                        <SignOut size={20} weight="bold" />
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href="/auth/login"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-3 text-white hover:bg-white/10 px-3 py-2 rounded-md transition-colors duration-200"
                                    >
                                        <User size={20} weight="bold" />
                                        Login
                                    </Link>
                                    <Link
                                        href="/auth/register"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className="flex items-center gap-3 bg-white text-brand-600 hover:bg-gray-100 px-3 py-2 rounded-md font-medium mx-3 transition-colors duration-200 shadow-sm"
                                    >
                                        <UserPlus size={20} weight="bold" />
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
