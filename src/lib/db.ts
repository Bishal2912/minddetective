import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * Returns the D1 database instance from the Cloudflare environment.
 *
 * Use this inside App Router API routes such as app/api/<route>/route.ts:
 *
 * import { getDb } from '@/lib/db';
 *
 * const db = getDb();
 * const result = await db.prepare('SELECT 1').first();
 */
export function getDb() {
  const { env } = getCloudflareContext();
  return env.DB;
}
