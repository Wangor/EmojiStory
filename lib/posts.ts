import fs from 'fs/promises';
import path from 'path';

export type PostMeta = {
  title: string;
  description: string;
  date: string;
};

export type Post = {
  slug: string;
  metadata: PostMeta;
  content: string;
};

const postsDir = path.join(process.cwd(), 'content', 'blog');

async function parseFile(filePath: string, slug: string): Promise<Post> {
  const file = await fs.readFile(filePath, 'utf8');
  const match = /^---\n([\s\S]+?)\n---\n([\s\S]*)/m.exec(file);
  let metadata: Record<string, string> = {};
  let content = file;
  if (match) {
    const yaml = match[1];
    content = match[2];
    yaml.split('\n').forEach((line) => {
      const [key, ...rest] = line.split(':');
      if (key) {
        metadata[key.trim()] = rest.join(':').trim().replace(/^"|"$/g, '');
      }
    });
  }
  return { slug, metadata: metadata as PostMeta, content };
}

export async function getPostSlugs() {
  const files = await fs.readdir(postsDir);
  return files.filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, ''));
}

export async function getPostBySlug(slug: string): Promise<Post> {
  const filePath = path.join(postsDir, `${slug}.md`);
  return parseFile(filePath, slug);
}

export async function getAllPosts(): Promise<Post[]> {
  const slugs = await getPostSlugs();
  const posts = await Promise.all(slugs.map((slug) => getPostBySlug(slug)));
  posts.sort(
    (a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime(),
  );
  return posts;
}

export function markdownToHtml(markdown: string): string {
  const html = markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(/\n\n/gim, '</p><p>')
    .replace(/\n/gim, '<br />');
  return `<p>${html}</p>`;
}
