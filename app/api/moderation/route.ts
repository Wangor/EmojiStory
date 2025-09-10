import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getClient } from './client';

const ReportSchema = z.object({
  targetId: z.string(),
  targetType: z.enum(['movie', 'comment']),
  reason: z.string().min(1),
  details: z.string().optional(),
});

/**
 * Accepts content moderation reports from users.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = getClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await req.json();
    const { targetId, targetType, reason, details } = ReportSchema.parse(body);

    const { error } = await supabase.from('moderation_reports').insert({
      reporter_id: user.id,
      target_id: targetId,
      target_type: targetType,
      reason,
      details: details ?? null,
    });
    if (error) throw error;

    return NextResponse.json({ message: 'Report submitted' });
  } catch (err: any) {
    console.error('[moderation] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to submit report' },
      { status: 400 }
    );
  }
}
