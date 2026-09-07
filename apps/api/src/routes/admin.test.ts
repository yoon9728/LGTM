import { afterEach, describe, expect, it, vi } from "vitest";
import { isAdmin, validAdminInput } from "./admin.js";
afterEach(() => vi.unstubAllEnvs());
describe("admin identity", () => {
  it.each([null, [], { title: 4 }, { rubric: { mustCover: [1] } }, { tags: [null] }, { save: "true" }])("rejects malformed admin input %j", (value) => {
    expect(validAdminInput(value)).toBe(false);
  });
  it("rejects an unverified account that pre-registers an administrator email", () => {
    vi.stubEnv("ADMIN_EMAILS", "owner@example.test");
    expect(isAdmin({ id: "x", name: "Owner", email: "owner@example.test", emailVerified: false })).toBe(false);
  });
  it("reads configured verified administrators at request time", () => {
    vi.stubEnv("ADMIN_EMAILS", " owner@example.test ");
    expect(isAdmin({ id: "x", name: "Owner", email: "OWNER@example.test", emailVerified: true })).toBe(true);
    expect(isAdmin({ id: "x", name: "Owner", email: "other@example.test", emailVerified: true })).toBe(false);
  });
});
