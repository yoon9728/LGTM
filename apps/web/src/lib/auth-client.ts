import { createAuthClient } from "better-auth/react";

// Auth goes through Next.js rewrites (/api/auth/* → API server)
// so cookies are first-party — fixes mobile cross-site cookie blocking
export const authClient = createAuthClient({});

export const { signIn, signUp, signOut, useSession } = authClient;
