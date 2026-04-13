import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "..", "..", "..", "..", ".env") });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { questions as questionsTable } from "./schema.js";
import { getAll } from "../data/questions.js";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function updateExisting() {
  console.log("Updating existing questions with templates and guest flags...");

  const allQuestions = getAll();
  let updated = 0;

  for (const q of allQuestions) {
    await db
      .update(questionsTable)
      .set({
        templates: q.templates ?? null,
        guest: q.guest ?? false,
        difficulty: q.difficulty ?? "medium",
        language: q.language ?? null,
      })
      .where(eq(questionsTable.id, q.id));
    updated++;
  }

  console.log(`Updated ${updated} questions.`);
}

updateExisting().catch(console.error);
