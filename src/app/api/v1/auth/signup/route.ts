import { NextResponse } from 'next/server';

import { createSession, generateId, hashPassword } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { signupSchema } from '@/lib/validation/auth.schema';

/**
 * Creates a new user account, stores the profile in D1, and starts a session.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: {
            message: issue?.message ?? 'Invalid request body',
            code: 'VALIDATION_ERROR',
          },
        },
        { status: 400 },
      );
    }

    const { email, name, password } = parsed.data;
    const db = getDb();

    // Check whether an account already exists for this email.
    const existingUser = await db
      .prepare('SELECT id FROM users WHERE email = ? LIMIT 1')
      .bind(email)
      .first<{ id: string }>();

    if (existingUser) {
      return NextResponse.json(
        {
          error: {
            message: 'An account with this email already exists',
            code: 'EMAIL_ALREADY_EXISTS',
          },
        },
        { status: 400 },
      );
    }

    const userId = generateId();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    try {
      // Create the user row first.
      await db
        .prepare(
          'INSERT INTO users (id, email, name, password_hash, is_admin, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        )
        .bind(userId, email, name, passwordHash, 0, now, now)
        .run();

      // Create the matching stats row so the account is fully initialized.
      await db
        .prepare(
          'INSERT INTO user_stats (user_id, xp, streak_count, longest_streak, last_active_date, onboarding_complete, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        )
        .bind(userId, 0, 0, 0, null, 0, now)
        .run();

      // Start a session to log the new user in immediately.
      await createSession(userId);

      return NextResponse.json(
        {
          data: {
            user: {
              id: userId,
              email,
              name,
            },
          },
        },
        { status: 200 },
      );
    } catch (error) {
      // Best effort cleanup if the account was partially created.
      await db.prepare('DELETE FROM user_stats WHERE user_id = ?').bind(userId).run().catch(() => undefined);
      await db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run().catch(() => undefined);

      throw error;
    }
  } catch {
    return NextResponse.json(
      {
        error: {
          message: 'Something went wrong, please try again',
          code: 'INTERNAL_ERROR',
        },
      },
      { status: 500 },
    );
  }
}
