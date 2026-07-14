import { NextRequest, NextResponse } from 'next/server';

import { getCurrentSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      { error: { message: 'Not authenticated', code: 'UNAUTHORIZED' } },
      { status: 401 },
    );
  }

  const { id } = await params;
  const db = getDb();

  const track = await db
    .prepare('SELECT id, title, slug, description, icon FROM tracks WHERE id = ? AND is_published = 1 LIMIT 1')
    .bind(id)
    .first();

  if (!track) {
    return NextResponse.json(
      { error: { message: 'Track not found', code: 'NOT_FOUND' } },
      { status: 404 },
    );
  }

  const { results: lessons } = await db
    .prepare(
      'SELECT id, title, order_index, xp_reward, mastery_threshold FROM lessons WHERE track_id = ? ORDER BY order_index ASC',
    )
    .bind(id)
    .all();

  return NextResponse.json({ data: { track, lessons } });
}
