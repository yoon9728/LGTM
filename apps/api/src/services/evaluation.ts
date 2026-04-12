import { db, type Answer, type Evaluation, type CriterionResult } from "../data/store.js";
import type { Question } from "../data/questions.js";
import { buildSystemPrompt, buildUserMessage, getCategoryLabel } from "./prompt-factory.js";

function normalizeScore(score: unknown): number | null {
  if (typeof score !== "number" || Number.isNaN(score)) return null;
  if (score >= 0 && score <= 1) return Math.round(score * 100);
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v ?? "").trim()).filter(Boolean);
}

function normalizeCriteriaResults(value: unknown): CriterionResult[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is Record<string, unknown> => v != null && typeof v === "object")
    .map((v) => ({
      criterion: String(v.criterion ?? ""),
      coverage: (["covered", "partial", "missing"].includes(v.coverage as string)
        ? v.coverage
        : "missing") as CriterionResult["coverage"],
      evidence: String(v.evidence ?? ""),
    }))
    .filter((v) => v.criterion.length > 0);
}

async function callOpenAI(answer: Answer, question?: Question): Promise<Record<string, unknown>> {
  const apiKey = process.env.OPENAI_API_KEY ?? "";
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  if (!apiKey) {
    return {
      evaluable: false,
      reason: "provider_not_configured",
      score: null,
      strengths: [],
      weaknesses: ["OPENAI_API_KEY is not configured."],
      nextSteps: ["Set OPENAI_API_KEY to enable evaluation."],
      rationale: "OPENAI_API_KEY is not configured.",
      criteriaResults: [],
      provider: "openai-not-configured",
    };
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(question),
        },
        {
          role: "user",
          content: buildUserMessage(answer, question),
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`openai_http_${res.status}`);

  const payload = (await res.json()) as { choices: { message: { content: string } }[] };
  return JSON.parse(payload.choices[0]?.message?.content ?? "{}");
}

/**
 * Validate score against rubric coverage.
 * If the AI gave a score that's wildly inconsistent with criteria coverage, adjust it.
 */
function validateScoreAgainstCoverage(
  score: number | null,
  criteriaResults: CriterionResult[],
  rubric?: Question["rubric"],
): number | null {
  if (score == null || !rubric || criteriaResults.length === 0) return score;

  const total = criteriaResults.length;
  const covered = criteriaResults.filter((c) => c.coverage === "covered").length;
  const partial = criteriaResults.filter((c) => c.coverage === "partial").length;
  const coverageRatio = (covered + partial * 0.5) / total;

  // Expected score range based on coverage
  const expectedMin = Math.max(0, Math.round(coverageRatio * 100 - 20));
  const expectedMax = Math.min(100, Math.round(coverageRatio * 100 + 20));

  // If score is wildly off (>25 points from expected range), clamp it
  if (score > expectedMax + 25) {
    return expectedMax;
  }
  if (score < expectedMin - 25) {
    return expectedMin;
  }

  return score;
}

function withTimeout<T>(promise: Promise<T>, ms = 30_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("evaluation_timeout")), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

export async function evaluate(answer: Answer, question?: Question): Promise<Evaluation> {
  const base: Evaluation = {
    id: crypto.randomUUID(),
    answerId: answer.id,
    status: "completed",
    score: null,
    evaluable: true,
    reason: null,
    rationale: null,
    strengths: [],
    weaknesses: [],
    nextSteps: [],
    criteriaResults: [],
    provider: "unknown",
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  try {
    const result = await withTimeout(callOpenAI(answer, question));
    const evaluable = result.evaluable !== false;
    const criteria = normalizeCriteriaResults(result.criteriaResults);
    const rawScore = evaluable ? normalizeScore(result.score) : null;
    const validatedScore = validateScoreAgainstCoverage(rawScore, criteria, question?.rubric);

    return db.evaluations.insert({
      ...base,
      status: "completed",
      score: validatedScore,
      evaluable,
      reason: (result.reason as string) ?? null,
      rationale: String(result.rationale ?? "Evaluation completed."),
      strengths: normalizeArray(result.strengths),
      weaknesses: normalizeArray(result.weaknesses),
      nextSteps: normalizeArray(result.nextSteps),
      criteriaResults: criteria,
      provider: (result.provider as string) ?? "openai-live",
      completedAt: new Date().toISOString(),
    });
  } catch (err) {
    const isTimeout = err instanceof Error && err.message === "evaluation_timeout";
    return db.evaluations.insert({
      ...base,
      status: isTimeout ? "timeout" : "completed",
      evaluable: false,
      reason: isTimeout ? "evaluation_timeout" : "provider_failure",
      rationale: "The evaluation could not be completed.",
      criteriaResults: [],
      nextSteps: ["Retry the evaluation once the provider is healthy."],
      provider: "provider_failure_fallback",
      completedAt: new Date().toISOString(),
    });
  }
}
