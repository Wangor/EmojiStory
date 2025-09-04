import { NextRequest, NextResponse } from 'next/server';
import { exportVideo } from '../../../lib/exportVideo';

export async function POST(req: NextRequest) {
  try {
    const { animation, options } = await req.json();
    const buffer = await exportVideo(animation, options || { width: 900, height: 500, fps: 30 });
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="movie.mp4"'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Export failed' }, { status: 500 });
  }
}
