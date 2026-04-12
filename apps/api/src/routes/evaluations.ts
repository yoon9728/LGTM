import { Hono } from "hono";
import { db } from "../data/store.js";
import { optionalAuth } from "../middleware/auth.js";

/** Check if the caller owns the session associated with an answer */
async function checkAnswerOwnership(c: { get: (key: string) => unknown }, answerId: string): Promise<boolean> {
  const answer = await db.answers.get(answerId);
  if (!answer) return false;
  const session = await db.sessions.get(answer.sessionId);
  if (!session) return false;
  if (session.candidateId === "guest") return true;
  const user = c.get("user") as { id: string } | null;
  return user?.id === session.candidateId;
}

export const evaluationRoutes = new Hono()
  .use("*", optionalAuth)

  .get("/", async (c) => {
    const answerId = c.req.query("answerId");
    if (!answerId) {
      return c.json({ error: "answerId query parameter is required" }, 400);
    }
    const evaluation = await db.evaluations.findByAnswerId(answerId);
    if (!evaluation) return c.json({ error: "Evaluation not found" }, 404);
    if (!await checkAnswerOwnership(c, evaluation.answerId)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    return c.json({ ok: true, evaluation });
  })

  .get("/:id", async (c) => {
    const evaluation = await db.evaluations.get(c.req.param("id"));
    if (!evaluation) return c.json({ error: "Evaluation not found" }, 404);
    if (!await checkAnswerOwnership(c, evaluation.answerId)) {
      return c.json({ error: "Forbidden" }, 403);
    }
    return c.json({ ok: true, evaluation });
  });
