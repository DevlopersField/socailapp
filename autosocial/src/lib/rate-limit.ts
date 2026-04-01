import 'server-only';

/**
 * In-memory rate limiter with per-key tracking.
 *
 * For production horizontal scaling, replace the Map with Redis:
 *   const count = await redis.incr(`rl:${key}`);
 *   if (count === 1) await redis.expire(`rl:${key}`, windowSec);
 *   return count <= limit;
 *
 * Usage:
 *   const limiter = createRateLimiter({ limit: 30, windowMs: 60_000 });
 *   if (!limiter.check(userId)) return 429;
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterConfig {
  /** Max requests allowed per window */
  limit: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

interface RateLimiter {
  /** Returns true if request is allowed, false if rate limited */
  check: (key: string) => boolean;
  /** Get remaining requests for a key */
  remaining: (key: string) => number;
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leaks (every 5 minutes)
let cleanupScheduled = false;
function scheduleCleanup() {
  if (cleanupScheduled) return;
  cleanupScheduled = true;
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      if (now > entry.resetAt) store.delete(key);
    }
  }, 300_000);
}

export function createRateLimiter(config: RateLimiterConfig): RateLimiter {
  scheduleCleanup();

  const prefix = `rl_${config.limit}_${config.windowMs}_`;

  return {
    check(key: string): boolean {
      const fullKey = prefix + key;
      const now = Date.now();
      const entry = store.get(fullKey);

      if (!entry || now > entry.resetAt) {
        store.set(fullKey, { count: 1, resetAt: now + config.windowMs });
        return true;
      }

      if (entry.count >= config.limit) return false;
      entry.count++;
      return true;
    },

    remaining(key: string): number {
      const fullKey = prefix + key;
      const now = Date.now();
      const entry = store.get(fullKey);
      if (!entry || now > entry.resetAt) return config.limit;
      return Math.max(0, config.limit - entry.count);
    },
  };
}

// Pre-configured limiters for different endpoint categories
export const rateLimiters = {
  /** Read endpoints: 60 req/min */
  read: createRateLimiter({ limit: 60, windowMs: 60_000 }),
  /** Write/mutation endpoints: 20 req/min */
  write: createRateLimiter({ limit: 20, windowMs: 60_000 }),
  /** AI/expensive endpoints: 10 req/5min */
  ai: createRateLimiter({ limit: 10, windowMs: 300_000 }),
  /** Auth-sensitive endpoints: 5 req/min */
  auth: createRateLimiter({ limit: 5, windowMs: 60_000 }),
};

/** Helper to return a 429 response */
export function rateLimitResponse() {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  );
}
