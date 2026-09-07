import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  turbopack: { root: process.cwd() },
  // Vercel's adapter packages the app; standalone needs traces it does not emit.
  // Keep standalone output for the Dockerfile and other self-hosted builds.
  output: process.env.VERCEL === "1" ? undefined : "standalone",
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
              "img-src 'self' data: https:",
              "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net data:",
              `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4300"} https://cdn.jsdelivr.net`,
              "worker-src blob: https://cdn.jsdelivr.net",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
