import { NextRequest, NextResponse } from 'next/server';

import { logAdminAction, requireAdmin } from '@/lib/admin';
import { trackSchema } from '@/lib/validation/admin.schema';

export async function GET() {
  const admin = await requireAdmin();
  if (admin.error) return admin.error;

  const { results } = await admin.db
    .prepare('SELECT * FROM tracks ORDER BY order_index ASC')
    .all();

  return NextResponse.json({ data: { tracks: results } });
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin.error) return admin.error;

  const body = await request.json();
  const parsed = trackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: 'Invalid request', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const t = parsed.data;
  const result = await admin.db
    .prepare(
      'INSERT INTO tracks (title, slug, description, icon, order_index, is_published) VALUES (?, ?, ?, ?, ?, ?)',
    )
    .bind(t.title, t.slug, t.description ?? null, t.icon ?? null, t.order_index, t.is_published ? 1 : 0)
    .run();

  const newId = result.meta.last_row_id;
  await logAdminAction(admin.db, admin.session.userId, 'create_track', 'track', newId, t);

  return NextResponse.json({ data: { id: newId } }, { status: 201 });
}
