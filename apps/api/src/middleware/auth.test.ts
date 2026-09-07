import { afterEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("../auth.js", () => ({ getAuth: () => ({ api: { getSession } }) }));
import { optionalAuth, requireAuth } from "./auth.js";

afterEach(() => vi.resetAllMocks());
describe("authentication availability", () => {
  it.each([optionalAuth, requireAuth])("does not treat infrastructure failure as a guest", async (middleware) => {
    getSession.mockRejectedValue(new Error("db unavailable"));
    const handler = vi.fn((c) => c.text("ok"));
    const app = new Hono().use("*", middleware).get("/", handler);
    expect((await app.request("http://localhost/")).status).toBe(503);
    expect(handler).not.toHaveBeenCalled();
  });
  it("still allows a genuinely unauthenticated guest", async () => {
    getSession.mockResolvedValue(null);
    const app = new Hono().use("*", optionalAuth).get("/", (c) => c.text("ok"));
    expect((await app.request("http://localhost/")).status).toBe(200);
  });
});
