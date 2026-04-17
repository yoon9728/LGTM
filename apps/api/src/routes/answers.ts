import { Hono } from "hono";
import { db, type Answer } from "../data/store.js";
import { evaluate } from "../services/evaluation.js";
import { optionalAuth } from "../middleware/auth.js";
import { getRubric } from "../services/rubric-store.js";

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
      // cfa fields
      analysis?: string;
      recommendation?: string;
      reasoning?: string;
      // MCQ
      selectedAnswer?: string;
      // block editor structured data (optional, for richer evaluation)
      blocks?: { type: string; language?: string; content: string }[];
    }>();

    // Validation
    const errors: string[] = [];
    if (!body.sessionId) errors.push("sessionId is required.");

    // Input size limits (max 50KB per text field)
    const MAX_FIELD_LEN = 50_000;
    const textFields = [
      body.diff, body.summary, body.overview, body.components,
      body.tradeoffs, body.scalingStrategy, body.rootCause, body.evidence,
      body.proposedFix, body.query, body.explanation, body.optimization,
      body.code, body.approach, body.complexity,
      body.analysis, body.recommendation, body.reasoning,
    ];
    for (const field of textFields) {
      if (typeof field === "string" && field.length > MAX_FIELD_LEN) {
        errors.push(`Field exceeds maximum length of ${MAX_FIELD_LEN} characters.`);
        break;
      }
    }

    // Early session lookup — needed to detect MCQ questions by question.format
    const earlySession = body.sessionId ? await db.sessions.get(body.sessionId) : undefined;
    if (body.sessionId && !earlySession) {
      return c.json({ error: "Session not found" }, 404);
    }

    const isMcq = earlySession?.question?.format === "mcq";
    const cat = isMcq ? "mcq" : (body.category ?? "code_review");

    // Category-specific content validation
    let content: Record<string, unknown> = {};
    if (isMcq) {
      const selected = (body.selectedAnswer ?? "").trim().toUpperCase();
      const validLetters = ["A", "B", "C", "D", "E"];
      if (!selected) errors.push("selectedAnswer is required.");
      else if (!validLetters.includes(selected)) errors.push("selectedAnswer must be A, B, C, D, or E.");
      content = { selectedAnswer: selected };
    } else switch (cat) {
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
      case "cfa": {
        const analysis = (body.analysis ?? "").trim();
        const recommendation = (body.recommendation ?? "").trim();
        const reasoning = (body.reasoning ?? "").trim();
        if (!analysis) errors.push("analysis is required.");
        content = { analysis, recommendation, reasoning };
        break;
      }
      default: {
        const summary = (body.summary ?? "").trim();
        const findings = Array.isArray(body.findings) ? body.findings.filter(Boolean) : [];
        if (!summary && findings.length === 0) errors.push("Either summary or findings is required.");
        content = { summary, findings, diff: body.diff ?? "" };
      }
    }

    // Validate blocks array size
    if (body.blocks) {
      if (body.blocks.length > 20) errors.push("Too many blocks (max 20).");
      for (const block of body.blocks) {
        if (typeof block.content === "string" && block.content.length > MAX_FIELD_LEN) {
          errors.push("Block content exceeds maximum length.");
          break;
        }
      }
    }

    if (errors.length > 0) return c.json({ error: { code: "invalid_input", details: errors } }, 400);

    // Session was looked up earlier; ensure still present
    const session = earlySession;
    if (!session) return c.json({ error: "Session not found" }, 404);

    // Ownership check — only session owner or guest sessions allowed
    const user = c.get("user");
    const isOwner = session.candidateId === "guest" || user?.id === session.candidateId;
    if (!isOwner) return c.json({ error: "Forbidden" }, 403);

    // Duplicate guard
    if (await db.answers.findBySessionId(session.id)) {
      return c.json({ error: "An answer for this session already exists." }, 409);
    }

    // Always derive questionId from session — never trust client value
    const questionId = session.question.id;

    const answer = await db.answers.insert({
      id: crypto.randomUUID(),
      sessionId: session.id,
      questionId,
      review: content as Answer["review"],
      status: "submitted",
      createdAt: new Date().toISOString(),
    });

    if (body.sessionId) await db.sessions.updateStatus(body.sessionId, "answer_submitted");

    // Get question and resolve rubric (cached AI-generated, or generates on first use).
    // MCQ: skip both DB lookup and rubric resolution — exact-match eval doesn't need them,
    // and getRubric would otherwise call OpenAI every time since MCQ has an empty mustCover.
    let question = isMcq ? session.question : await db.questions.getById(answer.questionId);
    if (question && !isMcq) {
      const rubric = await getRubric(question);
      question = { ...question, rubric };
    }

    // Use session-level language (user's choice) over question-level language
    if (session?.language && question) {
      question = { ...question, language: session.language };
    }

    const evaluation = await evaluate(answer, question);
    return c.json({ ok: true, answer, evaluation }, 201);
  });
