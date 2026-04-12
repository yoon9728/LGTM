import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { getPgDb } from "../db/index.js";
import { questions as questionsTable } from "../db/schema.js";
import { requireAuth, type AuthUser } from "../middleware/auth.js";
import { generateRubric } from "../services/rubric-generator.js";

// Admin emails — in production, use a role-based system
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean);

function isAdmin(user: AuthUser): boolean {
  return ADMIN_EMAILS.includes(user.email);
}

export const adminRoutes = new Hono()
  .use("*", requireAuth)
  .use("*", async (c, next) => {
    const user = c.get("user") as AuthUser;
    if (!isAdmin(user)) {
      return c.json({ error: "Admin access required" }, 403);
    }
    await next();
  })

  // List all questions from DB
  .get("/questions", async (c) => {
    const rows = await getPgDb().select().from(questionsTable);
    return c.json({ ok: true, questions: rows });
  })

  // Get single question
  .get("/questions/:id", async (c) => {
    const [row] = await getPgDb()
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.id, c.req.param("id")));
    if (!row) return c.json({ error: "Question not found" }, 404);
    return c.json({ ok: true, question: row });
  })

  // Generate rubric (preview — does not save)
  .post("/questions/generate-rubric", async (c) => {
    const body = await c.req.json<{
      category: string;
      type: string;
      title: string;
      prompt: string;
      diff?: string;
      language?: string;
    }>();

    const errors: string[] = [];
    if (!body.category) errors.push("category is required");
    if (!body.type) errors.push("type is required");
    if (!body.title) errors.push("title is required");
    if (!body.prompt) errors.push("prompt is required");
    if (errors.length > 0) return c.json({ error: { code: "invalid_input", details: errors } }, 400);

    try {
      const rubric = await generateRubric(body);
      return c.json({ ok: true, rubric });
    } catch (err) {
      console.error("Rubric generation failed:", err);
      return c.json({ error: "Rubric generation failed. Check server logs." }, 500);
    }
  })

  // Regenerate rubric for an existing question
  .post("/questions/:id/generate-rubric", async (c) => {
    const id = c.req.param("id");
    const [existing] = await getPgDb()
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.id, id));
    if (!existing) return c.json({ error: "Question not found" }, 404);

    const body = await c.req.json<{ save?: boolean }>().catch(() => ({}));
    const shouldSave = (body as { save?: boolean }).save === true;

    try {
      const rubric = await generateRubric({
        category: existing.category,
        type: existing.type,
        title: existing.title,
        prompt: existing.prompt,
        diff: existing.diff,
        language: existing.language ?? undefined,
      });

      if (shouldSave) {
        await getPgDb()
          .update(questionsTable)
          .set({ rubric })
          .where(eq(questionsTable.id, id));
      }

      return c.json({ ok: true, rubric, saved: shouldSave });
    } catch (err) {
      console.error("Rubric generation failed:", err);
      return c.json({ error: "Rubric generation failed. Check server logs." }, 500);
    }
  })

  // Create question (auto-generates rubric if not provided)
  .post("/questions", async (c) => {
    const body = await c.req.json<{
      id?: string;
      category: string;
      type: string;
      language?: string;
      title: string;
      prompt: string;
      diff: string;
      difficulty?: string;
      tags?: string[];
      rubric?: {
        mustCover: string[];
        strongSignals: string[];
        weakPatterns: string[];
      };
    }>();

    // Validation
    const errors: string[] = [];
    if (!body.category) errors.push("category is required");
    if (!body.type) errors.push("type is required");
    if (!body.title) errors.push("title is required");
    if (!body.prompt) errors.push("prompt is required");
    if (errors.length > 0) return c.json({ error: { code: "invalid_input", details: errors } }, 400);

    // Auto-generate rubric if not provided
    let rubric = body.rubric;
    let rubricGenerated = false;
    if (!rubric?.mustCover?.length) {
      try {
        rubric = await generateRubric({
          category: body.category,
          type: body.type,
          title: body.title,
          prompt: body.prompt,
          diff: body.diff,
          language: body.language,
        });
        rubricGenerated = true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return c.json({ error: `Auto rubric generation failed: ${msg}` }, 500);
      }
    }

    const id = body.id ?? crypto.randomUUID();

    const [row] = await getPgDb()
      .insert(questionsTable)
      .values({
        id,
        category: body.category,
        type: body.type,
        language: body.language ?? null,
        title: body.title,
        prompt: body.prompt,
        diff: body.diff ?? "",
        difficulty: body.difficulty ?? "medium",
        tags: body.tags ?? [],
        rubric,
      })
      .returning();

    return c.json({ ok: true, question: row, rubricGenerated }, 201);
  })

  // Update question
  .put("/questions/:id", async (c) => {
    const id = c.req.param("id");
    const body = await c.req.json<{
      category?: string;
      type?: string;
      language?: string;
      title?: string;
      prompt?: string;
      diff?: string;
      difficulty?: string;
      tags?: string[];
      rubric?: {
        mustCover: string[];
        strongSignals: string[];
        weakPatterns: string[];
      };
    }>();

    // Check exists
    const [existing] = await getPgDb()
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.id, id));
    if (!existing) return c.json({ error: "Question not found" }, 404);

    // Build update object — only include provided fields
    const updates: Record<string, unknown> = {};
    if (body.category !== undefined) updates.category = body.category;
    if (body.type !== undefined) updates.type = body.type;
    if (body.language !== undefined) updates.language = body.language;
    if (body.title !== undefined) updates.title = body.title;
    if (body.prompt !== undefined) updates.prompt = body.prompt;
    if (body.diff !== undefined) updates.diff = body.diff;
    if (body.difficulty !== undefined) updates.difficulty = body.difficulty;
    if (body.tags !== undefined) updates.tags = body.tags;
    if (body.rubric !== undefined) updates.rubric = body.rubric;

    if (Object.keys(updates).length === 0) {
      return c.json({ error: "No fields to update" }, 400);
    }

    const [row] = await getPgDb()
      .update(questionsTable)
      .set(updates)
      .where(eq(questionsTable.id, id))
      .returning();

    return c.json({ ok: true, question: row });
  })

  // Delete question
  .delete("/questions/:id", async (c) => {
    const id = c.req.param("id");
    const [existing] = await getPgDb()
      .select({ id: questionsTable.id })
      .from(questionsTable)
      .where(eq(questionsTable.id, id));
    if (!existing) return c.json({ error: "Question not found" }, 404);

    await getPgDb().delete(questionsTable).where(eq(questionsTable.id, id));
    return c.json({ ok: true, deleted: id });
  });
