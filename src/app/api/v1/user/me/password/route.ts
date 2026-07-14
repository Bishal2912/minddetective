import { NextRequest, NextResponse } from 'next/server';

import { getCurrentSession, hashPassword, verifyPassword } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { changePasswordSchema } from '@/lib/validation/user.schema';

export async function PATCH(request: NextRequest) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      { error: { message: 'Not authenticated', code: 'UNAUTHORIZED' } },
      { status: 401 },
    );
  }

  const body = await request.json();
  const parsed = changePasswordSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: 'Invalid request', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const db = getDb();

  const user = await db
    .prepare('SELECT password_hash FROM users WHERE id = ? LIMIT 1')
    .bind(session.userId)
    .first<{ password_hash: string }>();

  if (!user) {
    return NextResponse.json(
      { error: { message: 'User not found', code: 'NOT_FOUND' } },
      { status: 404 },
    );
  }

  const isValid = await verifyPassword(parsed.data.currentPassword, user.password_hash);

  if (!isValid) {
    return NextResponse.json(
      { error: { message: 'Current password is incorrect', code: 'INCORRECT_CURRENT_PASSWORD' } },
      { status: 400 },
    );
  }

  const newHash = await hashPassword(parsed.data.newPassword);

  await db
    .prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
    .bind(newHash, new Date().toISOString(), session.userId)
    .run();

  return NextResponse.json({ data: { success: true } });
}
