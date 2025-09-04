import { NextResponse } from 'next/server';
import { exportVideo, ExportOptions } from '../../../lib/exportVideo';
import type { Animation } from '../../../components/AnimationTypes';

export async function POST(req: Request) {
  try {
    const { animation, options } = (await req.json()) as { animation: Animation; options: ExportOptions };
    const data = await exportVideo(animation, options);
    return new NextResponse(data, {
      headers: {
        'Content-Type': 'video/mp4'
      }
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Export failed' }, { status: 500 });
  }
}
