import { getPostBySlug, getPostSlugs, markdownToHtml } from '../../../lib/posts';

export async function generateStaticParams() {
  const slugs = await getPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { metadata } = await getPostBySlug(params.slug);
  return { title: metadata.title, description: metadata.description };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const { metadata, content } = await getPostBySlug(params.slug);
  const html = markdownToHtml(content);
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <article className="prose">
        <h1 className="mb-4">{metadata.title}</h1>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>
    </main>
  );
}
