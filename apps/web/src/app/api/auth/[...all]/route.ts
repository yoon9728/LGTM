import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4300";

async function proxyAuth(req: NextRequest) {
  const url = new URL(req.url);
  const target = `${API_BASE}${url.pathname}${url.search}`;

  // Forward all headers except host
  const headers = new Headers(req.headers);
  headers.delete("host");

  // Forward cookies from the browser to the API
  const cookieHeader = req.headers.get("cookie");
  if (cookieHeader) headers.set("cookie", cookieHeader);

  const res = await fetch(target, {
    method: req.method,
    headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
    redirect: "manual",
  });

  // Build response
  const body = res.body;
  const proxyRes = new NextResponse(body, {
    status: res.status,
    statusText: res.statusText,
  });

  // Copy response headers
  res.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    // Skip set-cookie (handled separately) and transfer-encoding
    if (lower === "set-cookie" || lower === "transfer-encoding") return;
    proxyRes.headers.set(key, value);
  });

  // Rewrite Set-Cookie: strip Domain so cookies land on web domain (first-party)
  const setCookies = res.headers.getSetCookie?.() ?? [];
  for (const raw of setCookies) {
    const cleaned = raw
      .replace(/;\s*[Dd]omain=[^;]*/g, "")
      .replace(/;\s*[Ss]ame[Ss]ite=[^;]*/g, "; SameSite=Lax");
    proxyRes.headers.append("set-cookie", cleaned);
  }

  return proxyRes;
}

export const GET = proxyAuth;
export const POST = proxyAuth;
