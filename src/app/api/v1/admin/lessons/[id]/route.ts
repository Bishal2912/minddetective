import { NextRequest, NextResponse } from 'next/server';

import { logAdminAction, requireAdmin } from '@/lib/admin';
import { lessonSchema } from '@/lib/validation/admin.schema';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (admin.error) return admin.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = lessonSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: 'Invalid request', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const l = parsed.data;
  await admin.db
    .prepare(
      'UPDATE lessons SET title = COALESCE(?, title), order_index = COALESCE(?, order_index), xp_reward = COALESCE(?, xp_reward), mastery_threshold = COALESCE(?, mastery_threshold), updated_at = ? WHERE id = ?',
    )
    .bind(
      l.title ?? null,
      l.order_index ?? null,
      l.xp_reward ?? null,
      l.mastery_threshold ?? null,
      new Date().toISOString(),
      id,
    )
    .run();

  await logAdminAction(admin.db, admin.session.userId, 'update_lesson', 'lesson', id, l);

  return NextResponse.json({ data: { success: true } });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (admin.error) return admin.error;

  const { id } = await params;
  await admin.db.prepare('DELETE FROM lessons WHERE id = ?').bind(id).run();
  await logAdminAction(admin.db, admin.session.userId, 'delete_lesson', 'lesson', id);

  return NextResponse.json({ data: { success: true } });
}
