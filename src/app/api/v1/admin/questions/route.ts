import { NextRequest, NextResponse } from 'next/server';

import { logAdminAction, requireAdmin } from '@/lib/admin';
import { questionSchema } from '@/lib/validation/admin.schema';

export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (admin.error) return admin.error;

  const body = await request.json();
  const parsed = questionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: 'Invalid request', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const q = parsed.data;

  if (!q.options.some((o) => o.is_correct)) {
    return NextResponse.json(
      { error: { message: 'At least one option must be marked correct', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const result = await admin.db
    .prepare(
      'INSERT INTO questions (lesson_id, type, prompt, explanation, source_citation) VALUES (?, ?, ?, ?, ?)',
    )
    .bind(q.lesson_id, q.type, q.prompt, q.explanation, q.source_citation ?? null)
    .run();

  const questionId = result.meta.last_row_id;

  const optionStatements = q.options.map((opt, index) =>
    admin.db
      .prepare(
        'INSERT INTO question_options (question_id, label, is_correct, order_index) VALUES (?, ?, ?, ?)',
      )
      .bind(questionId, opt.label, opt.is_correct ? 1 : 0, index),
  );

  await admin.db.batch(optionStatements);
  await logAdminAction(admin.db, admin.session.userId, 'create_question', 'question', questionId, q);

  return NextResponse.json({ data: { id: questionId } }, { status: 201 });
}
