'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '../../../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await signIn(email, password);
      router.push('/mymovies');
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        <button type="submit" className="bg-orange-400 text-white py-2 rounded">Login</button>
      </form>
      <p className="text-center text-xs text-gray-600 mt-4">
        Please review our{' '}
        <Link href="/guidelines" className="text-orange-400 hover:underline">
          Content Guidelines
        </Link>
        .
      </p>
      <p className="text-center text-sm mt-4">
        Don&apos;t have an account?{' '}
        <Link href="/auth/register" className="text-orange-400 hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}

