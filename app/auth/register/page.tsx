'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp, updateProfile, upsertChannel } from '../../../lib/supabaseClient';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [channelName, setChannelName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await signUp(email, password);
      await updateProfile({ display_name: displayName });
      await upsertChannel({ name: channelName, description: '' });
      router.push('/mymovies');
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4 text-center">Register</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Display Name"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          className="p-2 border rounded"
          required
        />
        <input
          type="text"
          placeholder="Channel Name"
          value={channelName}
          onChange={e => setChannelName(e.target.value)}
          className="p-2 border rounded"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          className="p-2 border rounded"
          required
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <div className="flex justify-center gap-2">
          <button type="submit" className="bg-orange-400 text-white py-2 px-4 rounded">Register</button>
          <Link
            href="/auth/login"
            className="py-2 px-4 border border-orange-400 text-orange-400 rounded hover:bg-blue-50"
          >
            Login
          </Link>
        </div>
      </form>
      <p className="text-center text-xs text-gray-600 mt-4">
        By registering, you agree to our{' '}
        <Link href="/guidelines" className="text-orange-400 hover:underline">
          Content Guidelines
        </Link>
        .
      </p>
    </div>
  );
}

