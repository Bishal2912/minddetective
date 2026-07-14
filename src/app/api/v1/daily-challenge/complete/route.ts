import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentSession } from '@/lib/auth';
import { getDb } from '@/lib/db';

const bodySchema = z.object({
  questionId: z.number(),
  selectedOptionId: z.number(),
});

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();

  if (!session) {
    return NextResponse.json(
      { error: { message: 'Not authenticated', code: 'UNAUTHORIZED' } },
      { status: 401 },
    );
  }

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: 'Invalid request', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const db = getDb();

  const correctOption = await db
    .prepare(
      'SELECT id FROM question_options WHERE question_id = ? AND is_correct = 1 LIMIT 1',
    )
    .bind(parsed.data.questionId)
    .first<{ id: number }>();

  const question = await db
    .prepare('SELECT explanation FROM questions WHERE id = ? LIMIT 1')
    .bind(parsed.data.questionId)
    .first<{ explanation: string }>();

  const isCorrect = correctOption?.id === parsed.data.selectedOptionId;

  return NextResponse.json({
    data: {
      isCorrect,
      correctOptionId: correctOption?.id ?? null,
      explanation: question?.explanation ?? '',
    },
  });
}
