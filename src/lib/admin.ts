import { NextResponse } from 'next/server';

import { getCurrentSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function requireAdmin() {
  const session = await getCurrentSession();

  if (!session) {
    return {
      error: NextResponse.json(
        { error: { message: 'Not authenticated', code: 'UNAUTHORIZED' } },
        { status: 401 },
      ),
    };
  }

  const db = getDb();
  const user = await db
    .prepare('SELECT is_admin FROM users WHERE id = ? LIMIT 1')
    .bind(session.userId)
    .first<{ is_admin: number }>();

  if (!user || user.is_admin !== 1) {
    return {
      error: NextResponse.json(
        { error: { message: 'Forbidden', code: 'FORBIDDEN' } },
        { status: 403 },
      ),
    };
  }

  return { session, db };
}

export async function logAdminAction(
  db: ReturnType<typeof getDb>,
  adminUserId: string,
  action: string,
  resourceType: string,
  resourceId: string | number | null,
  details?: unknown,
) {
  await db
    .prepare(
      'INSERT INTO admin_audit_log (admin_user_id, action, resource_type, resource_id, details) VALUES (?, ?, ?, ?, ?)',
    )
    .bind(
      adminUserId,
      action,
      resourceType,
      resourceId === null ? null : String(resourceId),
      details ? JSON.stringify(details) : null,
    )
    .run();
}
