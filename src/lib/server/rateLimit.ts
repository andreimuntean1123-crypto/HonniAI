/**
 * Fixed-window in-memory rate limiter, per IP + route.
 *
 * Good enough for a single instance; on serverless with many instances swap the
 * Map for Redis/Upstash — the call signature stays the same.
 */

type Entry = { count: number; resetAt: number };

const buckets = new Map<string, Entry>();

const LIMIT = Number(process.env.AI_RATE_LIMIT_REQUESTS ?? 30);
const WINDOW_MS = Number(process.env.AI_RATE_LIMIT_WINDOW_SECONDS ?? 60) * 1000;

export type RateResult = {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

export function rateLimit(key: string): RateResult {
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { ok: true, remaining: LIMIT - 1, retryAfterSeconds: 0 };
  }

  entry.count += 1;
  if (entry.count > LIMIT) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }
  return { ok: true, remaining: LIMIT - entry.count, retryAfterSeconds: 0 };
}

/** Best-effort client IP behind proxies. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'local';
}

/** Periodic cleanup so the map cannot grow unbounded. */
setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of buckets) if (entry.resetAt <= now) buckets.delete(key);
  },
  5 * 60 * 1000,
).unref?.();
