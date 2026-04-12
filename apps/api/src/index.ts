import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "..", "..", "..", ".env") });
import "./types.js"; // Register Hono context variable types
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { sessionRoutes } from "./routes/sessions.js";
import { answerRoutes } from "./routes/answers.js";
import { questionRoutes } from "./routes/questions.js";
import { evaluationRoutes } from "./routes/evaluations.js";
import { historyRoutes } from "./routes/history.js";
import { statsRoutes } from "./routes/stats.js";
import { adminRoutes } from "./routes/admin.js";
import { getAuth } from "./auth.js";
import { rateLimit } from "./middleware/rate-limit.js";

const app = new Hono();

app.use("*", cors({
  origin: process.env.WEB_ORIGIN ?? "http://localhost:4173",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type"],
  credentials: true,
}));

// Global rate limit: 100 requests per minute per IP
app.use("*", rateLimit({ windowMs: 60_000, max: 100, keyPrefix: "global" }));

// Strict rate limit on answer submission (triggers OpenAI call)
app.use("/practice/answers", rateLimit({ windowMs: 60_000, max: 10, keyPrefix: "answers" }));

app.get("/", (c) => c.json({ ok: true, service: "lgtm-api" }));
app.get("/health", (c) => c.json({ ok: true }));

// Better Auth handler — all /api/auth/* routes
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  return getAuth().handler(c.req.raw);
});

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
