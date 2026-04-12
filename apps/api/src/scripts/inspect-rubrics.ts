import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "..", "..", "..", "..", ".env") });

import { generateRubric } from "../services/rubric-generator.js";
import * as questions from "../data/questions.js";

// Generate rubric to verify quality after generator changes
const ids = ["pc_impl_001", "da_sql_002"];
const RUNS = 1;

for (const id of ids) {
  const q = questions.getById(id);
  if (!q) { console.log("NOT FOUND:", id); continue; }
  console.log("╔══ " + id + " (" + q.category + ") — " + RUNS + " runs ══╗");

  for (let run = 1; run <= RUNS; run++) {
    console.log(`\n--- Run ${run} ---`);
    try {
      const rubric = await generateRubric({
        category: q.category, type: q.type, title: q.title,
        prompt: q.prompt, diff: q.diff, language: q.language,
      });
      console.log("mustCover:");
      rubric.mustCover.forEach((c, i) => console.log("  " + (i+1) + ". " + c.slice(0, 120)));
      console.log("strongSignals: " + rubric.strongSignals.length);
      console.log("weakPatterns: " + rubric.weakPatterns.length);
    } catch(e) { console.log("ERROR:", (e as Error).message); }
  }
  console.log("\n");
}
