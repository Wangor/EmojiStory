import type { Metadata } from 'next';
import { getClip } from '../../../lib/supabaseServer';
import { MovieDetail } from '../../../components/MovieDetail';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const movie = await getClip(params.id).catch(() => null);
  const title = movie?.title || 'Emoji Clip';
  const description = movie?.description || movie?.story?.slice(0, 100) || undefined;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`${baseUrl}/api/og/${params.id}`],
    },
  };
}

export default async function MoviePage({ params }: Props) {
  const movie = await getClip(params.id);
  return <MovieDetail movie={movie} />;
}
