import { NextRequest, NextResponse } from 'next/server';

import { getCurrentSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      { error: { message: 'Not authenticated', code: 'UNAUTHORIZED' } },
      { status: 401 },
    );
  }

  const db = getDb();

  const { results } = await db
    .prepare(
      'SELECT id, title, slug, description, icon, order_index FROM tracks WHERE is_published = 1 ORDER BY order_index ASC',
    )
    .all();

  return NextResponse.json({
    data: { tracks: results, pagination: { page: 1, totalPages: 1 } },
  });
}
