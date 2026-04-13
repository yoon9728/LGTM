import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "..", "..", "..", "..", ".env") });

import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  console.log("Running question table migration...");

  // Add new columns
  await sql`ALTER TABLE questions ADD COLUMN IF NOT EXISTS templates jsonb`;
  console.log("  ✓ templates column");

  await sql`ALTER TABLE questions ADD COLUMN IF NOT EXISTS guest boolean NOT NULL DEFAULT false`;
  console.log("  ✓ guest column");

  // Add composite indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_questions_cat_type_lang_diff ON questions(category, type, language, difficulty)`;
  console.log("  ✓ composite index (category, type, language, difficulty)");

  await sql`CREATE INDEX IF NOT EXISTS idx_questions_category ON questions(category)`;
  console.log("  ✓ category index");

  // Set guest=true for existing guest questions
  const guestIds = [
    "cr_security_001", "cr_performance_001",
    "sd_scalability_001",
    "debug_runtime_001",
    "da_sql_001",
    "pc_impl_001",
  ];
  for (const id of guestIds) {
    await sql`UPDATE questions SET guest = true WHERE id = ${id}`;
  }
  console.log(`  ✓ marked ${guestIds.length} guest questions`);

  console.log("Migration complete.");
}

migrate().catch(console.error);
