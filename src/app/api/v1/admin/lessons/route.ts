import { NextRequest, NextResponse } from 'next/server';

import { logAdminAction, requireAdmin } from '@/lib/admin';
import { lessonSchema } from '@/lib/validation/admin.schema';

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin.error) return admin.error;

  const body = await request.json();
  const parsed = lessonSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: 'Invalid request', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const l = parsed.data;
  const result = await admin.db
    .prepare(
      'INSERT INTO lessons (track_id, title, order_index, xp_reward, mastery_threshold) VALUES (?, ?, ?, ?, ?)',
    )
    .bind(l.track_id, l.title, l.order_index, l.xp_reward, l.mastery_threshold)
    .run();

  const newId = result.meta.last_row_id;
  await logAdminAction(admin.db, admin.session.userId, 'create_lesson', 'lesson', newId, l);

  return NextResponse.json({ data: { id: newId } }, { status: 201 });
}
