import type { Context } from "hono";
import { getConnInfo } from "@hono/node-server/conninfo";
import { createHmac, timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";

function normalize(ip: string): string {
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
}

export function getClientIp(c: Context): string {
  const secret = process.env.PROXY_SHARED_SECRET;
  const signedIp = c.req.header("x-lgtm-client-ip");
  const timestamp = c.req.header("x-lgtm-proxy-time") ?? "";
  const signature = c.req.header("x-lgtm-proxy-signature") ?? "";
  if (secret && secret.length >= 32 && signedIp && isIP(signedIp)
    && /^\d{13}$/.test(timestamp) && Math.abs(Date.now() - Number(timestamp)) <= 60_000
    && /^[a-f0-9]{64}$/.test(signature)) {
    const expected = createHmac("sha256", secret).update(timestamp + ":" + signedIp).digest();
    if (timingSafeEqual(expected, Buffer.from(signature, "hex"))) return normalize(signedIp);
  }

  // Client-provided x-real-ip is not a socket address.
  let remote: string | undefined;
  try { remote = getConnInfo(c).remote.address; } catch { /* Non-Node test adapters have no socket. */ }
  if (!remote) return "unknown";
  remote = normalize(remote);
  const trusted = new Set((process.env.TRUSTED_PROXIES ?? "127.0.0.1,::1")
    .split(",").map((value) => normalize(value.trim())).filter(Boolean));
  if (!trusted.has(remote)) return remote;
  const chain = (c.req.header("x-forwarded-for") ?? "").split(",").map((value) => normalize(value.trim()));
  // Walk from the actual peer towards the client; never trust the leftmost value blindly.
  for (let index = chain.length - 1; index >= 0; index--) {
    if (!isIP(chain[index])) return remote;
    if (!trusted.has(chain[index])) return chain[index];
  }
  return remote;
}
