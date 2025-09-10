import type { Metadata } from 'next';
import { getClip } from '../../../lib/supabaseServer';
import MovieDetail from '../../../components/MovieDetail';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const movie = await getClip(params.id).catch(() => null);
  const title = movie?.title || 'Emoji Clip';
  const excerpt = movie?.description || movie?.story?.slice(0, 100) || undefined;
  const description = excerpt;
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
  try {
    const movie = await getClip(params.id);
    if (!movie) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Movie not found</h1>
            <p className="text-gray-600">The movie you&#39;re looking for doesn&#39;t exist.</p>
          </div>
        </div>
      );
    }
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: movie.title || 'Emoji Clip',
      description:
        movie.description || movie.story?.slice(0, 160) || '',
      thumbnailUrl: [`${baseUrl}/api/og/${movie.id}`],
      uploadDate: movie.publish_datetime || undefined,
      contentUrl: `${baseUrl}/api/video/${movie.id}`,
      embedUrl: `${baseUrl}/movies/${movie.id}`,
    };
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <MovieDetail movie={movie} />
      </>
    );
  } catch (error) {
    console.error('Error loading movie:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error loading movie</h1>
          <p className="text-gray-600">There was a problem loading the movie. Please try again later.</p>
        </div>
      </div>
    );
  }
}
