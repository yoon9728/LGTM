import { db, type Answer, type Evaluation, type CriterionResult } from "../data/store.js";
import type { Question } from "../data/questions.js";
import { buildSystemPrompt, buildUserMessage, getCategoryLabel } from "./prompt-factory.js";

function normalizeScore(score: unknown): number | null {
  if (typeof score !== "number" || Number.isNaN(score)) return null;
  let s = score;
  if (s >= 0 && s <= 1) s = Math.round(s * 100);
  s = Math.max(0, Math.min(100, Math.round(s)));
  return s;
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
  const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";

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
      temperature: 0.1,
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
 * Determine the hard score ceiling based on criteria coverage pattern.
 * Mirrors the scoring guide table in the prompt.
 */
function getScoreCeiling(covered: number, partial: number, missing: number, total: number): number {
  if (covered === 0 && partial === 0) return 10;
  if (covered === 0 && partial === 1) return 22;
  if (covered === 0 && partial >= 2) return 38;
  if (covered === 1) return 52;
  if (covered === 2) return 68;
  if (covered >= 3 && covered < total) return 85;
  // All covered
  return 100;
}

/**
 * Validate score against rubric coverage.
 * Enforces the scoring guide table as a hard ceiling — the AI's score
 * cannot exceed the maximum allowed by the coverage pattern.
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
  const missing = criteriaResults.filter((c) => c.coverage === "missing").length;

  const ceiling = getScoreCeiling(covered, partial, missing, total);

  if (score > ceiling) {
    return ceiling;
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

  // MCQ: exact-match evaluation, no AI call.
  if (question?.format === "mcq" && question.correctAnswer) {
    const selected = String((answer.review as { selectedAnswer?: string }).selectedAnswer ?? "")
      .trim().toUpperCase();
    const correct = question.correctAnswer.trim().toUpperCase();
    const isCorrect = selected === correct;
    const score = isCorrect ? 100 : 0;
    const correctText = question.choices?.[correct.charCodeAt(0) - 65] ?? "";
    const selectedText = selected ? (question.choices?.[selected.charCodeAt(0) - 65] ?? "") : "";

    return db.evaluations.insert({
      ...base,
      status: "completed",
      score,
      evaluable: true,
      reason: null,
      rationale: isCorrect
        ? `Correct. ${question.explanation ?? ""}`.trim()
        : `Incorrect. You selected ${selected || "(none)"}${selectedText ? ` — "${selectedText}"` : ""}. The correct answer is ${correct}${correctText ? ` — "${correctText}"` : ""}. ${question.explanation ?? ""}`.trim(),
      strengths: isCorrect ? ["Correct concept identification."] : [],
      weaknesses: isCorrect ? [] : [`Selected ${selected || "(none)"} instead of ${correct}.`],
      nextSteps: isCorrect
        ? ["Move to the next question — review tougher items in this topic for depth."]
        : [`Review the explanation and the definition being tested (${question.title}).`],
      criteriaResults: [],
      provider: "mcq-exact-match",
      completedAt: new Date().toISOString(),
    });
  }

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
