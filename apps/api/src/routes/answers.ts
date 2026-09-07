import { Hono } from "hono";
import { db, type Answer } from "../data/store.js";
import { evaluate } from "../services/evaluation.js";
import { optionalAuth } from "../middleware/auth.js";
import { getRubric } from "../services/rubric-store.js";

const MAX_FIELD_LEN = 50_000;
const TEXT_FIELDS = [
  "sessionId", "questionId", "category", "diff", "summary", "overview", "components",
  "tradeoffs", "scalingStrategy", "rootCause", "evidence", "proposedFix", "query",
  "explanation", "optimization", "code", "approach", "complexity", "analysis",
  "recommendation", "reasoning", "selectedAnswer",
] as const;

type AnswerInput = Partial<Record<typeof TEXT_FIELDS[number], string>> & {
  findings?: string[];
  blocks?: { type: "text" | "code"; language?: string; content: string }[];
};

function validateInput(value: unknown): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return ["Request body must be a JSON object."];
  }
  const body = value as Record<string, unknown>;
  const errors: string[] = [];
  for (const name of TEXT_FIELDS) {
    const field = body[name];
    const limit = ["sessionId", "questionId", "category"].includes(name) ? 200 : MAX_FIELD_LEN;
    if (field !== undefined && (typeof field !== "string" || field.length > limit)) {
      errors.push(`${name} must be a string of at most ${limit} characters.`);
    }
  }
  if (typeof body.sessionId !== "string" || !body.sessionId.trim()) {
    errors.push("sessionId is required.");
  }
  if (body.findings !== undefined && (
    !Array.isArray(body.findings) || body.findings.length > 100 ||
    body.findings.some((finding) => typeof finding !== "string" || finding.length > MAX_FIELD_LEN)
  )) {
    errors.push(`findings must contain at most 100 strings of at most ${MAX_FIELD_LEN} characters.`);
  }
  if (body.blocks !== undefined) {
    if (!Array.isArray(body.blocks) || body.blocks.length > 20) {
      errors.push("blocks must be an array with at most 20 items.");
    } else {
      for (const block of body.blocks) {
        if (!block || typeof block !== "object" || Array.isArray(block) ||
            !["text", "code"].includes(block.type) ||
            typeof block.content !== "string" || block.content.length > MAX_FIELD_LEN ||
            (block.language !== undefined && (
              typeof block.language !== "string" || !/^[a-zA-Z][a-zA-Z0-9_+#.-]{0,49}$/.test(block.language)
            ))) {
          errors.push("Each block must have a text/code type, string content, and an optional language identifier.");
          break;
        }
      }
    }
  }
  return errors;
}

export const answerRoutes = new Hono()
  .use("*", optionalAuth)

  .post("/", async (c) => {
    const input: unknown = await c.req.json().catch(() => undefined);
    const errors = validateInput(input);
    if (errors.length > 0) return c.json({ error: { code: "invalid_input", details: errors } }, 400);
    const body = input as AnswerInput;

    const session = await db.sessions.get(body.sessionId!);
    if (!session) return c.json({ error: "Session not found" }, 404);
    const user = c.get("user");
    const isOwner = session.candidateId === "guest" || user?.id === session.candidateId;
    if (!isOwner) return c.json({ error: "Forbidden" }, 403);

    const isMcq = session.question.format === "mcq";
    const cat = session.question.category;

    // Category-specific content validation
    let content: Record<string, unknown> = {};
    if (isMcq) {
      const selected = (body.selectedAnswer ?? "").trim().toUpperCase();
      const validLetters = ["A", "B", "C", "D", "E"].slice(0, session.question.choices?.length ?? 0);
      if (!selected) errors.push("selectedAnswer is required.");
      else if (!validLetters.includes(selected)) errors.push("selectedAnswer must match one of this question's choices.");
      content = { selectedAnswer: selected };
    } else switch (cat) {
      case "code_review": {
        const summary = (body.summary ?? "").trim();
        const findings = (body.findings ?? []).map((finding) => finding.trim()).filter(Boolean);
        if (!summary && findings.length === 0) errors.push("Either summary or findings is required.");
        content = { summary, findings, diff: session.question.diff };
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
        return c.json({ error: "Unsupported question category" }, 422);
      }
    }

    if (errors.length > 0) return c.json({ error: { code: "invalid_input", details: errors } }, 400);

    // Best-effort duplicate guard; cross-request safety requires a unique session_id constraint.
    if (await db.answers.findBySessionId(session.id)) {
      return c.json({ error: "An answer for this session already exists." }, 409);
    }

    // Always derive questionId from session — never trust client value
    const questionId = session.question.id;

    // Prepare grading before saving so a rubric failure cannot strand an ungraded answer behind a 409.
    // The session lookup already includes the canonical question. MCQ needs no generated rubric.
    let question = session.question;
    if (session.language) question = { ...question, language: session.language };
    if (!isMcq) {
      const rubric = await getRubric(question);
      question = { ...question, rubric };
    }

    const answer = await db.answers.insert({
      id: crypto.randomUUID(),
      sessionId: session.id,
      questionId,
      review: content as Answer["review"],
      status: "submitted",
      createdAt: new Date().toISOString(),
    });

    await db.sessions.updateStatus(session.id, "answer_submitted");

    const evaluation = await evaluate(answer, question);
    return c.json({ ok: true, answer, evaluation }, 201);
  });
