import { Hono } from "hono";
import { eq, and, sql, desc, isNotNull } from "drizzle-orm";
import { getPgDb } from "../db/index.js";
import {
  sessions as sessionsTable,
  questions as questionsTable,
} from "../db/schema.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";
import { sessionEvaluationQueries } from "./session-evaluation.js";

export const statsRoutes = new Hono()
  .use("*", requireAuth)

  .get("/", async (c) => {
    const user = c.get("user") as AuthUser;
    const db = getPgDb();
    const { latest, best, latestScore, bestScore } = sessionEvaluationQueries(db, user.id);

    // 1. Category-level stats: avg score, session count per category
    const categoryStats = await db
      .select({
        category: questionsTable.category,
        sessionCount: sql<number>`COUNT(${sessionsTable.id})`.mapWith(Number).as("session_count"),
        avgScore: sql<number | null>`ROUND(AVG(${latestScore}))`.mapWith(Number).as("avg_score"),
        bestScore: sql<number | null>`MAX(${bestScore})`.mapWith(Number).as("best_score"),
      })
      .from(sessionsTable)
      .innerJoin(questionsTable, eq(sessionsTable.questionId, questionsTable.id))
      .leftJoin(latest, eq(latest.sessionId, sessionsTable.id))
      .leftJoin(best, eq(best.sessionId, sessionsTable.id))
      .where(eq(sessionsTable.userId, user.id))
      .groupBy(questionsTable.category);

    // 2. Score trend: recent 30 sessions with scores, ordered by date
    const scoreTrend = await db
      .select({
        sessionId: sessionsTable.id,
        category: questionsTable.category,
        score: latestScore,
        createdAt: sessionsTable.createdAt,
      })
      .from(sessionsTable)
      .innerJoin(questionsTable, eq(sessionsTable.questionId, questionsTable.id))
      .innerJoin(latest, eq(latest.sessionId, sessionsTable.id))
      .where(and(eq(sessionsTable.userId, user.id), isNotNull(latestScore)))
      .orderBy(desc(sessionsTable.createdAt), desc(sessionsTable.id))
      .limit(30);

    // 3. Recent sessions (last 10) with full details
    const recentSessions = await db
      .select({
        sessionId: sessionsTable.id,
        questionTitle: questionsTable.title,
        category: questionsTable.category,
        type: questionsTable.type,
        status: sessionsTable.status,
        score: latestScore,
        createdAt: sessionsTable.createdAt,
      })
      .from(sessionsTable)
      .innerJoin(questionsTable, eq(sessionsTable.questionId, questionsTable.id))
      .leftJoin(latest, eq(latest.sessionId, sessionsTable.id))
      .where(eq(sessionsTable.userId, user.id))
      .orderBy(desc(sessionsTable.createdAt), desc(sessionsTable.id))
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
        totalSessions: sql<number>`COUNT(${sessionsTable.id})`.mapWith(Number).as("total_sessions"),
        completedSessions: sql<number>`COUNT(CASE WHEN ${sessionsTable.status} = 'answer_submitted' THEN ${sessionsTable.id} END)`.mapWith(Number).as("completed_sessions"),
        avgScore: sql<number | null>`ROUND(AVG(${latestScore}))`.mapWith(Number).as("avg_score"),
      })
      .from(sessionsTable)
      .leftJoin(latest, eq(latest.sessionId, sessionsTable.id))
      .where(eq(sessionsTable.userId, user.id));

    // 6. Total question count (for "X/52 solved" display)
    const [questionCounts] = await db
      .select({
        total: sql<number>`COUNT(*)`.mapWith(Number).as("total"),
      })
      .from(questionsTable);

    // 7. Solved questions (best score >= 90 per question)
    const solvedQuestions = await db
      .select({
        questionId: sessionsTable.questionId,
        bestScore: sql<number | null>`MAX(${bestScore})`.mapWith(Number).as("best_score"),
      })
      .from(sessionsTable)
      .innerJoin(best, eq(best.sessionId, sessionsTable.id))
      .where(eq(sessionsTable.userId, user.id))
      .groupBy(sessionsTable.questionId);

    const solvedCount = solvedQuestions.filter((q) => (q.bestScore ?? 0) >= 90).length;

    // 8. LGTM count (sessions with score = 100)
    const [lgtmResult] = await db
      .select({
        count: sql<number>`COUNT(${sessionsTable.id})`.mapWith(Number).as("lgtm_count"),
      })
      .from(sessionsTable)
      .innerJoin(latest, eq(latest.sessionId, sessionsTable.id))
      .where(and(
        eq(sessionsTable.userId, user.id),
        sql`${latestScore} = 100`,
      ));

    // 9. Weakest category (lowest avg score with at least 1 session)
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
          lgtmCount: lgtmResult?.count ?? 0,
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
    const { latest, best, latestScore, bestScore } = sessionEvaluationQueries(db, user.id);

    // 1. Category overview: avg, best, session count, solved count
    const [overview] = await db
      .select({
        sessionCount: sql<number>`COUNT(${sessionsTable.id})`.mapWith(Number).as("session_count"),
        completedCount: sql<number>`COUNT(CASE WHEN ${sessionsTable.status} = 'answer_submitted' THEN ${sessionsTable.id} END)`.mapWith(Number).as("completed_count"),
        avgScore: sql<number | null>`ROUND(AVG(${latestScore}))`.mapWith(Number).as("avg_score"),
        bestScore: sql<number | null>`MAX(${bestScore})`.mapWith(Number).as("best_score"),
      })
      .from(sessionsTable)
      .innerJoin(questionsTable, eq(sessionsTable.questionId, questionsTable.id))
      .leftJoin(latest, eq(latest.sessionId, sessionsTable.id))
      .leftJoin(best, eq(best.sessionId, sessionsTable.id))
      .where(and(
        eq(sessionsTable.userId, user.id),
        eq(questionsTable.category, category),
      ));

    // Total questions in this category
    const [qCount] = await db
      .select({ total: sql<number>`COUNT(*)`.mapWith(Number).as("total") })
      .from(questionsTable)
      .where(eq(questionsTable.category, category));

    // Solved (best >= 90)
    const solvedInCat = await db
      .select({
        questionId: sessionsTable.questionId,
        bestScore: sql<number | null>`MAX(${bestScore})`.mapWith(Number).as("best_score"),
      })
      .from(sessionsTable)
      .innerJoin(questionsTable, eq(sessionsTable.questionId, questionsTable.id))
      .innerJoin(best, eq(best.sessionId, sessionsTable.id))
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
        score: latestScore,
        createdAt: sessionsTable.createdAt,
        type: questionsTable.type,
      })
      .from(sessionsTable)
      .innerJoin(questionsTable, eq(sessionsTable.questionId, questionsTable.id))
      .innerJoin(latest, eq(latest.sessionId, sessionsTable.id))
      .where(and(
        eq(sessionsTable.userId, user.id),
        eq(questionsTable.category, category),
        isNotNull(latestScore),
      ))
      .orderBy(desc(sessionsTable.createdAt), desc(sessionsTable.id))
      .limit(30);

    // 3. Sub-topic breakdown
    const subtopicStats = await db
      .select({
        type: questionsTable.type,
        sessionCount: sql<number>`COUNT(${sessionsTable.id})`.mapWith(Number).as("session_count"),
        avgScore: sql<number | null>`ROUND(AVG(${latestScore}))`.mapWith(Number).as("avg_score"),
        bestScore: sql<number | null>`MAX(${bestScore})`.mapWith(Number).as("best_score"),
      })
      .from(sessionsTable)
      .innerJoin(questionsTable, eq(sessionsTable.questionId, questionsTable.id))
      .leftJoin(latest, eq(latest.sessionId, sessionsTable.id))
      .leftJoin(best, eq(best.sessionId, sessionsTable.id))
      .where(and(
        eq(sessionsTable.userId, user.id),
        eq(questionsTable.category, category),
      ))
      .groupBy(questionsTable.type);

    // Total questions per type
    const typeQuestionCounts = await db
      .select({
        type: questionsTable.type,
        total: sql<number>`COUNT(*)`.mapWith(Number).as("total"),
      })
      .from(questionsTable)
      .where(eq(questionsTable.category, category))
      .groupBy(questionsTable.type);

    const typeCountMap = new Map(typeQuestionCounts.map((t) => [t.type, t.total]));

    // 4. Criteria insights from each session's latest valid evaluation only.
    const criteriaRows = await db
      .select({
        criteriaResults: latest.criteriaResults,
      })
      .from(sessionsTable)
      .innerJoin(latest, eq(latest.sessionId, sessionsTable.id))
      .innerJoin(questionsTable, eq(sessionsTable.questionId, questionsTable.id))
      .where(and(
        eq(sessionsTable.userId, user.id),
        eq(questionsTable.category, category),
        isNotNull(latestScore),
      ));

    // Aggregate criteria: count how often each criterion label was covered vs missed
    const criteriaMap = new Map<string, { covered: number; total: number }>();
    for (const row of criteriaRows) {
      const results: unknown = row.criteriaResults;
      if (!Array.isArray(results)) continue;
      const seen = new Set<string>();
      for (const cr of results) {
        if (cr === null || typeof cr !== "object" || typeof cr.criterion !== "string" ||
            !["covered", "partial", "missing"].includes(cr.coverage)) continue;
        const label = cr.criterion.trim();
        if (!label || seen.has(label)) continue;
        seen.add(label);
        const existing = criteriaMap.get(label) ?? { covered: 0, total: 0 };
        existing.total++;
        if (cr.coverage === "covered") existing.covered++;
        criteriaMap.set(label, existing);
      }
    }

    const criteriaInsights = Array.from(criteriaMap.entries())
      .map(([label, stats]) => ({ label, covered: stats.covered, total: stats.total, rate: stats.total > 0 ? stats.covered / stats.total : 0 }))
      .sort((a, b) => b.total - a.total); // most-seen first

    const mostCovered = criteriaInsights.filter((c) => c.rate >= 0.6).sort((a, b) => b.rate - a.rate).slice(0, 5);
    const mostMissed = criteriaInsights.filter((c) => c.rate < 0.6).sort((a, b) => a.rate - b.rate).slice(0, 5);

    // 5. All sessions in this category, with the same latest-attempt score as history.
    const allSessionsRaw = await db
      .select({
        sessionId: sessionsTable.id,
        questionTitle: questionsTable.title,
        type: questionsTable.type,
        status: sessionsTable.status,
        score: latestScore,
        createdAt: sessionsTable.createdAt,
      })
      .from(sessionsTable)
      .innerJoin(questionsTable, eq(sessionsTable.questionId, questionsTable.id))
      .leftJoin(latest, eq(latest.sessionId, sessionsTable.id))
      .where(and(
        eq(sessionsTable.userId, user.id),
        eq(questionsTable.category, category),
      ))
      .orderBy(desc(sessionsTable.createdAt), desc(sessionsTable.id));

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
        totalQuestions: typeCountMap.get(r.type) ?? 0,
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
