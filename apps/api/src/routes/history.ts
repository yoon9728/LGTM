import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { getPgDb } from "../db/index.js";
import {
  sessions as sessionsTable,
  questions as questionsTable,
} from "../db/schema.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";
import { sessionEvaluationQueries } from "./session-evaluation.js";

export const historyRoutes = new Hono()
  .use("*", requireAuth)

  .get("/", async (c) => {
    const user = c.get("user") as AuthUser;
    const db = getPgDb();
    const { latest, latestScore } = sessionEvaluationQueries(db, user.id);

    const rows = await db
      .select({
        sessionId: sessionsTable.id,
        status: sessionsTable.status,
        createdAt: sessionsTable.createdAt,
        questionTitle: questionsTable.title,
        questionCategory: questionsTable.category,
        questionType: questionsTable.type,
        questionLanguage: questionsTable.language,
        score: latestScore,
      })
      .from(sessionsTable)
      .innerJoin(questionsTable, eq(sessionsTable.questionId, questionsTable.id))
      .leftJoin(latest, eq(latest.sessionId, sessionsTable.id))
      .where(eq(sessionsTable.userId, user.id))
      .orderBy(desc(sessionsTable.createdAt), desc(sessionsTable.id));

    const history = rows.map((r) => ({
      sessionId: r.sessionId,
      questionTitle: r.questionTitle,
      questionCategory: r.questionCategory,
      questionType: r.questionType,
      questionLanguage: r.questionLanguage ?? null,
      status: r.status,
      score: r.score ?? null,
      createdAt: r.createdAt.toISOString(),
    }));

    return c.json({ ok: true, history });
  });
