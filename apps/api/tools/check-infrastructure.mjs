import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { fileURLToPath } from "node:url";

config({ path: fileURLToPath(new URL("../../../.env", import.meta.url)), quiet: true });

// Deliberately excludes user rows, credentials, writes, seeds and migrations.
try {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not configured");
  const sql = neon(process.env.DATABASE_URL);
  const results = await sql.transaction([
    sql`SELECT 1 AS connected, current_setting('transaction_read_only') AS read_only`,
    sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name`,
    sql`SELECT count(*)::int AS questions, count(*) FILTER (WHERE guest)::int AS guest_questions FROM questions`,
    sql`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position`,
    sql`SELECT count(*)::int AS duplicate_session_groups FROM (SELECT session_id FROM answers GROUP BY session_id HAVING count(*) > 1) d`,
  ], { readOnly: true, fetchOptions: { signal: AbortSignal.timeout(30_000) } });
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
} catch (error) {
  // Driver messages can contain connection details: emit only a diagnostic code.
  console.error(JSON.stringify({ database: "unreachable", name: error.name, code: error.code ?? "connection_failed" }));
  process.exitCode = 1;
}
