import type { Context } from "hono";

/**
 * Trusted proxy IPs. Only trust X-Forwarded-For when the request
 * comes from one of these addresses (e.g., Nginx, Cloudflare).
 * In production, populate via TRUSTED_PROXIES env var.
 */
const TRUSTED_PROXIES = new Set(
  (process.env.TRUSTED_PROXIES ?? "127.0.0.1,::1")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

/**
 * Extract client IP from the request. Only trusts X-Forwarded-For
 * if the connection comes from a known proxy; otherwise uses the
 * actual socket remote address.
 */
export function getClientIp(c: Context): string {
  // Hono's conninfo (node-server) — actual TCP remote address
  const remoteAddr =
    c.req.header("x-real-ip") ??
    (c.env as Record<string, unknown>)?.remoteAddr as string | undefined;

  // Only trust forwarded headers from trusted proxies
  if (remoteAddr && TRUSTED_PROXIES.has(remoteAddr)) {
    const forwarded = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwarded) return forwarded;
  }

  return remoteAddr ?? "unknown";
}
