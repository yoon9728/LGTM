import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "..", "..", "..", ".env") });
import "./types.js"; // Register Hono context variable types
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import { sessionRoutes } from "./routes/sessions.js";
import { answerRoutes } from "./routes/answers.js";
import { questionRoutes } from "./routes/questions.js";
import { evaluationRoutes } from "./routes/evaluations.js";
import { historyRoutes } from "./routes/history.js";
import { statsRoutes } from "./routes/stats.js";
import { adminRoutes } from "./routes/admin.js";
import { getAuth } from "./auth.js";
import { rateLimit } from "./middleware/rate-limit.js";

// ── Startup validations ──
if (!process.env.OPENAI_API_KEY) {
  console.warn("WARNING: OPENAI_API_KEY is not set. Evaluations will fail.");
}
if (process.env.NODE_ENV === "production" && !process.env.WEB_ORIGIN) {
  throw new Error("WEB_ORIGIN must be set in production");
}
const authSecret = process.env.BETTER_AUTH_SECRET;
if (!authSecret || authSecret.length < 32) {
  console.warn("WARNING: BETTER_AUTH_SECRET is missing or too short (min 32 chars).");
}

const app = new Hono();

// Global body size limit — 512KB (prevents OOM from oversized payloads)
app.use("*", bodyLimit({ maxSize: 512 * 1024 }));

const allowedOrigins = (process.env.WEB_ORIGIN ?? "http://localhost:4173")
  .split(",")
  .map((o) => o.trim());

app.use("*", cors({
  origin: allowedOrigins,
  allowMethods: ["GET", "POST", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type"],
  credentials: true,
}));

// Better Auth handler — all /api/auth/* routes (before rate limit so auth isn't throttled)
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return getAuth().handler(c.req.raw);
});

app.get("/", (c) => c.json({ ok: true, service: "lgtm-api" }));
app.get("/health", (c) => c.json({ ok: true }));

// Global rate limit: 300 requests per minute per IP (excludes auth routes above)
app.use("/practice/*", rateLimit({ windowMs: 60_000, max: 300, keyPrefix: "global" }));
app.use("/users/*", rateLimit({ windowMs: 60_000, max: 300, keyPrefix: "global" }));
app.use("/admin/*", rateLimit({ windowMs: 60_000, max: 20, keyPrefix: "admin" }));

// Strict rate limit on answer submission (triggers OpenAI call)
app.use("/practice/answers", rateLimit({ windowMs: 60_000, max: 10, keyPrefix: "answers" }));

app.route("/practice/sessions", sessionRoutes);
app.route("/practice/answers", answerRoutes);
app.route("/practice/questions", questionRoutes);
app.route("/practice/evaluations", evaluationRoutes);
app.route("/practice/history", historyRoutes);
app.route("/users/me/stats", statsRoutes);
app.route("/admin", adminRoutes);

const port = Number(process.env.PORT ?? 4300);

serve({ fetch: app.fetch, port }, () => {
  console.log(`LGTM API → http://localhost:${port}`);
});
