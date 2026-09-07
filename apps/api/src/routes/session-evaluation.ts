import { desc, eq, sql } from "drizzle-orm";
import type { getPgDb } from "../db/index.js";
import { answers, evaluations, sessions } from "../db/schema.js";

export function sessionEvaluationQueries(db: ReturnType<typeof getPgDb>, userId: string) {
  const validScore = sql<number | null>`CASE WHEN ${evaluations.status} = 'completed'
    AND ${evaluations.evaluable} = true AND ${evaluations.score} BETWEEN 0 AND 100
    THEN ${evaluations.score} ELSE NULL END`;

  // Select the latest attempt before checking evaluability: a failed retry must not
  // silently display an older score. The ID makes equal timestamps deterministic.
  const latest = db.selectDistinctOn([answers.sessionId], {
    sessionId: answers.sessionId,
    score: validScore.mapWith(Number).as("latest_score"),
    criteriaResults: evaluations.criteriaResults,
  })
    .from(answers)
    .innerJoin(evaluations, eq(evaluations.answerId, answers.id))
    .innerJoin(sessions, eq(sessions.id, answers.sessionId))
    .where(eq(sessions.userId, userId))
    .orderBy(answers.sessionId, desc(evaluations.createdAt), desc(evaluations.id))
    .as("latest_evaluation");

  // Best-ever scores are only for explicitly named best/solved metrics.
  const best = db.select({
    sessionId: answers.sessionId,
    score: sql<number | null>`MAX(${validScore})`.mapWith(Number).as("best_score"),
  })
    .from(answers)
    .innerJoin(evaluations, eq(evaluations.answerId, answers.id))
    .innerJoin(sessions, eq(sessions.id, answers.sessionId))
    .where(eq(sessions.userId, userId))
    .groupBy(answers.sessionId)
    .as("best_evaluation");

  // Drizzle's SQL.Aliased subquery fields render as bare identifiers. Qualify
  // these expressions explicitly so joins cannot make score references ambiguous.
  const latestScore = sql<number | null>`${sql.identifier("latest_evaluation")}.${sql.identifier("latest_score")}`.mapWith(Number);
  const bestScore = sql<number | null>`${sql.identifier("best_evaluation")}.${sql.identifier("best_score")}`.mapWith(Number);
  return { latest, best, latestScore, bestScore };
}
