/**
 * Rubric store with three-tier lookup:
 *
 *   1. In-memory cache (Map) — fastest, lost on restart
 *   2. Database (questions.rubric jsonb) — persists across restarts
 *   3. AI generation — generates fresh, saves to DB + cache
 *
 * Flow:
 *   getRubric(question)
 *     → check memory cache → hit? return
 *     → check DB → has AI-generated rubric? cache + return
 *     → generate via AI → save to DB + cache → return
 *     → fallback: hand-written rubric from question template
 */

import { eq } from "drizzle-orm";
import { generateRubric, type Rubric, type RubricInput } from "./rubric-generator.js";
import { getPgDb } from "../db/index.js";
import { questions as questionsTable } from "../db/schema.js";
import type { Question } from "../data/questions.js";

const cache = new Map<string, Rubric>();

function isValidRubric(r: unknown): r is Rubric {
  if (!r || typeof r !== "object") return false;
  const obj = r as Record<string, unknown>;
  return (
    Array.isArray(obj.mustCover) &&
    obj.mustCover.length > 0 &&
    Array.isArray(obj.strongSignals) &&
    Array.isArray(obj.weakPatterns)
  );
}

/**
 * Get a rubric for a question.
 * Checks: memory cache → DB → AI generation (saves to DB).
 * Falls back to hand-written rubric if everything fails.
 */
export async function getRubric(question: Question): Promise<Rubric> {
  // 1. Memory cache
  const cached = cache.get(question.id);
  if (cached) return cached;

  // 2. Database
  try {
    const [row] = await getPgDb()
      .select({ rubric: questionsTable.rubric })
      .from(questionsTable)
      .where(eq(questionsTable.id, question.id));

    if (row && isValidRubric(row.rubric)) {
      cache.set(question.id, row.rubric);
      console.log(`[rubric-store] Loaded rubric from DB for ${question.id}`);
      return row.rubric;
    }
  } catch (err) {
    console.warn(`[rubric-store] DB read failed for ${question.id}:`, err);
  }

  // 3. AI generation → save to DB + cache
  const input: RubricInput = {
    category: question.category,
    type: question.type,
    title: question.title,
    prompt: question.prompt,
    diff: question.diff || undefined,
    language: question.language,
  };

  try {
    const rubric = await generateRubric(input);
    cache.set(question.id, rubric);

    // Persist to DB (fire-and-forget, don't block evaluation)
    getPgDb()
      .update(questionsTable)
      .set({ rubric })
      .where(eq(questionsTable.id, question.id))
      .then(() => console.log(`[rubric-store] Saved rubric to DB for ${question.id}`))
      .catch((err) => console.warn(`[rubric-store] DB write failed for ${question.id}:`, err));

    console.log(`[rubric-store] Generated rubric for ${question.id} (${rubric.mustCover.length} mustCover)`);
    return rubric;
  } catch (err) {
    console.error(`[rubric-store] AI generation failed for ${question.id}, using hand-written fallback:`, err);
    return question.rubric;
  }
}

/**
 * Invalidate cached rubric for a question.
 * Next getRubric() call will check DB first, then regenerate if needed.
 */
export function invalidate(questionId: string): void {
  const had = cache.delete(questionId);
  if (had) {
    console.log(`[rubric-store] Invalidated cache for ${questionId}`);
  }
}

/**
 * Regenerate rubric: invalidate cache → generate fresh → save to DB + cache.
 */
export async function warmUp(question: Question): Promise<Rubric> {
  invalidate(question.id);

  // Clear DB rubric so getRubric doesn't load the old one
  try {
    await getPgDb()
      .update(questionsTable)
      .set({ rubric: {} })
      .where(eq(questionsTable.id, question.id));
  } catch {
    // DB clear failed — getRubric will still generate fresh since cache is empty
  }

  return getRubric(question);
}

/** Get current cache size (for diagnostics) */
export function size(): number {
  return cache.size;
}

/** Check if a question has a cached rubric */
export function has(questionId: string): boolean {
  return cache.has(questionId);
}
