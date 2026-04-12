import type { AuthUser } from "./middleware/auth.js";

// Register Hono context variables for type safety
declare module "hono" {
  interface ContextVariableMap {
    user: AuthUser | null;
  }
}
