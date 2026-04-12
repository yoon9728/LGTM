import { Hono } from "hono";
import * as questions from "../data/questions.js";
import { db } from "../data/store.js";
import { optionalAuth, type AuthUser } from "../middleware/auth.js";

export const questionRoutes = new Hono()
  .use("*", optionalAuth)

  .get("/", async (c) => {
    const user = c.get("user") as AuthUser | null;
    const isGuest = !user;
    const categoryFilter = c.req.query("category");
    const typeFilter = c.req.query("type");
    const languageFilter = c.req.query("language");

    let allQuestions = isGuest ? questions.getGuestQuestions() : questions.getAll();
    if (categoryFilter) {
      allQuestions = allQuestions.filter((q) => q.category === categoryFilter);
    }
    if (typeFilter) {
      allQuestions = allQuestions.filter((q) => q.type === typeFilter);
    }
    if (languageFilter) {
      allQuestions = allQuestions.filter((q) => q.language === languageFilter);
    }

    // Get best scores per question if authenticated
    let bestScores = new Map<string, number>();
    if (user) {
      bestScores = await db.evaluations.bestScoresByUser(user.id);
    }

    const result = allQuestions.map((q) => ({
      id: q.id,
      category: q.category,
      type: q.type,
      language: q.language ?? null,
      title: q.title,
      prompt: q.prompt,
      bestScore: bestScores.get(q.id) ?? null,
      completed: (bestScores.get(q.id) ?? 0) >= 90,
    }));

    // Group by category > type with counts
    const categories = new Map<string, Map<string, { total: number; completed: number }>>();
    for (const q of result) {
      if (!categories.has(q.category)) categories.set(q.category, new Map());
      const types = categories.get(q.category)!;
      const entry = types.get(q.type) ?? { total: 0, completed: 0 };
      entry.total++;
      if (q.completed) entry.completed++;
      types.set(q.type, entry);
    }

    // Convert to serializable object
    const categoryStats: Record<string, { total: number; completed: number; types: Record<string, { total: number; completed: number }> }> = {};
    for (const [cat, types] of categories) {
      let catTotal = 0;
      let catCompleted = 0;
      const typeStats: Record<string, { total: number; completed: number }> = {};
      for (const [type, stats] of types) {
        catTotal += stats.total;
        catCompleted += stats.completed;
        typeStats[type] = stats;
      }
      categoryStats[cat] = { total: catTotal, completed: catCompleted, types: typeStats };
    }

    return c.json({
      ok: true,
      questions: result,
      categoryStats,
    });
  })

  // Get category/type metadata
  .get("/meta", (c) => {
    return c.json({
      ok: true,
      categories: questions.CATEGORIES,
      languages: questions.LANGUAGES,
    });
  })

  .get("/:id", (c) => {
    const q = questions.getById(c.req.param("id"));
    if (!q) return c.json({ error: "Question not found" }, 404);
    // Strip rubric to prevent answer gaming
    const { rubric: _rubric, ...safeQuestion } = q;
    return c.json({ ok: true, question: safeQuestion });
  });
