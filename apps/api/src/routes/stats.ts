import { Hono } from "hono";
import { eq, and, sql, desc } from "drizzle-orm";
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

    // 6. Total question count (for "X/52 solved" display)
    const [questionCounts] = await db
      .select({
        total: sql<number>`COUNT(*)`.as("total"),
      })
      .from(questionsTable);

    // 7. Solved questions (best score >= 90 per question)
    const solvedQuestions = await db
      .select({
        questionId: sessionsTable.questionId,
        bestScore: sql<number>`MAX(${evaluationsTable.score})`.as("best_score"),
      })
      .from(sessionsTable)
      .innerJoin(answersTable, eq(answersTable.sessionId, sessionsTable.id))
      .innerJoin(evaluationsTable, and(
        eq(evaluationsTable.answerId, answersTable.id),
        eq(evaluationsTable.status, "completed"),
      ))
      .where(eq(sessionsTable.userId, user.id))
      .groupBy(sessionsTable.questionId);

    const solvedCount = solvedQuestions.filter((q) => (q.bestScore ?? 0) >= 90).length;

    // 8. Weakest category (lowest avg score with at least 1 session)
    const scoredCategories = categoryStats.filter((c) => c.avgScore != null);
    const weakestCategory = scoredCategories.length > 0
      ? scoredCategories.reduce((min, c) => (c.avgScore! < min.avgScore! ? c : min))
      : null;

    return c.json({
      ok: true,
      stats: {
        overview: {
          totalSessions: totals?.totalSessions ?? 0,
          completedSessions: totals?.completedSessions ?? 0,
          avgScore: totals?.avgScore ?? null,
          streak,
          totalQuestions: questionCounts?.total ?? 0,
          solvedQuestions: solvedCount,
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
        weakestCategory: weakestCategory
          ? { category: weakestCategory.category, avgScore: weakestCategory.avgScore }
          : null,
      },
    });
  })

  // ── Category Detail ──
  .get("/:category", async (c) => {
    const user = c.get("user") as AuthUser;
    const db = getPgDb();
    const category = c.req.param("category");

    // 1. Category overview: avg, best, session count, solved count
    const [overview] = await db
      .select({
        sessionCount: sql<number>`COUNT(DISTINCT ${sessionsTable.id})`.as("session_count"),
        completedCount: sql<number>`COUNT(DISTINCT CASE WHEN ${sessionsTable.status} = 'answer_submitted' THEN ${sessionsTable.id} END)`.as("completed_count"),
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
      .where(and(
        eq(sessionsTable.userId, user.id),
        eq(questionsTable.category, category),
      ));

    // Total questions in this category
    const [qCount] = await db
      .select({ total: sql<number>`COUNT(*)`.as("total") })
      .from(questionsTable)
      .where(eq(questionsTable.category, category));

    // Solved (best >= 90)
    const solvedInCat = await db
      .select({
        questionId: sessionsTable.questionId,
        bestScore: sql<number>`MAX(${evaluationsTable.score})`.as("best_score"),
      })
      .from(sessionsTable)
      .innerJoin(questionsTable, eq(sessionsTable.questionId, questionsTable.id))
      .innerJoin(answersTable, eq(answersTable.sessionId, sessionsTable.id))
      .innerJoin(evaluationsTable, and(
        eq(evaluationsTable.answerId, answersTable.id),
        eq(evaluationsTable.status, "completed"),
      ))
      .where(and(
        eq(sessionsTable.userId, user.id),
        eq(questionsTable.category, category),
      ))
      .groupBy(sessionsTable.questionId);

    const solvedInCatCount = solvedInCat.filter((q) => (q.bestScore ?? 0) >= 90).length;

    // 2. Score trend for this category
    const scoreTrend = await db
      .select({
        sessionId: sessionsTable.id,
        score: evaluationsTable.score,
        createdAt: sessionsTable.createdAt,
        type: questionsTable.type,
      })
      .from(sessionsTable)
      .innerJoin(questionsTable, eq(sessionsTable.questionId, questionsTable.id))
      .innerJoin(answersTable, eq(answersTable.sessionId, sessionsTable.id))
      .innerJoin(evaluationsTable, and(
        eq(evaluationsTable.answerId, answersTable.id),
        eq(evaluationsTable.status, "completed"),
      ))
      .where(and(
        eq(sessionsTable.userId, user.id),
        eq(questionsTable.category, category),
      ))
      .orderBy(desc(sessionsTable.createdAt))
      .limit(30);

    // 3. Sub-topic breakdown
    const subtopicStats = await db
      .select({
        type: questionsTable.type,
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
      .where(and(
        eq(sessionsTable.userId, user.id),
        eq(questionsTable.category, category),
      ))
      .groupBy(questionsTable.type);

    // Total questions per type
    const typeQuestionCounts = await db
      .select({
        type: questionsTable.type,
        total: sql<number>`COUNT(*)`.as("total"),
      })
      .from(questionsTable)
      .where(eq(questionsTable.category, category))
      .groupBy(questionsTable.type);

    const typeCountMap: Record<string, number> = {};
    for (const t of typeQuestionCounts) typeCountMap[t.type] = t.total;

    // 4. Criteria insights — aggregate criteriaResults across all evaluations in this category
    const criteriaRows = await db
      .select({
        criteriaResults: evaluationsTable.criteriaResults,
      })
      .from(evaluationsTable)
      .innerJoin(answersTable, eq(evaluationsTable.answerId, answersTable.id))
      .innerJoin(sessionsTable, eq(answersTable.sessionId, sessionsTable.id))
      .innerJoin(questionsTable, eq(sessionsTable.questionId, questionsTable.id))
      .where(and(
        eq(sessionsTable.userId, user.id),
        eq(questionsTable.category, category),
        eq(evaluationsTable.status, "completed"),
      ));

    // Aggregate criteria: count how often each criterion label was covered vs missed
    const criteriaMap = new Map<string, { covered: number; total: number }>();
    for (const row of criteriaRows) {
      const results = row.criteriaResults as Array<{ label: string; met: boolean }>;
      if (!Array.isArray(results)) continue;
      for (const cr of results) {
        const label = cr.label;
        if (!label) continue;
        const existing = criteriaMap.get(label) ?? { covered: 0, total: 0 };
        existing.total++;
        if (cr.met) existing.covered++;
        criteriaMap.set(label, existing);
      }
    }

    const criteriaInsights = Array.from(criteriaMap.entries())
      .map(([label, stats]) => ({ label, covered: stats.covered, total: stats.total, rate: stats.total > 0 ? stats.covered / stats.total : 0 }))
      .sort((a, b) => b.total - a.total); // most-seen first

    const mostCovered = criteriaInsights.filter((c) => c.rate >= 0.6).sort((a, b) => b.rate - a.rate).slice(0, 5);
    const mostMissed = criteriaInsights.filter((c) => c.rate < 0.6).sort((a, b) => a.rate - b.rate).slice(0, 5);

    // 5. All sessions in this category (deduplicated — pick best score per session)
    const allSessionsRaw = await db
      .select({
        sessionId: sessionsTable.id,
        questionTitle: questionsTable.title,
        type: questionsTable.type,
        status: sessionsTable.status,
        score: sql<number>`MAX(${evaluationsTable.score})`.as("score"),
        createdAt: sessionsTable.createdAt,
      })
      .from(sessionsTable)
      .innerJoin(questionsTable, eq(sessionsTable.questionId, questionsTable.id))
      .leftJoin(answersTable, eq(answersTable.sessionId, sessionsTable.id))
      .leftJoin(evaluationsTable, and(
        eq(evaluationsTable.answerId, answersTable.id),
        eq(evaluationsTable.status, "completed"),
      ))
      .where(and(
        eq(sessionsTable.userId, user.id),
        eq(questionsTable.category, category),
      ))
      .groupBy(sessionsTable.id, questionsTable.title, questionsTable.type, sessionsTable.status, sessionsTable.createdAt)
      .orderBy(desc(sessionsTable.createdAt));

    return c.json({
      ok: true,
      overview: {
        sessionCount: overview?.sessionCount ?? 0,
        completedCount: overview?.completedCount ?? 0,
        avgScore: overview?.avgScore ?? null,
        bestScore: overview?.bestScore ?? null,
        totalQuestions: qCount?.total ?? 0,
        solvedQuestions: solvedInCatCount,
      },
      scoreTrend: scoreTrend.reverse().map((r) => ({
        sessionId: r.sessionId,
        score: r.score,
        type: r.type,
        date: r.createdAt.toISOString(),
      })),
      subtopicStats: subtopicStats.map((r) => ({
        type: r.type,
        sessionCount: r.sessionCount,
        avgScore: r.avgScore,
        bestScore: r.bestScore,
        totalQuestions: typeCountMap[r.type] ?? 0,
      })),
      criteriaInsights: {
        mostCovered,
        mostMissed,
      },
      sessions: allSessionsRaw.map((r) => ({
        sessionId: r.sessionId,
        questionTitle: r.questionTitle,
        type: r.type,
        status: r.status,
        score: r.score ?? null,
        date: r.createdAt.toISOString(),
      })),
    });
  });
