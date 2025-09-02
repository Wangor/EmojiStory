'use client';

import { useEffect, useState } from 'react';
import { Camera, User, FileText, Check,  WarningCircleIcon} from '@phosphor-icons/react';
import { getChannel, upsertChannel } from '../../lib/supabaseClient';

export default function ChannelPage() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [picture, setPicture] = useState<File | null>(null);
    const [pictureUrl, setPictureUrl] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getChannel()
            .then((channel) => {
                if (channel) {
                    setName(channel.name || '');
                    setDescription(channel.description || '');
                    if (channel.picture_url) setPictureUrl(channel.picture_url);
                }
            })
            .catch((e) => setError(e.message));
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            setError(null); setMessage(null);
            const data = await upsertChannel({ name, description, picture: picture || undefined });
            if (data.picture_url) setPictureUrl(data.picture_url);
            setMessage('Channel saved successfully');
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
            <div className="max-w-2xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl shadow-lg mb-4">
                        <User weight="bold" size={28} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Channel Settings</h1>
                    <p className="text-gray-600">Customize your channel profile and information</p>
                </div>

                {/* Main Form Card */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {/* Status Messages */}
                        {error && (
                            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                                <WarningCircleIcon size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-red-800 text-sm">Error</h3>
                                    <p className="text-red-700 text-sm mt-1">{error}</p>
                                </div>
                            </div>
                        )}

                        {message && (
                            <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                                <Check size={20} className="text-green-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-green-800 text-sm">Success</h3>
                                    <p className="text-green-700 text-sm mt-1">{message}</p>
                                </div>
                            </div>
                        )}

                        {/* Channel Picture */}
                        <div className="text-center">
                            <div className="relative inline-block">
                                {pictureUrl ? (
                                    <img
                                        src={pictureUrl}
                                        alt="Channel"
                                        className="w-24 h-24 object-cover rounded-full border-4 border-white shadow-lg"
                                    />
                                ) : (
                                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                                        <Camera size={24} className="text-gray-500" />
                                    </div>
                                )}
                                <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors duration-200">
                                    <Camera size={16} className="text-white" />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setPicture(e.target.files?.[0] || null)}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <p className="text-sm text-gray-500 mt-3">Click the camera icon to upload a channel picture</p>
                        </div>

                        {/* Channel Name */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                                <User size={16} />
                                Channel Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                placeholder="Enter your channel name"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
                                <FileText size={16} />
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                                placeholder="Tell viewers about your channel..."
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white focus:bg-white resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-2">
                                {description.length}/500 characters
                            </p>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Check size={20} />
                                        Save Channel
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Tips Card */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                        <User size={16} />
                        Channel Tips
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-2">
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                            Choose a memorable channel name that reflects your content
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                            Write a clear description to help viewers understand your channel
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                            Upload a high-quality profile picture for better recognition
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
