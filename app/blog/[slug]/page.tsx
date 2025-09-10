import { getPostBySlug, markdownToHtml } from '../../../lib/posts';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  return { title: post.title, description: post.description };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  const html = markdownToHtml(post.content);
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <article className="prose">
        <h1 className="mb-4">{post.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </main>
  );
}
