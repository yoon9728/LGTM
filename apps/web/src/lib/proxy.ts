import type { NextRequest } from "next/server";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";

const HOP_HEADERS = new Set([
  "host", "connection", "keep-alive", "transfer-encoding", "te", "trailer",
  "upgrade", "proxy-authorization", "proxy-authenticate", "content-encoding",
  "content-length", "accept-encoding",
]);
const MAX_BODY_BYTES = 512 * 1024;

interface ProxyOptions {
  rewriteCookies?: boolean;
  pathname?: string;
}

export async function proxyRequest(req: NextRequest, opts: ProxyOptions = {}) {
  const url = new URL(req.url);
  const base = (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4300").replace(/\/$/, "");
  const target = base + (opts.pathname ?? url.pathname) + url.search;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 110_000);
  const onAbort = () => controller.abort();
  req.signal.addEventListener("abort", onAbort, { once: true });
  if (req.signal.aborted) controller.abort();

  try {
    const headers = new Headers();
    for (const name of ["content-type", "cookie", "accept", "origin", "user-agent"]) {
      const value = req.headers.get(name);
      if (value) headers.set(name, value);
    }

    // Vercel overwrites this header. Never sign arbitrary local forwarded headers.
    const secret = process.env.PROXY_SHARED_SECRET;
    const ip = process.env.VERCEL === "1" ? req.headers.get("x-forwarded-for")?.trim() : undefined;
    if (secret && secret.length >= 32 && ip && isIP(ip)) {
      const timestamp = String(Date.now());
      headers.set("x-lgtm-client-ip", ip);
      headers.set("x-lgtm-proxy-time", timestamp);
      headers.set("x-lgtm-proxy-signature", createHmac("sha256", secret).update(timestamp + ":" + ip).digest("hex"));
    }

    let body: Uint8Array | undefined;
    if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
      const reader = req.body.getReader();
      const cancelRead = () => { void reader.cancel().catch(() => {}); };
      controller.signal.addEventListener("abort", cancelRead, { once: true });
      const chunks: Uint8Array[] = [];
      let size = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > MAX_BODY_BYTES) {
            await reader.cancel();
            return Response.json({ error: "Request body too large." }, { status: 413 });
          }
          chunks.push(value);
        }
      } finally {
        controller.signal.removeEventListener("abort", cancelRead);
        reader.releaseLock();
      }
      body = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.byteLength;
      }
    }

    const res = await fetch(target, {
      method: req.method, headers, body: body as BodyInit | undefined,
      redirect: "manual", cache: "no-store", signal: controller.signal,
    });
    const bodyless = req.method === "HEAD" || [204, 205, 304].includes(res.status);
    const responseBody = bodyless ? null : await res.arrayBuffer();
    const responseHeaders = new Headers();
    const connectionTokens = new Set((res.headers.get("connection") ?? "").toLowerCase().split(",").map((v) => v.trim()));
    res.headers.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (lower !== "set-cookie" && !HOP_HEADERS.has(lower) && !connectionTokens.has(lower)) {
        responseHeaders.set(key, value);
      }
    });
    responseHeaders.set("cache-control", "private, no-store");
    for (const raw of res.headers.getSetCookie()) {
      const cookie = opts.rewriteCookies
        ? raw.replace(/;\s*domain=[^;]*/gi, "").replace(/;\s*samesite=[^;]*/gi, "; SameSite=Lax")
        : raw;
      responseHeaders.append("set-cookie", cookie);
    }
    return new Response(responseBody, { status: res.status, statusText: res.statusText, headers: responseHeaders });
  } catch {
    return Response.json(
      { error: controller.signal.aborted ? "API request timed out." : "API is temporarily unavailable." },
      { status: controller.signal.aborted ? 504 : 502, headers: { "cache-control": "no-store" } },
    );
  } finally {
    clearTimeout(timer);
    req.signal.removeEventListener("abort", onAbort);
  }
}
