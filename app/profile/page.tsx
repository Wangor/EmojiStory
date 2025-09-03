'use client';

import { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../../lib/supabaseClient';

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProfile()
      .then((profile) => {
        if (profile) {
          setDisplayName(profile.display_name || '');
          setAvatarUrl(profile.avatar_url || '');
        }
      })
      .catch((e) => setError(e.message));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await updateProfile({ display_name: displayName, avatar_url: avatarUrl });
      setMessage('Profile updated');
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {message && <p className="text-green-600 mb-4">{message}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Display Name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Avatar URL"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          className="p-2 border rounded"
        />
        <button type="submit" className="bg-blue-600 text-white py-2 rounded">
          Save
        </button>
      </form>
    </div>
  );
}

