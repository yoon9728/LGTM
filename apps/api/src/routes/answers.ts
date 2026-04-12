import { Hono } from "hono";
import { db, type Answer } from "../data/store.js";
import * as questions from "../data/questions.js";
import { evaluate } from "../services/evaluation.js";
import { optionalAuth, type AuthUser } from "../middleware/auth.js";

export const answerRoutes = new Hono()
  .use("*", optionalAuth)

  .post("/", async (c) => {
    const body = await c.req.json<{
      sessionId?: string;
      questionId?: string;
      category?: string;
      // code_review fields
      diff?: string;
      summary?: string;
      findings?: string[];
      // system_design fields
      overview?: string;
      components?: string;
      tradeoffs?: string;
      scalingStrategy?: string;
      // debugging fields
      rootCause?: string;
      evidence?: string;
      proposedFix?: string;
      // data_analysis fields
      query?: string;
      explanation?: string;
      optimization?: string;
      // practical_coding fields
      code?: string;
      approach?: string;
      complexity?: string;
      // block editor structured data (optional, for richer evaluation)
      blocks?: { type: string; language?: string; content: string }[];
    }>();

    // Validation
    const errors: string[] = [];
    if (!body.sessionId) errors.push("sessionId is required.");
    if (!body.questionId) errors.push("questionId is required.");

    // Input size limits (max 50KB per text field)
    const MAX_FIELD_LEN = 50_000;
    const textFields = [
      body.diff, body.summary, body.overview, body.components,
      body.tradeoffs, body.scalingStrategy, body.rootCause, body.evidence,
      body.proposedFix, body.query, body.explanation, body.optimization,
      body.code, body.approach, body.complexity,
    ];
    for (const field of textFields) {
      if (typeof field === "string" && field.length > MAX_FIELD_LEN) {
        errors.push(`Field exceeds maximum length of ${MAX_FIELD_LEN} characters.`);
        break;
      }
    }

    const cat = body.category ?? "code_review";

    // Category-specific content validation
    let content: Record<string, unknown> = {};
    switch (cat) {
      case "code_review": {
        if (!body.diff?.trim()) errors.push("diff is required.");
        const summary = (body.summary ?? "").trim();
        const findings = Array.isArray(body.findings) ? body.findings.filter(Boolean) : [];
        if (!summary && findings.length === 0) errors.push("Either summary or findings is required.");
        content = { summary, findings, diff: body.diff ?? "" };
        break;
      }
      case "system_design": {
        const overview = (body.overview ?? "").trim();
        const components = (body.components ?? "").trim();
        const tradeoffs = (body.tradeoffs ?? "").trim();
        const scalingStrategy = (body.scalingStrategy ?? "").trim();
        if (!overview && !components) errors.push("At least overview or components is required.");
        content = { overview, components, tradeoffs, scalingStrategy };
        break;
      }
      case "debugging": {
        const rootCause = (body.rootCause ?? "").trim();
        const evidence = (body.evidence ?? "").trim();
        const proposedFix = (body.proposedFix ?? "").trim();
        if (!rootCause) errors.push("rootCause is required.");
        content = { rootCause, evidence, proposedFix };
        if (body.blocks) content.blocks = body.blocks;
        break;
      }
      case "data_analysis": {
        const query = (body.query ?? "").trim();
        const explanation = (body.explanation ?? "").trim();
        const optimization = (body.optimization ?? "").trim();
        if (!query && !explanation) errors.push("At least query or explanation is required.");
        content = { query, explanation, optimization };
        if (body.blocks) content.blocks = body.blocks;
        break;
      }
      case "practical_coding": {
        const code = (body.code ?? "").trim();
        const approach = (body.approach ?? "").trim();
        const complexity = (body.complexity ?? "").trim();
        if (!code) errors.push("code is required.");
        content = { code, approach, complexity };
        if (body.blocks) content.blocks = body.blocks;
        break;
      }
      default: {
        const summary = (body.summary ?? "").trim();
        const findings = Array.isArray(body.findings) ? body.findings.filter(Boolean) : [];
        if (!summary && findings.length === 0) errors.push("Either summary or findings is required.");
        content = { summary, findings, diff: body.diff ?? "" };
      }
    }

    if (errors.length > 0) return c.json({ error: { code: "invalid_input", details: errors } }, 400);

    // Duplicate guard
    if (body.sessionId && await db.answers.findBySessionId(body.sessionId)) {
      return c.json({ error: "An answer for this session already exists." }, 409);
    }

    const session = body.sessionId ? await db.sessions.get(body.sessionId) : undefined;

    // Ownership check — only session owner or guest sessions allowed
    if (session) {
      const user = c.get("user") as AuthUser | null;
      if (session.candidateId !== "guest" && user?.id !== session.candidateId) {
        return c.json({ error: "Forbidden" }, 403);
      }
    }

    const answer = await db.answers.insert({
      id: crypto.randomUUID(),
      sessionId: body.sessionId ?? "",
      questionId: body.questionId ?? session?.question?.id ?? "",
      review: content as Answer["review"],
      status: "submitted",
      createdAt: new Date().toISOString(),
    });

    if (body.sessionId) await db.sessions.updateStatus(body.sessionId, "answer_submitted");

    const question = questions.getById(answer.questionId);
    const evaluation = await evaluate(answer, question);
    return c.json({ ok: true, answer, evaluation }, 201);
  });
