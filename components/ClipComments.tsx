"use client";

import { useEffect, useState } from 'react';
import { getComments, postComment, deleteComment, getUser } from '../lib/supabaseClient';

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
      <ul className="space-y-4 mb-6">
        {comments.map((c) => (
          <li key={c.id} className="p-4 bg-white border border-gray-200 rounded-lg">
            <p className="text-gray-700 text-sm whitespace-pre-wrap">
              <span className="font-medium">{c.username ?? 'Unknown'}:</span> {c.content}
            </p>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(c.created_at).toLocaleString()}
            </div>
            {user && (c.user_id === user.id || user.id === movieOwnerId) && (
              <button
                onClick={() => remove(c.id)}
                className="mt-2 text-xs text-red-600 hover:underline"
              >
                Delete
              </button>
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Post
          </button>
        </form>
      )}
    </div>
  );
}

