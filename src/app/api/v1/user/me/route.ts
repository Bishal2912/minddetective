import { NextRequest, NextResponse } from 'next/server';

import { destroySession, getCurrentSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { updateProfileSchema } from '@/lib/validation/user.schema';

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

export async function PATCH(request: NextRequest) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      { error: { message: 'Not authenticated', code: 'UNAUTHORIZED' } },
      { status: 401 },
    );
  }

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: 'Invalid request', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const db = getDb();

  await db
    .prepare('UPDATE users SET name = ?, updated_at = ? WHERE id = ?')
    .bind(parsed.data.name, new Date().toISOString(), session.userId)
    .run();

  return NextResponse.json({ data: { success: true } });
}

export async function DELETE() {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      { error: { message: 'Not authenticated', code: 'UNAUTHORIZED' } },
      { status: 401 },
    );
  }

  const db = getDb();
  const userId = session.userId;

  await db.batch([
    db.prepare('DELETE FROM user_answers WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM user_progress WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM user_stats WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM users WHERE id = ?').bind(userId),
  ]);

  await destroySession();

  return NextResponse.json({ data: { success: true } });
}
