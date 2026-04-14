import { createAuthClient } from "better-auth/react";

// Auth requests go through the Next.js proxy (/api/auth/*) so cookies
// are first-party — fixes mobile browsers blocking cross-site cookies.
const baseURL =
  process.env.NEXT_PUBLIC_WEB_URL ??
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:4173");

export const authClient = createAuthClient({ baseURL });

export const { signIn, signUp, signOut, useSession } = authClient;
