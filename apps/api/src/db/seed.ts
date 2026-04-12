import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "..", "..", "..", "..", ".env") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { questions as questionsTable } from "./schema.js";
import { getAll } from "../data/questions.js";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  console.log("Seeding questions...");

  const allQuestions = getAll();

  for (const q of allQuestions) {
    await db
      .insert(questionsTable)
      .values({
        id: q.id,
        category: q.category,
        type: q.type,
        language: q.language ?? null,
        title: q.title,
        prompt: q.prompt,
        diff: q.diff,
        rubric: q.rubric,
      })
      .onConflictDoNothing();
  }

  console.log(`Seeded ${allQuestions.length} questions.`);
}

seed().catch(console.error);
