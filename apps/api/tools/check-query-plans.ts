import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, sql } from "drizzle-orm";
import { sessions } from "../src/db/schema.js";
import { sessionEvaluationQueries } from "../src/routes/session-evaluation.js";

config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)), quiet: true });
try {
  const client = neon(process.env.DATABASE_URL!);
  const db = drizzle(client);
  const userId = "infrastructure-audit-no-user-00000000";
  const { latest, best, latestScore, bestScore } = sessionEvaluationQueries(db, userId);
  const query = db.select({
    average: sql`AVG(${latestScore})`, best: sql`MAX(${bestScore})`,
  }).from(sessions)
    .leftJoin(latest, eq(latest.sessionId, sessions.id))
    .leftJoin(best, eq(best.sessionId, sessions.id))
    .where(eq(sessions.userId, userId)).toSQL();
  await client.transaction([
    client.query("EXPLAIN " + query.sql, query.params),
  ], { readOnly: true, fetchOptions: { signal: AbortSignal.timeout(30_000) } });
  console.log(JSON.stringify({ check: "Postgres aggregate query plan", status: "PASS", writes: false, analyze: false }));
} catch (error) {
  console.error(JSON.stringify({ check: "Postgres aggregate query plan", status: "FAIL", code: (error as { code?: string }).code ?? "unknown" }));
  process.exitCode = 1;
}
