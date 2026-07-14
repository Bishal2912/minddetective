import { NextRequest, NextResponse } from 'next/server';

import { logAdminAction, requireAdmin } from '@/lib/admin';
import { questionSchema } from '@/lib/validation/admin.schema';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (admin.error) return admin.error;

  const { id } = await params;
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

  await admin.db
    .prepare(
      'UPDATE questions SET type = ?, prompt = ?, explanation = ?, source_citation = ?, content_version = content_version + 1, updated_at = ? WHERE id = ?',
    )
    .bind(q.type, q.prompt, q.explanation, q.source_citation ?? null, new Date().toISOString(), id)
    .run();

  await admin.db.prepare('DELETE FROM question_options WHERE question_id = ?').bind(id).run();

  const optionStatements = q.options.map((opt, index) =>
    admin.db
      .prepare(
        'INSERT INTO question_options (question_id, label, is_correct, order_index) VALUES (?, ?, ?, ?)',
      )
      .bind(id, opt.label, opt.is_correct ? 1 : 0, index),
  );

  await admin.db.batch(optionStatements);
  await logAdminAction(admin.db, admin.session.userId, 'update_question', 'question', id, q);

  return NextResponse.json({ data: { success: true } });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin();
  if (admin.error) return admin.error;

  const { id } = await params;
  await admin.db.prepare('DELETE FROM question_options WHERE question_id = ?').bind(id).run();
  await admin.db.prepare('DELETE FROM questions WHERE id = ?').bind(id).run();
  await logAdminAction(admin.db, admin.session.userId, 'delete_question', 'question', id);

  return NextResponse.json({ data: { success: true } });
}
