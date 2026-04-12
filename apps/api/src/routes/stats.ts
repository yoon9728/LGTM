import { Hono } from "hono";
import { eq, and, sql, desc, gte } from "drizzle-orm";
import { getPgDb } from "../db/index.js";
import {
  sessions as sessionsTable,
  answers as answersTable,
  evaluations as evaluationsTable,
  questions as questionsTable,
} from "../db/schema.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";

export const statsRoutes = new Hono()
  .use("*", requireAuth)

  .get("/", async (c) => {
    const user = c.get("user") as AuthUser;
    const db = getPgDb();

    // 1. Category-level stats: avg score, session count per category
    const categoryStats = await db
      .select({
        category: questionsTable.category,
        sessionCount: sql<number>`COUNT(DISTINCT ${sessionsTable.id})`.as("session_count"),
        avgScore: sql<number>`ROUND(AVG(${evaluationsTable.score}))`.as("avg_score"),
        bestScore: sql<number>`MAX(${evaluationsTable.score})`.as("best_score"),
      })
      .from(sessionsTable)
      .innerJoin(questionsTable, eq(sessionsTable.questionId, questionsTable.id))
      .leftJoin(answersTable, eq(answersTable.sessionId, sessionsTable.id))
      .leftJoin(evaluationsTable, and(
        eq(evaluationsTable.answerId, answersTable.id),
        eq(evaluationsTable.status, "completed"),
      ))
      .where(eq(sessionsTable.userId, user.id))
      .groupBy(questionsTable.category);

    // 2. Score trend: recent 30 sessions with scores, ordered by date
    const scoreTrend = await db
      .select({
        sessionId: sessionsTable.id,
        category: questionsTable.category,
        score: evaluationsTable.score,
        createdAt: sessionsTable.createdAt,
      })
      .from(sessionsTable)
      .innerJoin(questionsTable, eq(sessionsTable.questionId, questionsTable.id))
      .innerJoin(answersTable, eq(answersTable.sessionId, sessionsTable.id))
      .innerJoin(evaluationsTable, and(
        eq(evaluationsTable.answerId, answersTable.id),
        eq(evaluationsTable.status, "completed"),
      ))
      .where(eq(sessionsTable.userId, user.id))
      .orderBy(desc(sessionsTable.createdAt))
      .limit(30);

    // 3. Recent sessions (last 10) with full details
    const recentSessions = await db
      .select({
        sessionId: sessionsTable.id,
        questionTitle: questionsTable.title,
        category: questionsTable.category,
        type: questionsTable.type,
        status: sessionsTable.status,
        score: evaluationsTable.score,
        createdAt: sessionsTable.createdAt,
      })
      .from(sessionsTable)
      .innerJoin(questionsTable, eq(sessionsTable.questionId, questionsTable.id))
      .leftJoin(answersTable, eq(answersTable.sessionId, sessionsTable.id))
      .leftJoin(evaluationsTable, and(
        eq(evaluationsTable.answerId, answersTable.id),
      ))
      .where(eq(sessionsTable.userId, user.id))
      .orderBy(desc(sessionsTable.createdAt))
      .limit(10);

    // 4. Streak calculation: count consecutive days with at least 1 session
    const dailySessions = await db
      .select({
        day: sql<string>`DATE(${sessionsTable.createdAt})`.as("day"),
      })
      .from(sessionsTable)
      .where(eq(sessionsTable.userId, user.id))
      .groupBy(sql`DATE(${sessionsTable.createdAt})`)
      .orderBy(desc(sql`DATE(${sessionsTable.createdAt})`));

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < dailySessions.length; i++) {
      const sessionDate = new Date(dailySessions[i].day);
      sessionDate.setHours(0, 0, 0, 0);

      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - i);

      if (sessionDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    // 5. Overall totals
    const [totals] = await db
      .select({
        totalSessions: sql<number>`COUNT(DISTINCT ${sessionsTable.id})`.as("total_sessions"),
        completedSessions: sql<number>`COUNT(DISTINCT CASE WHEN ${sessionsTable.status} = 'answer_submitted' THEN ${sessionsTable.id} END)`.as("completed_sessions"),
        avgScore: sql<number>`ROUND(AVG(${evaluationsTable.score}))`.as("avg_score"),
      })
      .from(sessionsTable)
      .leftJoin(answersTable, eq(answersTable.sessionId, sessionsTable.id))
      .leftJoin(evaluationsTable, and(
        eq(evaluationsTable.answerId, answersTable.id),
        eq(evaluationsTable.status, "completed"),
      ))
      .where(eq(sessionsTable.userId, user.id));

    return c.json({
      ok: true,
      stats: {
        overview: {
          totalSessions: totals?.totalSessions ?? 0,
          completedSessions: totals?.completedSessions ?? 0,
          avgScore: totals?.avgScore ?? null,
          streak,
        },
        categoryStats: categoryStats.map((r) => ({
          category: r.category,
          sessionCount: r.sessionCount,
          avgScore: r.avgScore,
          bestScore: r.bestScore,
        })),
        scoreTrend: scoreTrend.reverse().map((r) => ({
          sessionId: r.sessionId,
          category: r.category,
          score: r.score,
          date: r.createdAt.toISOString(),
        })),
        recentSessions: recentSessions.map((r) => ({
          sessionId: r.sessionId,
          questionTitle: r.questionTitle,
          category: r.category,
          type: r.type,
          status: r.status,
          score: r.score ?? null,
          date: r.createdAt.toISOString(),
        })),
      },
    });
  });
