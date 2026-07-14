import { NextResponse } from 'next/server';

import { getCurrentSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      { error: { message: 'Not authenticated', code: 'UNAUTHORIZED' } },
      { status: 401 },
    );
  }

  const db = getDb();

  const user = await db
    .prepare(
      `SELECT users.id, users.name, users.email, user_stats.xp, user_stats.streak_count, user_stats.longest_streak
       FROM users
       JOIN user_stats ON user_stats.user_id = users.id
       WHERE users.id = ? LIMIT 1`,
    )
    .bind(session.userId)
    .first();

  if (!user) {
    return NextResponse.json(
      { error: { message: 'User not found', code: 'NOT_FOUND' } },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: user });
}
