import Link from 'next/link';
import { getAllPosts } from '../../lib/posts';

export const metadata = {
  title: 'Blog',
};

export const dynamic = 'force-dynamic';

export default async function BlogPage() {
  const posts = await getAllPosts();
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Blog</h1>
      <ul className="space-y-6">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/blog/${post.slug}`}
              className="text-2xl font-semibold text-brand-600 hover:underline"
            >
              {post.title}
            </Link>
            <p className="text-gray-600">{post.description}</p>
            <p className="text-sm text-gray-500">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
