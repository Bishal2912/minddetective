import { NextRequest, NextResponse } from 'next/server';

import { getCurrentSession } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { lessonCompleteSchema } from '@/lib/validation/lesson.schema';
import { calculateLevel, calculateScore, isMastered } from '@/lib/xp-engine';
import { calculateStreakUpdate } from '@/lib/streak-engine';

export async function POST(
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

  const { id: lessonId } = await params;
  const body = await request.json();
  const parsed = lessonCompleteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { message: 'Invalid request', code: 'VALIDATION_ERROR' } },
      { status: 400 },
    );
  }

  const db = getDb();

  const lesson = await db
    .prepare('SELECT id, xp_reward, mastery_threshold FROM lessons WHERE id = ? LIMIT 1')
    .bind(lessonId)
    .first<{ id: number; xp_reward: number; mastery_threshold: number }>();

  if (!lesson) {
    return NextResponse.json(
      { error: { message: 'Lesson not found', code: 'LESSON_NOT_FOUND' } },
      { status: 404 },
    );
  }

  const { results: correctOptions } = await db
    .prepare(
      `SELECT question_options.id, question_options.question_id, questions.explanation
       FROM question_options
       JOIN questions ON question_options.question_id = questions.id
       WHERE questions.lesson_id = ? AND question_options.is_correct = 1`,
    )
    .bind(lessonId)
    .all<{ id: number; question_id: number; explanation: string }>();

  const answers = parsed.data.answers;
  let correctCount = 0;

  const graded = answers.map((answer) => {
    const correctOption = correctOptions.find((c) => c.question_id === answer.questionId);
    const isCorrect = correctOption ? correctOption.id === answer.selectedOptionId : false;
    if (isCorrect) correctCount += 1;

    return {
      questionId: answer.questionId,
      selectedOptionId: answer.selectedOptionId,
      correctOptionId: correctOption?.id ?? null,
      explanation: correctOption?.explanation ?? '',
      isCorrect,
    };
  });

  const score = calculateScore(correctCount, answers.length);
  const mastered = isMastered(score, lesson.mastery_threshold);
  const xpEarned = lesson.xp_reward;

  const stats = await db
    .prepare('SELECT xp, streak_count, longest_streak, last_active_date FROM user_stats WHERE user_id = ? LIMIT 1')
    .bind(session.userId)
    .first<{ xp: number; streak_count: number; longest_streak: number; last_active_date: string | null }>();

  const currentXp = stats?.xp ?? 0;
  const newTotalXp = currentXp + xpEarned;
  const leveledUp = calculateLevel(newTotalXp) > calculateLevel(currentXp);
  const now = new Date().toISOString();
  const today = now.split('T')[0];

  const { newStreak, newLongestStreak } = calculateStreakUpdate(
    stats?.last_active_date ?? null,
    stats?.streak_count ?? 0,
    stats?.longest_streak ?? 0,
  );

  const statements = [
    db
      .prepare(
        'INSERT INTO user_progress (user_id, lesson_id, completed_at, score, mastered) VALUES (?, ?, ?, ?, ?)',
      )
      .bind(session.userId, lessonId, now, score, mastered ? 1 : 0),
    db
      .prepare(
        'UPDATE user_stats SET xp = ?, streak_count = ?, longest_streak = ?, last_active_date = ?, updated_at = ? WHERE user_id = ?',
      )
      .bind(newTotalXp, newStreak, newLongestStreak, today, now, session.userId),
    ...graded.map((g) =>
      db
        .prepare(
          'INSERT INTO user_answers (user_id, question_id, selected_option_id, is_correct, answered_at) VALUES (?, ?, ?, ?, ?)',
        )
        .bind(session.userId, g.questionId, g.selectedOptionId, g.isCorrect ? 1 : 0, now),
    ),
  ];

  await db.batch(statements);

  return NextResponse.json({
    data: {
      score,
      xpEarned,
      newTotalXp,
      mastered,
      leveledUp,
      correctAnswers: graded.map(({ questionId, correctOptionId, explanation }) => ({
        questionId,
        correctOptionId,
        explanation,
      })),
    },
  });
}
