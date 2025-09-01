'use client';

import { useEffect, useState } from 'react';
import { getChannel, upsertChannel } from '../../lib/supabaseClient';

export default function ChannelPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [picture, setPicture] = useState<File | null>(null);
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    try {
      setError(null); setMessage(null);
      const data = await upsertChannel({ name, description, picture: picture || undefined });
      if (data.picture_url) setPictureUrl(data.picture_url);
      setMessage('Channel saved');
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 py-8">
      <div className="max-w-xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-6">My Channel</h1>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-sm">
          {error && <p className="text-red-600">{error}</p>}
          {message && <p className="text-green-600">{message}</p>}
          <div>
            <label className="block font-medium mb-1">Channel Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-md p-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Channel Picture</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setPicture(e.target.files?.[0] || null)}
            />
            {pictureUrl && (
              <img src={pictureUrl} alt="Channel" className="mt-2 w-32 h-32 object-cover rounded-full" />
            )}
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}

