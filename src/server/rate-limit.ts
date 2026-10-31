import { lt, sql } from 'drizzle-orm';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import { rateLimits } from '~/db/schema';

export type Db = DrizzleD1Database<any>;

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

/**
 * Counts one attempt against `key` in a fixed window. The single upsert is
 * atomic, so simultaneous requests can't slip past the limit.
 */
export async function hitRateLimit(
  db: Db,
  key: string,
  limit: number,
  windowSeconds: number,
  now = Date.now()
): Promise<RateLimitResult> {
  const nowSeconds = Math.floor(now / 1000);
  const expired = nowSeconds - windowSeconds;

  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1, windowStart: nowSeconds })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${rateLimits.windowStart} <= ${expired} THEN 1 ELSE ${rateLimits.count} + 1 END`,
        windowStart: sql`CASE WHEN ${rateLimits.windowStart} <= ${expired} THEN ${nowSeconds} ELSE ${rateLimits.windowStart} END`
      }
    })
    .returning({ count: rateLimits.count, windowStart: rateLimits.windowStart });

  // Now and then, clear counters too old to matter.
  if (Math.random() < 0.02) {
    await db
      .delete(rateLimits)
      .where(lt(rateLimits.windowStart, nowSeconds - 3 * 86_400));
  }

  const count = row?.count ?? 1;
  const windowStart = row?.windowStart ?? nowSeconds;
  return {
    allowed: count <= limit,
    retryAfterSeconds: Math.max(windowStart + windowSeconds - nowSeconds, 1)
  };
}

export async function hashKey(value: string, salt = '') {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`${salt}:${value}`)
  );
  return Array.from(new Uint8Array(digest).slice(0, 16), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}
