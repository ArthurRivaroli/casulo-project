const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

type Bucket = { failures: number; windowStart: number; blockedUntil: number | null };

// In-memory login-attempt tracker, keyed by email. Good enough for a
// household app with a handful of users on a long-lived Node.js server;
// resets on cold start, which just means the limiter forgets old failures.
const buckets = new Map<string, Bucket>();

export function isLoginBlocked(key: string): boolean {
  const bucket = buckets.get(key);
  return !!bucket?.blockedUntil && bucket.blockedUntil > Date.now();
}

export function recordLoginFailure(key: string): void {
  const now = Date.now();
  const existing = buckets.get(key);
  const bucket =
    existing && now - existing.windowStart <= WINDOW_MS
      ? existing
      : { failures: 0, windowStart: now, blockedUntil: null };

  bucket.failures += 1;
  if (bucket.failures >= MAX_ATTEMPTS) {
    bucket.blockedUntil = now + WINDOW_MS;
  }
  buckets.set(key, bucket);
}

export function recordLoginSuccess(key: string): void {
  buckets.delete(key);
}
