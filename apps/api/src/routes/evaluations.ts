import { Hono } from "hono";
import { db } from "../data/store.js";
import { optionalAuth, type AuthUser } from "../middleware/auth.js";

export const evaluationRoutes = new Hono()
  .use("*", optionalAuth)

  .get("/", async (c) => {
    const answerId = c.req.query("answerId");
    if (!answerId) {
      return c.json({ error: "answerId query parameter is required" }, 400);
    }
    const evaluation = await db.evaluations.findByAnswerId(answerId);
    if (!evaluation) return c.json({ error: "Evaluation not found" }, 404);
    return c.json({ ok: true, evaluation });
  })

  .get("/:id", async (c) => {
    const evaluation = await db.evaluations.get(c.req.param("id"));
    if (!evaluation) return c.json({ error: "Evaluation not found" }, 404);
    return c.json({ ok: true, evaluation });
  });
