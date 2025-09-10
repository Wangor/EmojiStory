"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getComments, postComment, deleteComment, getUser } from '../lib/supabaseClient';
import ReportModal from './ReportModal';

interface Comment {
  id: string;
  movie_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username?: string;
}

export function ClipComments({ movieId, movieOwnerId }: { movieId: string; movieOwnerId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [user, setUser] = useState<any>(null);
  const [reportId, setReportId] = useState<string | null>(null);

  useEffect(() => {
    getComments(movieId).then(setComments).catch(console.error);
    getUser().then(setUser);
  }, [movieId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      const comment = await postComment(movieId, text.trim());
      setComments((c) => [...c, comment]);
      setText('');
    } catch (err) {
      console.error(err);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteComment(id);
      setComments((c) => c.filter((cm) => cm.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">Comments</h2>
      <p className="text-sm text-gray-600 mb-4">
        Please follow our{' '}
        <Link href="/guidelines" className="text-orange-400 hover:underline">
          Content Guidelines
        </Link>
        .
      </p>
      <ul className="space-y-4 mb-6">
        {comments.map((c) => (
          <li key={c.id} className="p-4 bg-white border border-gray-200 rounded-lg">
            <p className="text-gray-700 text-sm whitespace-pre-wrap">
              <Link
                href={`/users/${c.user_id}`}
                className="font-medium hover:underline"
              >
                {c.username ?? 'Unknown'}
              </Link>
              : {c.content}
            </p>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(c.created_at).toLocaleString()}
            </div>
            {user && (
              <div className="mt-2 flex gap-4 text-xs">
                {(c.user_id === user.id || user.id === movieOwnerId) && (
                  <button
                    onClick={() => remove(c.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                )}
                <button
                  onClick={() => setReportId(c.id)}
                  className="text-orange-600 hover:underline"
                >
                  Report
                </button>
              </div>
            )}
          </li>
        ))}
        {comments.length === 0 && (
          <li className="text-gray-500">No comments yet</li>
        )}
      </ul>
      {user && (
        <form onSubmit={submit} className="flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg"
            placeholder="Add a comment..."
          />
          <button
            type="submit"
            className="px-4 py-2 bg-orange-400 text-white rounded-lg"
          >
            Post
          </button>
        </form>
      )}
      {user && reportId && (
        <ReportModal
          isOpen={!!reportId}
          targetId={reportId}
          targetType="comment"
          reporterId={user.id}
          onClose={() => setReportId(null)}
        />
      )}
    </div>
  );
}

