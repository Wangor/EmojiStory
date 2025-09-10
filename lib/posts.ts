import { createClient } from '@supabase/supabase-js';

export type Post = {
  slug: string;
  title: string;
  description: string;
  content: string;
  created_at: string;
};

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

export async function getAllPosts(): Promise<Post[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug, title, description, content, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Post[];
}

export async function getPostBySlug(slug: string): Promise<Post> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug, title, description, content, created_at')
    .eq('slug', slug)
    .single();
  if (error) throw error;
  return data as Post;
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
