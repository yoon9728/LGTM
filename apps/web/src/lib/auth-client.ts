import { createAuthClient } from "better-auth/react";

// Auth requests go through the Next.js proxy (/api/auth/*) so cookies
// are first-party — fixes mobile browsers blocking cross-site cookies.
export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
});

export const { signIn, signUp, signOut, useSession } = authClient;
