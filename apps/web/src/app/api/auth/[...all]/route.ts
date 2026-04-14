const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4300";

async function handler(req: Request) {
  const url = new URL(req.url);
  // Forward /api/auth/* to the actual API server
  const target = `${API_BASE}${url.pathname}${url.search}`;

  const headers = new Headers(req.headers);
  // Remove host header so the API server sees its own host
  headers.delete("host");

  const res = await fetch(target, {
    method: req.method,
    headers,
    body: req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined,
    redirect: "manual", // Don't follow redirects — pass them through
    // @ts-expect-error duplex needed for streaming body
    duplex: "half",
  });

  // Pass through the response, including Set-Cookie and Location headers
  const responseHeaders = new Headers(res.headers);

  // Rewrite Set-Cookie domain so cookies land on the web domain (first-party)
  const cookies = res.headers.getSetCookie?.() ?? [];
  if (cookies.length > 0) {
    responseHeaders.delete("set-cookie");
    for (const cookie of cookies) {
      // Strip Domain= attribute so cookie defaults to the web app's domain
      const cleaned = cookie
        .replace(/;\s*Domain=[^;]*/gi, "")
        .replace(/;\s*SameSite=None/gi, "; SameSite=Lax");
      responseHeaders.append("set-cookie", cleaned);
    }
  }

  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
