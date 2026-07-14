import { NextRequest, NextResponse } from 'next/server';

import { getCurrentSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { onboardingSchema } from '@/lib/validation/onboarding.schema';

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      { error: { message: 'Not authenticated', code: 'UNAUTHORIZED' } },
      { status: 401 },
    );
  }

  const body = await request.json();
  const parsed = onboardingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: 'Invalid request', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const db = getDb();

  await db
    .prepare('UPDATE user_stats SET onboarding_complete = 1, updated_at = ? WHERE user_id = ?')
    .bind(new Date().toISOString(), session.userId)
    .run();

  return NextResponse.json({ data: { success: true } });
}
