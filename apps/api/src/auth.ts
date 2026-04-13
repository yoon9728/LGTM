import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getPgDb } from "./db/index.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _auth: any = null;

export function getAuth() {
  if (!_auth) {
    const googleId = process.env.GOOGLE_CLIENT_ID;
    const googleSecret = process.env.GOOGLE_CLIENT_SECRET;

    _auth = betterAuth({
      database: drizzleAdapter(getPgDb(), {
        provider: "pg",
      }),
      emailAndPassword: {
        enabled: true,
      },
      ...(googleId && googleSecret
        ? {
            socialProviders: {
              google: {
                clientId: googleId,
                clientSecret: googleSecret,
              },
            },
          }
        : {}),
      trustedOrigins: (process.env.WEB_ORIGIN ?? "http://localhost:4173")
        .split(",")
        .map((o) => o.trim()),
    });
  }
  return _auth;
}
