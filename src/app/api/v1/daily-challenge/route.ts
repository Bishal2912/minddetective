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

  const { results: allQuestions } = await db
    .prepare('SELECT id FROM questions ORDER BY id ASC')
    .all<{ id: number }>();

  if (allQuestions.length === 0) {
    return NextResponse.json(
      { error: { message: 'No questions available', code: 'NOT_FOUND' } },
      { status: 404 },
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];
  let hash = 0;
  for (let i = 0; i < todayStr.length; i++) {
    hash = (hash * 31 + todayStr.charCodeAt(i)) % allQuestions.length;
  }
  const questionId = allQuestions[hash].id;

  const question = await db
    .prepare('SELECT id, type, prompt FROM questions WHERE id = ? LIMIT 1')
    .bind(questionId)
    .first<{ id: number; type: string; prompt: string }>();

  const { results: options } = await db
    .prepare('SELECT id, label FROM question_options WHERE question_id = ? ORDER BY order_index ASC')
    .bind(questionId)
    .all<{ id: number; label: string }>();

  return NextResponse.json({ data: { question, options } });
}
