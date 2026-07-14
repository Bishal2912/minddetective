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

  const { results } = await db
    .prepare(
      `SELECT
         tracks.id AS track_id,
         tracks.title AS track_title,
         COUNT(DISTINCT lessons.id) AS total_lessons,
         COUNT(DISTINCT CASE WHEN user_progress.user_id = ? THEN user_progress.lesson_id END) AS completed_lessons
       FROM tracks
       JOIN lessons ON lessons.track_id = tracks.id
       LEFT JOIN user_progress ON user_progress.lesson_id = lessons.id
       GROUP BY tracks.id
       ORDER BY tracks.order_index ASC`,
    )
    .bind(session.userId)
    .all();

  return NextResponse.json({ data: { progress: results } });
}
