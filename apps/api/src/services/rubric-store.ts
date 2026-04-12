/**
 * In-memory rubric cache.
 *
 * - Lazily generates rubrics on first evaluation request via AI
 * - Caches in a Map so the same question always gets the same rubric
 * - invalidate(questionId) clears the cache → next access regenerates
 *
 * This eliminates two problems:
 *   1. Rubric generation variance (different rubric each evaluation)
 *   2. Extra API call on every evaluation
 */

import { generateRubric, type Rubric, type RubricInput } from "./rubric-generator.js";
import type { Question } from "../data/questions.js";

const cache = new Map<string, Rubric>();

/**
 * Get a rubric for a question.
 * Returns cached version if available, otherwise generates via AI and caches.
 * Falls back to the question's hand-written rubric if generation fails.
 */
export async function getRubric(question: Question): Promise<Rubric> {
  const cached = cache.get(question.id);
  if (cached) return cached;

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
    console.log(`[rubric-store] Generated and cached rubric for ${question.id} (${rubric.mustCover.length} mustCover)`);
    return rubric;
  } catch (err) {
    console.error(`[rubric-store] Generation failed for ${question.id}, using hand-written fallback:`, err);
    return question.rubric;
  }
}

/**
 * Invalidate cached rubric for a question.
 * Next getRubric() call will regenerate via AI.
 */
export function invalidate(questionId: string): void {
  const had = cache.delete(questionId);
  if (had) {
    console.log(`[rubric-store] Invalidated rubric cache for ${questionId}`);
  }
}

/**
 * Pre-warm rubric cache for a specific question.
 * Useful after admin creates/updates a question.
 */
export async function warmUp(question: Question): Promise<Rubric> {
  invalidate(question.id);
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
