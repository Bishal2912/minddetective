import { NextResponse } from 'next/server';

import { destroySession } from '@/lib/auth';

/**
 * Logs out the current user by deleting the active session and clearing the cookie.
 */
export async function POST(request: Request) {
  try {
    await destroySession();

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
