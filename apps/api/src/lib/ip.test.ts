import { afterEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { createHmac } from "node:crypto";
import { getClientIp } from "./ip.js";

afterEach(() => vi.unstubAllEnvs());
async function readIp(headers: Record<string, string>, remoteAddress = "203.0.113.5") {
  const app = new Hono().get("/", (c) => c.text(getClientIp(c)));
  return (await app.request("http://localhost/", { headers }, { incoming: { socket: { remoteAddress } } })).text();
}
describe("client IP trust", () => {
  it("ignores forged x-real-ip and forwarded headers from untrusted peers", async () => {
    expect(await readIp({ "x-real-ip": "127.0.0.1", "x-forwarded-for": "198.51.100.1" })).toBe("203.0.113.5");
  });
  it("walks a trusted chain from the nearest peer", async () => {
    expect(await readIp({ "x-forwarded-for": "198.51.100.1, 203.0.113.9" }, "::ffff:127.0.0.1")).toBe("203.0.113.9");
  });
  it("accepts a fresh signed proxy identity", async () => {
    const secret = "a".repeat(32);
    vi.stubEnv("PROXY_SHARED_SECRET", secret);
    const time = String(Date.now());
    const signature = createHmac("sha256", secret).update(time + ":198.51.100.8").digest("hex");
    expect(await readIp({ "x-lgtm-client-ip": "198.51.100.8", "x-lgtm-proxy-time": time, "x-lgtm-proxy-signature": signature })).toBe("198.51.100.8");
  });
  it.each(["forged", "expired"])("rejects %s proxy identity", async (kind) => {
    const secret = "a".repeat(32);
    vi.stubEnv("PROXY_SHARED_SECRET", secret);
    const time = String(Date.now() - (kind === "expired" ? 90_000 : 0));
    const signature = createHmac("sha256", kind === "forged" ? "wrong" : secret).update(time + ":198.51.100.8").digest("hex");
    expect(await readIp({ "x-lgtm-client-ip": "198.51.100.8", "x-lgtm-proxy-time": time, "x-lgtm-proxy-signature": signature })).toBe("203.0.113.5");
  });
});
