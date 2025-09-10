import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const ReportSchema = z.object({
  targetId: z.string(),
  targetType: z.enum(['movie', 'comment']),
  reason: z.string().min(1),
  details: z.string().optional(),
  reporterId: z.string().uuid().optional(),
});

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing Supabase configuration');
  return createClient(url, key);
}

/**
 * Accepts content moderation reports from users.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reporterId, targetId, targetType, reason, details } = ReportSchema.parse(body);

    const supabase = getClient();
    const { error } = await supabase.from('moderation_reports').insert({
      reporter_id: reporterId ?? null,
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

// for tests
export const _test = { getClient };
