import { compare, hash } from 'bcryptjs';
import { cookies } from 'next/headers';

import { getDb } from '@/lib/db';

const SESSION_COOKIE_NAME = 'session_id';
const SESSION_TTL_DAYS = 30;

/**
 * Hashes a plain-text password using bcrypt with 10 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

/**
 * Verifies a plain-text password against a bcrypt hash.
 */
export async function verifyPassword(password: string, hashValue: string): Promise<boolean> {
  return compare(password, hashValue);
}

/**
 * Generates a new random UUID for use as a unique resource identifier.
 */
export function generateId(): string {
  return globalThis.crypto.randomUUID();
}

/**
 * Creates a new session row in D1 and stores the session id in an HTTP-only cookie.
 */
export async function createSession(userId: string, userAgent?: string): Promise<string> {
  const sessionId = generateId();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const cookieStore = await cookies();

  const db = getDb();

  await db
    .prepare(
      'INSERT INTO sessions (id, user_id, created_at, expires_at, user_agent) VALUES (?, ?, ?, ?, ?)',
    )
    .bind(sessionId, userId, createdAt, expiresAt, userAgent ?? null)
    .run();

  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
    path: '/',
  });

  return sessionId;
}

/**
 * Reads the current session id from the cookie and returns the matching session user id if it is still valid.
 */
export async function getCurrentSession(): Promise<{ userId: string; sessionId: string } | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return null;
  }

  const db = getDb();
  const row = await db
    .prepare('SELECT user_id, expires_at FROM sessions WHERE id = ? LIMIT 1')
    .bind(sessionId)
    .first<{ user_id: string; expires_at: string }>();

  if (!row) {
    return null;
  }

  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return null;
  }

  return {
    userId: row.user_id,
    sessionId,
  };
}

/**
 * Removes the current session from D1 and clears the session cookie.
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    return;
  }

  const db = getDb();
  await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
