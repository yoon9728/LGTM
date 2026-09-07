import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { proxyRequest } from "./proxy";

const request = (path = "/api/auth/get-session", init?: RequestInit) =>
  new Request("http://localhost:4173" + path, init) as NextRequest;

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("API proxy", () => {
  it("uses runtime server URL and preserves query/body/method without cloning streams", async () => {
    vi.stubEnv("API_URL", "http://api:4300");
    const fetcher = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetcher);
    const response = await proxyRequest(request("/api/v1/admin/questions?q=one", {
      method: "PUT", body: '{"title":"new"}', headers: { "content-type": "application/json" },
    }), { pathname: "/admin/questions" });
    expect(response.status).toBe(200);
    expect(fetcher.mock.calls[0][0]).toBe("http://api:4300/admin/questions?q=one");
    expect(fetcher.mock.calls[0][1].method).toBe("PUT");
    expect(new TextDecoder().decode(fetcher.mock.calls[0][1].body)).toBe('{"title":"new"}');
  });

  it.each([204, 205, 304])("preserves bodyless %i responses", async (status) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status })));
    const response = await proxyRequest(request());
    expect(response.status).toBe(status);
    expect(await response.text()).toBe("");
  });

  it("rewrites multiple cookies and strips dynamic hop headers", async () => {
    const headers = new Headers({ connection: "x-internal", "x-internal": "private" });
    headers.append("set-cookie", "first=one; DOMAIN=api.example.com; SameSite=None; Secure; HttpOnly");
    headers.append("set-cookie", "second=two; Path=/; SameSite=None; Secure");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("ok", { headers })));
    const response = await proxyRequest(request(), { rewriteCookies: true });
    expect(response.headers.has("x-internal")).toBe(false);
    expect(response.headers.getSetCookie()).toEqual([
      "first=one; SameSite=Lax; Secure; HttpOnly", "second=two; Path=/; SameSite=Lax; Secure",
    ]);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("returns a safe 502 on a provider connection failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("secret connection details")));
    const response = await proxyRequest(request());
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("secret");
  });

  it("bounds the upstream request and aborts it", async () => {
    vi.useFakeTimers();
    let upstreamSignal: AbortSignal | undefined;
    vi.stubGlobal("fetch", vi.fn((_url, init) => new Promise((_resolve, reject) => {
      upstreamSignal = init.signal;
      upstreamSignal!.addEventListener("abort", () => reject(new Error("aborted")));
    })));
    const pending = proxyRequest(request());
    await vi.advanceTimersByTimeAsync(110_000);
    expect(upstreamSignal?.aborted).toBe(true);
    expect((await pending).status).toBe(504);
  });

  it("rejects oversized bodies before forwarding", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    const response = await proxyRequest(request("/api/v1/practice/answers", { method: "POST", body: "a".repeat(512 * 1024 + 1) }));
    expect(response.status).toBe(413);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("never forwards or signs arbitrary local client-IP headers", async () => {
    vi.stubEnv("VERCEL", "");
    vi.stubEnv("PROXY_SHARED_SECRET", "a".repeat(32));
    const fetcher = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetcher);
    await proxyRequest(request("/api/v1/practice/questions", { headers: { "x-forwarded-for": "203.0.113.9", "x-lgtm-proxy-signature": "spoof" } }));
    expect(fetcher.mock.calls[0][1].headers.has("x-lgtm-proxy-signature")).toBe(false);
    expect(fetcher.mock.calls[0][1].headers.has("x-forwarded-for")).toBe(false);
  });

  it("signs only platform-attested Vercel client IPs", async () => {
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("PROXY_SHARED_SECRET", "a".repeat(32));
    const fetcher = vi.fn().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetcher);
    await proxyRequest(request("/api/v1/practice/questions", { headers: { "x-forwarded-for": "203.0.113.9" } }));
    expect(fetcher.mock.calls[0][1].headers.get("x-lgtm-client-ip")).toBe("203.0.113.9");
    expect(fetcher.mock.calls[0][1].headers.get("x-lgtm-proxy-signature")).toMatch(/^[a-f0-9]{64}$/);
  });
});
