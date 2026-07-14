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

  const lesson = await db
    .prepare('SELECT id, track_id, title, xp_reward, mastery_threshold FROM lessons WHERE id = ? LIMIT 1')
    .bind(id)
    .first<{ id: number; track_id: number; title: string; xp_reward: number; mastery_threshold: number }>();

  if (!lesson) {
    return NextResponse.json(
      { error: { message: 'Lesson not found', code: 'LESSON_NOT_FOUND' } },
      { status: 404 },
    );
  }

  const { results: questionRows } = await db
    .prepare('SELECT id, type, prompt FROM questions WHERE lesson_id = ? ORDER BY id ASC')
    .bind(id)
    .all<{ id: number; type: string; prompt: string }>();

  const { results: optionRows } = await db
    .prepare(
      `SELECT question_options.id, question_options.question_id, question_options.label, question_options.order_index
       FROM question_options
       JOIN questions ON question_options.question_id = questions.id
       WHERE questions.lesson_id = ?
       ORDER BY question_options.order_index ASC`,
    )
    .bind(id)
    .all<{ id: number; question_id: number; label: string; order_index: number }>();

  const questions = questionRows.map((q) => ({
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    options: optionRows
      .filter((o) => o.question_id === q.id)
      .map((o) => ({ id: o.id, label: o.label })),
  }));

  return NextResponse.json({ data: { lesson, questions } });
}
