import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getPgDb } from "../db/index.js";
import {
  sessions as sessionsTable,
  answers as answersTable,
  evaluations as evaluationsTable,
  questions as questionsTable,
} from "../db/schema.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";

export const historyRoutes = new Hono()
  .use("*", requireAuth)

  .get("/", async (c) => {
    const user = c.get("user") as AuthUser;

    const rows = await getPgDb()
      .select({
        sessionId: sessionsTable.id,
        status: sessionsTable.status,
        createdAt: sessionsTable.createdAt,
        questionTitle: questionsTable.title,
        questionCategory: questionsTable.category,
        questionType: questionsTable.type,
        questionLanguage: questionsTable.language,
        score: evaluationsTable.score,
      })
      .from(sessionsTable)
      .innerJoin(questionsTable, eq(sessionsTable.questionId, questionsTable.id))
      .leftJoin(answersTable, eq(answersTable.sessionId, sessionsTable.id))
      .leftJoin(evaluationsTable, eq(evaluationsTable.answerId, answersTable.id))
      .where(eq(sessionsTable.userId, user.id));

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
