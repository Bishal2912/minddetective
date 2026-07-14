import { NextRequest, NextResponse } from 'next/server';

import { logAdminAction, requireAdmin } from '@/lib/admin';
import { trackSchema } from '@/lib/validation/admin.schema';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (admin.error) return admin.error;

  const { id } = await params;
  const body = await request.json();
  const parsed = trackSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: 'Invalid request', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const t = parsed.data;
  await admin.db
    .prepare(
      'UPDATE tracks SET title = COALESCE(?, title), slug = COALESCE(?, slug), description = COALESCE(?, description), icon = COALESCE(?, icon), order_index = COALESCE(?, order_index), is_published = COALESCE(?, is_published), updated_at = ? WHERE id = ?',
    )
    .bind(
      t.title ?? null,
      t.slug ?? null,
      t.description ?? null,
      t.icon ?? null,
      t.order_index ?? null,
      t.is_published === undefined ? null : t.is_published ? 1 : 0,
      new Date().toISOString(),
      id,
    )
    .run();

  await logAdminAction(admin.db, admin.session.userId, 'update_track', 'track', id, t);

  return NextResponse.json({ data: { success: true } });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (admin.error) return admin.error;

  const { id } = await params;
  await admin.db.prepare('DELETE FROM tracks WHERE id = ?').bind(id).run();
  await logAdminAction(admin.db, admin.session.userId, 'delete_track', 'track', id);

  return NextResponse.json({ data: { success: true } });
}
