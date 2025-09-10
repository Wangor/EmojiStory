'use client';

import { useEffect, useState, FormEvent } from 'react';
import { getAllPosts, Post } from '../../../lib/posts';
import { supabase, isAdmin } from '../../../lib/supabaseClient';

export default function BlogAdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
  });

  useEffect(() => {
    async function init() {
      const admin = await isAdmin();
      setAuthorized(admin);
      if (admin) {
        const all = await getAllPosts();
        setPosts(all);
      }
    }
    init();
  }, []);

  function startEdit(post: Post) {
    setEditingId(post.id);
    setForm({
      title: post.title,
      slug: post.slug,
      description: post.description,
      content: post.content,
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm({ title: '', slug: '', description: '', content: '' });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = {
      title: form.title,
      slug: form.slug,
      description: form.description,
      content: form.content,
    };
    if (editingId) {
      await supabase.from('blog_posts').update(payload).eq('id', editingId);
    } else {
      await supabase.from('blog_posts').insert(payload);
    }
    resetForm();
    const all = await getAllPosts();
    setPosts(all);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this post?')) return;
    await supabase.from('blog_posts').delete().eq('id', id);
    const all = await getAllPosts();
    setPosts(all);
  }

  if (authorized === null) {
    return <div className="p-6 max-w-2xl mx-auto">Checking permissions...</div>;
  }

  if (!authorized) {
    return <div className="p-6 max-w-2xl mx-auto">You are not authorized to view this page.</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Blog Admin</h1>
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <input
          type="text"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full border p-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="Slug"
          value={form.slug}
          onChange={(e) => setForm({ ...form, slug: e.target.value })}
          className="w-full border p-2 rounded"
          required
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="w-full border p-2 rounded"
          rows={2}
        />
        <textarea
          placeholder="Content"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          className="w-full border p-2 rounded"
          rows={6}
          required
        />
        <div className="flex gap-2">
          <button type="submit" className="px-4 py-2 bg-brand-600 text-white rounded">
            {editingId ? 'Update' : 'Create'} Post
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.id} className="border rounded p-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="font-semibold">{post.title}</h2>
                <p className="text-sm text-gray-500">/{post.slug}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(post)}
                  className="text-blue-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

