import type { Context, Next } from "hono";
import { getClientIp } from "../lib/ip.js";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 5 * 60 * 1000).unref();

export function rateLimit(opts: { windowMs: number; max: number; keyPrefix?: string }) {
  const { windowMs, max, keyPrefix = "rl" } = opts;

  return async (c: Context, next: Next) => {
    const ip = getClientIp(c);
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    let entry = store.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      store.set(key, entry);
    }

    entry.count++;

    c.header("X-RateLimit-Limit", String(max));
    c.header("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));
    c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > max) {
      return c.json({ error: "Too many requests. Please try again later." }, 429);
    }

    await next();
  };
}
