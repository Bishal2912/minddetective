import { NextResponse } from 'next/server';

import { createSession, verifyPassword } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { loginSchema } from '@/lib/validation/auth.schema';

/**
 * Authenticates a user with email and password, then starts a session.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    const parsed = loginSchema.safeParse(body);
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

    const { email, password } = parsed.data;
    const db = getDb();

    const user = await db
      .prepare('SELECT id, password_hash FROM users WHERE email = ? LIMIT 1')
      .bind(email)
      .first<{ id: string; password_hash: string }>();

    if (!user) {
      return NextResponse.json(
        {
          error: {
            message: 'Email or password is incorrect',
            code: 'INVALID_CREDENTIALS',
          },
        },
        { status: 401 },
      );
    }

    const passwordMatches = await verifyPassword(password, user.password_hash);

    if (!passwordMatches) {
      return NextResponse.json(
        {
          error: {
            message: 'Email or password is incorrect',
            code: 'INVALID_CREDENTIALS',
          },
        },
        { status: 401 },
      );
    }

    await createSession(user.id);

    return NextResponse.json({ data: { success: true } }, { status: 200 });
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
