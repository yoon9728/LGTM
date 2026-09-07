import { Hono } from "hono";
import { db, type Session } from "../data/store.js";
import { evaluate } from "../services/evaluation.js";
import { optionalAuth } from "../middleware/auth.js";
import { getClientIp } from "../lib/ip.js";
import { VALID_LANGUAGES } from "../lib/constants.js";
import { getRubric } from "../services/rubric-store.js";

// Strip server-only fields from question so clients can't read the answer.
function sanitizeSession(session: Session): Session {
  const q = session.question;
  const { rubric: _rubric, correctAnswer: _correctAnswer, explanation: _explanation, ...safeQuestion } = q;
  return { ...session, question: safeQuestion as typeof q };
}

type SessionInput = Partial<Record<"questionId" | "category" | "type" | "language", string>>;

function isSessionInput(value: unknown): value is SessionInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const body = value as Record<string, unknown>;
  return ["questionId", "category", "type", "language"].every((key) =>
    body[key] === undefined || (
      typeof body[key] === "string" && body[key].trim().length > 0 && body[key].length <= 200
    ),
  ) && (body.language === undefined || VALID_LANGUAGES.has(body.language as string));
}

function hasLanguageTemplate(sessionQuestion: Session["question"], language: string): boolean {
  return !!sessionQuestion.templates &&
    Object.hasOwn(sessionQuestion.templates, language) &&
    typeof sessionQuestion.templates[language] === "string";
}

const GUEST_SESSION_LIMIT = 4;
const guestUsage = new Map<string, { count: number; resetAt: number }>();

// Per-session retry counter to prevent OpenAI cost abuse
const retryUsage = new Map<string, number>();
const retryInFlight = new Set<string>();

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
      const sessions = await db.sessions.listByUser(user.id);
      return c.json({ ok: true, sessions: sessions.map(sanitizeSession) });
    }
    return c.json({ ok: true, sessions: [] });
  })

  .post("/", async (c) => {
    const user = c.get("user");
    const isGuest = !user;
    const body: unknown = await c.req.json().catch(() => undefined);
    if (!isSessionInput(body)) return c.json({ error: "Invalid session input" }, 400);

    // Server-side guest session limit
    let reservation: { count: number; resetAt: number } | undefined;
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
      reservation = entry;
    }

    let created = false;
    try {
      let question;
      if (body.questionId) {
        question = await db.questions.getById(body.questionId);
        if (!question) return c.json({ error: "Question not found" }, 404);
        if (isGuest && !question.guest) {
          return c.json({ error: "Authentication required for this question" }, 401);
        }
      } else {
        question = await db.questions.getRandom({
          category: body.category,
          type: body.type,
          language: body.language,
          guestOnly: isGuest,
        });
        if (!question) return c.json({ error: "No questions available" }, 404);
      }

      if (body.language && question.category === "practical_coding" &&
          !hasLanguageTemplate(question, body.language)) {
        return c.json({ error: "Language is not supported by this question" }, 400);
      }

      // For practical_coding: use requested language, or fall back to question's language.
      const sessionLanguage = body.language ?? question.language ?? null;
      const session = await db.sessions.insert({
        id: crypto.randomUUID(),
        candidateId: user?.id ?? "guest",
        language: sessionLanguage,
        status: "question_ready",
        question,
        createdAt: new Date().toISOString(),
      });
      created = true;
      return c.json({ ok: true, session: sanitizeSession(session), isGuest }, 201);
    } finally {
      // Release this exact window's reservation, even if the IP's window has since expired.
      if (!created && reservation) reservation.count--;
    }
  })

  .patch("/:id", async (c) => {
    const body: unknown = await c.req.json().catch(() => undefined);
    if (!isSessionInput(body)) return c.json({ error: "Invalid session input" }, 400);
    const user = c.get("user");
    const session = await db.sessions.get(c.req.param("id"));
    if (!session) return c.json({ error: "Session not found" }, 404);
    const isOwner = session.candidateId === "guest" || user?.id === session.candidateId;
    if (!isOwner) return c.json({ error: "Forbidden" }, 403);

    if (body.language !== undefined) {
      if (session.question.category !== "practical_coding" ||
          !hasLanguageTemplate(session.question, body.language)) {
        return c.json({ error: "Language is not supported by this question" }, 400);
      }
      if (session.status !== "question_ready" || await db.answers.findBySessionId(session.id)) {
        return c.json({ error: "Language cannot be changed after submitting an answer" }, 409);
      }
      if (!await db.sessions.updateLanguage(session.id, body.language)) {
        return c.json({ error: "Language cannot be changed after submitting an answer" }, 409);
      }
      session.language = body.language;
    }
    return c.json({ ok: true, session: sanitizeSession(session) });
  })

  .get("/:id", async (c) => {
    const user = c.get("user");
    const session = await db.sessions.get(c.req.param("id"));
    if (!session) return c.json({ error: "Session not found" }, 404);
    const isOwner = session.candidateId === "guest" || user?.id === session.candidateId;
    if (!isOwner) return c.json({ error: "Forbidden" }, 403);
    return c.json({ ok: true, session: sanitizeSession(session) });
  })

  .get("/:id/result", async (c) => {
    const session = await db.sessions.get(c.req.param("id"));
    if (!session) return c.json({ error: "Session not found" }, 404);
    if (session.candidateId !== "guest" && c.get("user")?.id !== session.candidateId) {
      return c.json({ error: "Forbidden" }, 403);
    }
    const answer = await db.answers.findBySessionId(session.id);
    const evaluation = answer ? await db.evaluations.findByAnswerId(answer.id) : null;
    return c.json({ ok: true, answer: answer ?? null, evaluation: evaluation ?? null });
  })

  .post("/:id/retry-evaluation", async (c) => {
    const user = c.get("user");
    const session = await db.sessions.get(c.req.param("id"));
    if (!session) return c.json({ error: "Session not found" }, 404);
    const isOwner = session.candidateId === "guest" || user?.id === session.candidateId;
    if (!isOwner) return c.json({ error: "Forbidden" }, 403);

    const answer = await db.answers.findBySessionId(session.id);
    if (!answer) return c.json({ error: "No answer found. Submit an answer first." }, 422);

    const existing = await db.evaluations.findByAnswerId(answer.id);
    if (existing?.evaluable && existing.score != null) {
      return c.json({ ok: true, answer, evaluation: existing, reused: true });
    }

    // Re-read after async lookups; simultaneous requests must not reuse a stale count.
    const retryCount = retryUsage.get(session.id) ?? 0;
    if (retryCount >= 3) return c.json({ error: "Retry limit reached for this session." }, 429);
    if (retryInFlight.has(session.id)) return c.json({ error: "Evaluation is already in progress." }, 409);
    retryInFlight.add(session.id);
    retryUsage.set(session.id, retryCount + 1);
    try {
      let question = { ...session.question, ...(session.language ? { language: session.language } : {}) };
      if (question.format !== "mcq") question = { ...question, rubric: await getRubric(question) };
      const evaluation = await evaluate(answer, question);
      return c.json({ ok: true, answer, evaluation, retried: true });
    } finally {
      retryInFlight.delete(session.id);
    }
  });
