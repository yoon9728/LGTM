import { Hono } from "hono";
import { db } from "../data/store.js";
import * as questions from "../data/questions.js";
import { evaluate } from "../services/evaluation.js";
import { optionalAuth, type AuthUser } from "../middleware/auth.js";
import { getClientIp } from "../lib/ip.js";
import { VALID_LANGUAGES } from "../lib/constants.js";

const GUEST_SESSION_LIMIT = 4;
const guestUsage = new Map<string, { count: number; resetAt: number }>();

// Per-session retry counter to prevent OpenAI cost abuse
const retryUsage = new Map<string, number>();

// Clean expired entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of guestUsage) {
    if (entry.resetAt <= now) guestUsage.delete(key);
  }
}, 10 * 60 * 1000).unref();

export const sessionRoutes = new Hono()
  .use("*", optionalAuth)

  .get("/", async (c) => {
    const user = c.get("user");
    if (user) {
      return c.json({ ok: true, sessions: await db.sessions.listByUser(user.id) });
    }
    return c.json({ ok: true, sessions: [] });
  })

  .post("/", async (c) => {
    const user = c.get("user");
    const isGuest = !user;
    const body = await c.req.json().catch(() => ({})) as {
      questionId?: string;
      category?: string;
      type?: string;
      language?: string;
    };

    // Server-side guest session limit
    if (isGuest) {
      const ip = getClientIp(c);
      const now = Date.now();
      const windowMs = 24 * 60 * 60 * 1000; // 24 hours
      let entry = guestUsage.get(ip);
      if (!entry || entry.resetAt <= now) {
        entry = { count: 0, resetAt: now + windowMs };
        guestUsage.set(ip, entry);
      }
      if (entry.count >= GUEST_SESSION_LIMIT) {
        return c.json({
          error: "Guest session limit reached. Sign up to continue practicing.",
          guestLimit: GUEST_SESSION_LIMIT,
        }, 429);
      }
      entry.count++;
    }

    let question;
    if (body.questionId) {
      question = questions.getById(body.questionId);
      if (!question) return c.json({ error: "Question not found" }, 404);
      if (isGuest && !question.guest) {
        return c.json({ error: "Authentication required for this question" }, 401);
      }
    } else {
      question = questions.getRandomByCategory(body.category, body.type, body.language, isGuest);
    }

    // For practical_coding: use requested language, or fall back to question's language
    const sessionLanguage = body.language ?? question.language ?? null;

    const session = await db.sessions.insert({
      id: crypto.randomUUID(),
      candidateId: user?.id ?? "guest",
      language: sessionLanguage,
      status: "question_ready",
      question,
      createdAt: new Date().toISOString(),
    });
    // Ensure templates are included (in-memory only)
    if (question.templates) session.question.templates = question.templates;
    return c.json({ ok: true, session, isGuest }, 201);
  })

  .patch("/:id", async (c) => {
    const user = c.get("user");
    const session = await db.sessions.get(c.req.param("id"));
    if (!session) return c.json({ error: "Session not found" }, 404);
    const isOwner = session.candidateId === "guest" || user?.id === session.candidateId;
    if (!isOwner) return c.json({ error: "Forbidden" }, 403);

    const body = await c.req.json<{ language?: string }>();
    if (body.language) {
      if (!VALID_LANGUAGES.has(body.language)) {
        return c.json({ error: "Invalid language" }, 400);
      }
      await db.sessions.updateLanguage(session.id, body.language);
      session.language = body.language;
    }
    return c.json({ ok: true, session });
  })

  .get("/:id", async (c) => {
    const user = c.get("user");
    const session = await db.sessions.get(c.req.param("id"));
    if (!session) return c.json({ error: "Session not found" }, 404);
    const isOwner = session.candidateId === "guest" || user?.id === session.candidateId;
    if (!isOwner) return c.json({ error: "Forbidden" }, 403);
    // Merge templates from in-memory (DB doesn't store templates)
    const inMemoryQ = questions.getById(session.question.id);
    if (inMemoryQ?.templates) {
      session.question.templates = inMemoryQ.templates;
    }
    return c.json({ ok: true, session });
  })

  .post("/:id/retry-evaluation", async (c) => {
    const user = c.get("user");
    const session = await db.sessions.get(c.req.param("id"));
    if (!session) return c.json({ error: "Session not found" }, 404);
    const isOwner = session.candidateId === "guest" || user?.id === session.candidateId;
    if (!isOwner) return c.json({ error: "Forbidden" }, 403);

    // Per-session retry rate limit (max 3 retries per session)
    const retryCount = retryUsage.get(session.id) ?? 0;
    if (retryCount >= 3) {
      return c.json({ error: "Retry limit reached for this session." }, 429);
    }

    const answer = await db.answers.findBySessionId(session.id);
    if (!answer) return c.json({ error: "No answer found. Submit an answer first." }, 422);

    const existing = await db.evaluations.findByAnswerId(answer.id);
    if (existing?.evaluable && existing.score != null) {
      return c.json({ ok: true, answer, evaluation: existing, reused: true });
    }

    retryUsage.set(session.id, retryCount + 1);
    const question = questions.getById(session.question.id);
    const evaluation = await evaluate(answer, question);
    return c.json({ ok: true, answer, evaluation, retried: true });
  });
