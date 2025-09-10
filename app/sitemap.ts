import { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const { data: movies } = await supabase
    .from('movies')
    .select('id, updated_at, publish_datetime')
    .not('publish_datetime', 'is', null)
    .lte('publish_datetime', new Date().toISOString());

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('slug, updated_at');

  const routes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/` },
    { url: `${baseUrl}/clip` },
    { url: `${baseUrl}/movies` },
    { url: `${baseUrl}/blog` },
  ];

  return [
    ...routes,
    ...(movies?.map((m) => ({
      url: `${baseUrl}/movies/${m.id}`,
      lastModified: m.updated_at || m.publish_datetime || new Date().toISOString(),
    })) ?? []),
    ...(posts?.map((p) => ({
      url: `${baseUrl}/blog/${p.slug}`,
      lastModified: p.updated_at || new Date().toISOString(),
    })) ?? []),
  ];
}
