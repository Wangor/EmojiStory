'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';

// Data
import rawEmojiData from 'emojibase-data/en/compact.json' assert { type: 'json' };
import rawGroups from 'emojibase-data/meta/groups.json' assert { type: 'json' };

// Normalize JSON (some builds wrap in { default: ... })
const EMOJI_DATA_RAW: any[] = Array.isArray(rawEmojiData)
    ? (rawEmojiData as any[])
    : ((rawEmojiData as any)?.default ?? []);

// ✅ Fallback names if groups.json fails/changes
const FALLBACK_GROUP_NAMES = [
    'Smileys & Emotion',
    'People & Body',
    'Component',
    'Animals & Nature',
    'Food & Drink',
    'Travel & Places',
    'Activities',
    'Objects',
    'Symbols',
    'Flags',
];

// Try to resolve groups from meta; if empty, use fallback
const GROUP_NAMES_META: string[] = Array.isArray(rawGroups)
    ? (rawGroups as string[])
    : ((rawGroups as any)?.default ?? []);
const GROUPS: string[] =
    (GROUP_NAMES_META && GROUP_NAMES_META.length > 0) ? GROUP_NAMES_META : FALLBACK_GROUP_NAMES;

// Hide “Component” tab but keep items in “All” and search
const HIDDEN_GROUPS = new Set<string>(['Component']);

type EmojiItem = {
    emoji: string;
    name: string;
    category: string; // group name
    keywords: string[];
};

type EmojiCatalogueProps = {
    onSelectEmoji: (emoji: string) => void;
    onClose: () => void;
    isOpen: boolean;
};

const normalize = (s: string) => s.normalize('NFKD').toLowerCase();
const toCategory = (idx: number) => GROUPS[idx] ?? 'Other';

export default function EmojiCatalogue({ onSelectEmoji, onClose, isOpen }: EmojiCatalogueProps) {
    const [allEmojis, setAllEmojis] = useState<EmojiItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');

    // Build the emoji list once when opened
    useEffect(() => {
        if (!isOpen || allEmojis || error) return;

        try {
            const mapped: EmojiItem[] = [];

            (EMOJI_DATA_RAW as any[]).forEach((e) => {
                const native = e.emoji ?? e.unicode;
                const label = e.label ?? e.name ?? 'emoji';
                const category = typeof e.group === 'number' ? toCategory(e.group) : 'Other';
                const tags = Array.isArray(e.tags) ? e.tags : [];

                if (native) {
                    mapped.push({ emoji: native, name: label, category, keywords: tags });
                }
                if (Array.isArray(e.skins)) {
                    e.skins.forEach((s: any) => {
                        const sNative = s.emoji ?? s.unicode;
                        if (sNative) {
                            mapped.push({ emoji: sNative, name: label, category, keywords: tags });
                        }
                    });
                }
            });

            if (mapped.length === 0) {
                setError('Emoji dataset loaded but is empty.');
            } else {
                setAllEmojis(mapped);
            }
        } catch (err: any) {
            console.error(err);
            setError(err?.message ?? 'Failed to load emoji data.');
        }
    }, [isOpen, allEmojis, error]);

    // Categories from resolved GROUPS (in official order), skip hidden
    const categories = useMemo(() => {
        const visible = GROUPS.filter((g) => !HIDDEN_GROUPS.has(g));
        return ['All', ...visible];
    }, []);

    // Debounced search
    const [debounced, setDebounced] = useState('');
    useEffect(() => {
        const id = setTimeout(() => setDebounced(searchTerm), 150);
        return () => clearTimeout(id);
    }, [searchTerm]);

    const filteredEmojis = useMemo(() => {
        if (!allEmojis) return [];

        let list = allEmojis;

        if (selectedCategory !== 'All') {
            list = list.filter((e) => e.category === selectedCategory);
        }

        const q = normalize(debounced.trim());
        if (q) {
            list = list.filter(
                (e) =>
                    normalize(e.name).includes(q) ||
                    e.keywords?.some((k) => normalize(k).includes(q)) ||
                    e.emoji.includes(q)
            );
        }

        return list;
    }, [allEmojis, selectedCategory, debounced]);

    const handleEmojiClick = (emoji: string) => {
        onSelectEmoji(emoji);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">Emoji Catalogue</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <MagnifyingGlass size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Search emojis by name or keyword…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                aria-label="Clear search"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Categories */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex flex-wrap gap-2">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                                    selectedCategory === category
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Emoji Grid */}
                <div className="flex-1 overflow-y-auto p-4">
                    {error ? (
                        <div className="h-full flex items-center justify-center text-red-600">
                            Failed to load emojis: {error}
                        </div>
                    ) : !allEmojis ? (
                        <div className="h-full flex items-center justify-center text-gray-500">Loading full emoji set…</div>
                    ) : filteredEmojis.length > 0 ? (
                        <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2">
                            {filteredEmojis.map((e, idx) => (
                                <button
                                    key={`${e.emoji}-${idx}`}
                                    onClick={() => handleEmojiClick(e.emoji)}
                                    className="aspect-square flex items-center justify-center text-2xl hover:bg-gray-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-blue-50"
                                    title={e.name}
                                    aria-label={e.name}
                                >
                                    {e.emoji}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <div className="text-6xl mb-4">😔</div>
                            <p className="text-lg font-medium mb-2">No emojis found</p>
                            <p className="text-sm">Try a different search term or category</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredEmojis.length}{allEmojis ? ` of ${allEmojis.length}` : ''} emojis
                {selectedCategory !== 'All' && ` in ${selectedCategory}`}
            </span>
                        <span>Click any emoji to add it to your scene</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
