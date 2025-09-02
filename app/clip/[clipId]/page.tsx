import { EmojiPlayer } from '../../../components/EmojiPlayer';
import { ClipComments } from '../../../components/ClipComments';
import { getClip } from '../../../lib/supabaseServer';

export async function generateMetadata({ params }: { params: { clipId: string } }) {
  const { clipId } = params;
  let clip: any = null;
  try {
    clip = await getClip(clipId);
  } catch {}
  const title = clip?.title || 'Emoji Clip';
  const description = clip?.description || 'An emoji clip';
  const image = `/api/og/${clipId}`;
  const thumbnail = `/api/thumbnail/${clipId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image, thumbnail],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    other: {
      thumbnail,
    },
  };
}

export default async function ClipPage({ params }: { params: { clipId: string } }) {
  const { clipId } = params;
  let clip: any = null;
  try {
    clip = await getClip(clipId);
  } catch {}

  if (!clip) {
    return <div className="p-8">Clip not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          {clip.title || clip.story?.slice(0, 50)}
        </h1>
        <div className="flex justify-center mb-8">
          <EmojiPlayer animation={clip.animation} width={1000} height={600} />
        </div>
        <ClipComments movieId={clip.id} movieOwnerId={clip.user_id} />
      </div>
    </div>
  );
}
