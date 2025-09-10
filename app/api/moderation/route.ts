import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

const ReportSchema = z.object({
  targetId: z.string(),
  targetType: z.enum(['movie', 'comment']),
  reason: z.string().min(1),
  details: z.string().optional(),
});

function getClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    },
  );
}

/**
 * Accepts content moderation reports from users.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = _test.getClient();
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

// for tests
export const _test = { getClient };
