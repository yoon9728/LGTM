import type { Context, Next } from "hono";
import { getAuth } from "../auth.js";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
}

/**
 * Optional auth middleware — sets c.get("user") if authenticated, null otherwise.
 * Does NOT block unauthenticated requests.
 */
export async function optionalAuth(c: Context, next: Next) {
  try {
    const session = await getAuth().api.getSession({
      headers: c.req.raw.headers,
    });
    if (session?.user) {
      c.set("user", session.user as AuthUser);
    } else {
      c.set("user", null);
    }
  } catch {
    return c.json({ error: "Authentication service is temporarily unavailable" }, 503);
  }
  await next();
}

/**
 * Required auth middleware — blocks unauthenticated requests with 401.
 */
export async function requireAuth(c: Context, next: Next) {
  try {
    const session = await getAuth().api.getSession({
      headers: c.req.raw.headers,
    });
    if (!session?.user) {
      return c.json({ error: "Authentication required" }, 401);
    }
    c.set("user", session.user as AuthUser);
  } catch {
    return c.json({ error: "Authentication service is temporarily unavailable" }, 503);
  }
  await next();
}
