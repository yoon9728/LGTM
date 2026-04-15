import { NextRequest } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4300";

// Headers that must not be forwarded between hops
const HOP_HEADERS = new Set([
  "host", "connection", "keep-alive", "transfer-encoding",
  "te", "trailer", "upgrade", "proxy-authorization",
  "proxy-authenticate", "content-encoding", "content-length",
  "accept-encoding",
]);

interface ProxyOptions {
  /** Rewrite Set-Cookie to be first-party (strip Domain, force SameSite=Lax) */
  rewriteCookies?: boolean;
}

export async function proxyRequest(req: NextRequest, opts: ProxyOptions = {}) {
  const url = new URL(req.url);
  const target = `${API_BASE}${url.pathname}${url.search}`;

  // Build minimal forwarding headers
  const fwdHeaders = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) fwdHeaders.set("content-type", contentType);
  const cookie = req.headers.get("cookie");
  if (cookie) fwdHeaders.set("cookie", cookie);
  const accept = req.headers.get("accept");
  if (accept) fwdHeaders.set("accept", accept);
  const origin = req.headers.get("origin");
  if (origin) fwdHeaders.set("origin", origin);

  const res = await fetch(target, {
    method: req.method,
    headers: fwdHeaders,
    body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
    redirect: "manual",
  });

  // Read body fully (streaming can drop data on serverless)
  const bodyText = await res.text();

  // Build response with only safe headers
  const resHeaders = new Headers();
  res.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "set-cookie" || HOP_HEADERS.has(lower)) return;
    resHeaders.set(key, value);
  });

  // Forward Set-Cookie headers
  const setCookies = res.headers.getSetCookie?.() ?? [];
  for (const raw of setCookies) {
    if (opts.rewriteCookies) {
      // Strip Domain so cookies land on web domain (first-party)
      const cleaned = raw
        .replace(/;\s*[Dd]omain=[^;]*/g, "")
        .replace(/;\s*[Ss]ame[Ss]ite=[^;]*/g, "; SameSite=Lax");
      resHeaders.append("set-cookie", cleaned);
    } else {
      resHeaders.append("set-cookie", raw);
    }
  }

  return new Response(bodyText, {
    status: res.status,
    statusText: res.statusText,
    headers: resHeaders,
  });
}
