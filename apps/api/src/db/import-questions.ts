/**
 * Import questions from a JSON file into the database.
 *
 * Usage:
 *   npx tsx apps/api/src/db/import-questions.ts <path-to-json>
 *
 * JSON format: array of question objects
 * [
 *   {
 *     "id": "cr_js_e001",
 *     "category": "code_review",
 *     "type": "security_review",
 *     "difficulty": "easy",
 *     "language": "javascript",
 *     "title": "...",
 *     "prompt": "...",
 *     "diff": "...",
 *     "guest": false,
 *     "rubric": { "mustCover": [...], "strongSignals": [...], "weakPatterns": [...] }
 *   }
 * ]
 *
 * After importing, DELETE the JSON file — it should never be committed to git.
 */

import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "..", "..", "..", "..", ".env") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { questions as questionsTable } from "./schema.js";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

interface QuestionInput {
  id: string;
  category: string;
  type: string;
  difficulty?: string;
  language?: string;
  title: string;
  prompt: string;
  diff?: string;
  rubric: {
    mustCover: string[];
    strongSignals: string[];
    weakPatterns: string[];
  };
  templates?: Record<string, string>;
  guest?: boolean;
  tags?: string[];
}

async function importQuestions(filePath: string) {
  const raw = readFileSync(filePath, "utf-8");
  const questions: QuestionInput[] = JSON.parse(raw);

  if (!Array.isArray(questions)) {
    console.error("ERROR: JSON must be an array of question objects");
    process.exit(1);
  }

  console.log(`Importing ${questions.length} questions from ${filePath}...`);

  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const q of questions) {
    // Validate required fields
    if (!q.id || !q.category || !q.type || !q.title || !q.prompt || !q.rubric) {
      errors.push(`SKIP ${q.id ?? "unknown"}: missing required fields`);
      skipped++;
      continue;
    }
    if (!q.rubric.mustCover?.length) {
      errors.push(`SKIP ${q.id}: rubric.mustCover is empty`);
      skipped++;
      continue;
    }

    try {
      await db
        .insert(questionsTable)
        .values({
          id: q.id,
          category: q.category,
          type: q.type,
          difficulty: q.difficulty ?? "medium",
          language: q.language ?? null,
          title: q.title,
          prompt: q.prompt,
          diff: q.diff ?? "",
          rubric: q.rubric,
          templates: q.templates ?? null,
          guest: q.guest ?? false,
          tags: q.tags ?? [],
        })
        .onConflictDoNothing();
      inserted++;
    } catch (err) {
      errors.push(`ERROR ${q.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  console.log(`\nResult: ${inserted} inserted, ${skipped} skipped`);
  if (errors.length > 0) {
    console.log("\nErrors:");
    for (const e of errors) console.log(`  ${e}`);
  }
  console.log(`\n⚠️  DELETE the JSON file now: rm ${filePath}`);
}

// CLI
const filePath = process.argv[2];
if (!filePath) {
  console.error("Usage: npx tsx apps/api/src/db/import-questions.ts <path-to-json>");
  process.exit(1);
}

importQuestions(resolve(filePath)).catch(console.error);
