/**
 * محدودسازی نرخ در حافظه (برای استقرار تک‌نمونه‌ای).
 * در استقرار چندنمونه‌ای باید با Redis جایگزین شود.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function nowMs(): number {
  return Date.now();
}

export function checkRateLimit(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = nowMs();
  const existing = buckets.get(key);
  if (!existing || now >= existing.resetAt) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }
  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }
  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

export function rateLimitKey(ip: string | null, action: string, identifier?: string): string {
  return [action, ip ?? "unknown", identifier ?? ""].join(":");
}

// پاک‌سازی دوره‌ای برای جلوگیری از نشت حافظه
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = nowMs();
    for (const [k, v] of buckets) if (now >= v.resetAt) buckets.delete(k);
  }, 60_000).unref?.();
}
