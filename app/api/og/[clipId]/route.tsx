import { ImageResponse } from 'next/server';
import { getClip } from '../../../../lib/supabaseServer';

export const runtime = 'edge';

export async function GET(request: Request, { params }: { params: { clipId: string } }) {
  const { clipId } = params;
  let title = 'Emoji Clip';
  try {
    const clip = await getClip(clipId);
    if (clip?.title) title = clip.title;
  } catch {}

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fff',
          fontSize: 64,
          fontWeight: 700,
        }}
      >
        {title}
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
