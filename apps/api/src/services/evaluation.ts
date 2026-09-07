import { db, type Answer, type Evaluation, type CriterionResult } from "../data/store.js";
import type { Question } from "../data/questions.js";
import { buildSystemPrompt, buildUserMessage } from "./prompt-factory.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function invalidResponse(): never {
  throw new Error("evaluation_invalid_response");
}

function normalizeScore(score: unknown): number {
  if (typeof score !== "number" || !Number.isFinite(score)) return invalidResponse();
  // The provider contract is 0-100; 1 is one point, not a fractional perfect score.
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeArray(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) {
    return invalidResponse();
  }
  return value.map((v: string) => v.trim()).filter(Boolean);
}

function normalizeCriteriaResults(value: unknown, rubric?: Question["rubric"]): CriterionResult[] {
  const expected = rubric?.mustCover ?? [];
  const names = expected.map((criterion) => criterion.trim());
  if (!Array.isArray(value) || value.length !== expected.length ||
      names.some((name) => !name) || new Set(names).size !== names.length) {
    return invalidResponse();
  }

  const byCriterion = new Map<string, CriterionResult>();
  for (const item of value) {
    if (!isRecord(item) || typeof item.criterion !== "string" ||
        typeof item.evidence !== "string" || !item.evidence.trim() ||
        (item.coverage !== "covered" && item.coverage !== "partial" && item.coverage !== "missing")) {
      return invalidResponse();
    }
    const name = item.criterion.trim();
    if (!names.includes(name) || byCriterion.has(name)) return invalidResponse();
    byCriterion.set(name, {
      criterion: name,
      coverage: item.coverage,
      evidence: item.evidence.trim(),
    });
  }

  // Persist the authoritative rubric wording and order, never invented criteria.
  return expected.map((criterion, index) => ({ ...byCriterion.get(names[index])!, criterion }));
}

async function callOpenAI(answer: Answer, question: Question | undefined, signal: AbortSignal): Promise<unknown> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(question) },
        { role: "user", content: buildUserMessage(answer, question) },
      ],
    }),
  });

  if (!res.ok) throw new Error(`openai_http_${res.status}`);

  let payload: unknown;
  try {
    payload = await res.json();
  } catch (error) {
    if (error instanceof SyntaxError) return invalidResponse();
    throw error;
  }
  if (!isRecord(payload) || !Array.isArray(payload.choices)) return invalidResponse();
  const choice: unknown = payload.choices[0];
  if (!isRecord(choice) || !isRecord(choice.message)) return invalidResponse();
  if (choice.message.refusal != null || choice.finish_reason === "content_filter") {
    throw new Error("evaluation_refused");
  }
  if (choice.finish_reason !== "stop" || typeof choice.message.content !== "string") {
    return invalidResponse();
  }
  try {
    return JSON.parse(choice.message.content);
  } catch {
    return invalidResponse();
  }
}

function validateScoreAgainstCoverage(score: number, criteria: CriterionResult[]): number {
  const total = criteria.length;
  if (total === 0) return score;
  const covered = criteria.filter((c) => c.coverage === "covered").length;
  const partial = criteria.filter((c) => c.coverage === "partial").length;

  // Full coverage takes precedence, including rubrics with only one or two items.
  if (covered === total) return score;
  const ceiling = covered === 0
    ? (partial === 0 ? 10 : partial === 1 ? 22 : 38)
    : covered === 1 ? 52 : covered === 2 ? 68 : 85;
  return Math.min(score, ceiling);
}

async function withTimeout<T>(operation: (signal: AbortSignal) => Promise<T>, ms = 30_000): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error("evaluation_timeout"));
      controller.abort();
    }, ms);
  });
  try {
    // Covers both response headers and body consumption, even if a provider ignores abort.
    return await Promise.race([operation(controller.signal), timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

function normalizeResult(result: unknown, question?: Question): Partial<Evaluation> {
  if (!isRecord(result) || typeof result.evaluable !== "boolean" ||
      (result.reason !== null && typeof result.reason !== "string") ||
      typeof result.rationale !== "string" || !result.rationale.trim()) {
    return invalidResponse();
  }
  if (!result.evaluable && (typeof result.reason !== "string" || !result.reason.trim())) {
    return invalidResponse();
  }

  const criteria = result.evaluable ? normalizeCriteriaResults(result.criteriaResults, question?.rubric) : [];
  return {
    evaluable: result.evaluable,
    score: result.evaluable ? validateScoreAgainstCoverage(normalizeScore(result.score), criteria) : null,
    reason: result.evaluable ? null : (result.reason as string).trim(),
    rationale: result.rationale.trim(),
    strengths: normalizeArray(result.strengths),
    weaknesses: normalizeArray(result.weaknesses),
    nextSteps: normalizeArray(result.nextSteps),
    criteriaResults: criteria,
    provider: "openai-live",
  };
}

export async function evaluate(answer: Answer, question?: Question): Promise<Evaluation> {
  const base: Evaluation = {
    id: crypto.randomUUID(),
    answerId: answer.id,
    status: "completed",
    score: null,
    evaluable: false,
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

  // MCQ must never fall through to AI, including malformed stored questions.
  if (question?.format === "mcq") {
    const choices = question.choices;
    const correct = typeof question.correctAnswer === "string" ? question.correctAnswer.trim().toUpperCase() : "";
    const selected = typeof answer.review.selectedAnswer === "string" ? answer.review.selectedAnswer.trim().toUpperCase() : "";
    const validQuestion = Array.isArray(choices) && choices.length >= 2 && choices.length <= 5 &&
      choices.every((choice) => typeof choice === "string" && choice.trim()) &&
      /^[A-E]$/.test(correct) && correct.charCodeAt(0) - 65 < choices.length;
    const validSelection = validQuestion && /^[A-E]$/.test(selected) && selected.charCodeAt(0) - 65 < choices.length;

    if (!validQuestion || !validSelection) {
      return db.evaluations.insert({
        ...base,
        reason: validQuestion ? "invalid_mcq_answer" : "invalid_mcq_question",
        rationale: "The multiple-choice evaluation could not be completed because its question or selection is invalid.",
        provider: "mcq-exact-match",
        completedAt: new Date().toISOString(),
      });
    }

    const isCorrect = selected === correct;
    const correctText = choices[correct.charCodeAt(0) - 65];
    const selectedText = choices[selected.charCodeAt(0) - 65];
    return db.evaluations.insert({
      ...base,
      score: isCorrect ? 100 : 0,
      evaluable: true,
      rationale: isCorrect
        ? `Correct. ${question.explanation ?? ""}`.trim()
        : `Incorrect. You selected ${selected} - "${selectedText}". The correct answer is ${correct} - "${correctText}". ${question.explanation ?? ""}`.trim(),
      strengths: isCorrect ? ["Correct concept identification."] : [],
      weaknesses: isCorrect ? [] : [`Selected ${selected} instead of ${correct}.`],
      nextSteps: isCorrect
        ? ["Move to the next question - review tougher items in this topic for depth."]
        : [`Review the explanation and the definition being tested (${question.title}).`],
      provider: "mcq-exact-match",
      completedAt: new Date().toISOString(),
    });
  }

  let evaluation = base;
  if (!process.env.OPENAI_API_KEY?.trim()) {
    evaluation = {
      ...base,
      reason: "provider_not_configured",
      rationale: "The evaluation provider is not configured.",
      nextSteps: ["Retry once the evaluation provider is configured."],
      provider: "openai-not-configured",
    };
  } else {
    try {
      const result = await withTimeout((signal) => callOpenAI(answer, question, signal));
      evaluation = { ...base, ...normalizeResult(result, question) };
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      const reason = ["evaluation_timeout", "evaluation_refused", "evaluation_invalid_response"].includes(message)
        ? message : "provider_failure";
      evaluation = {
        ...base,
        status: reason === "evaluation_timeout" ? "timeout" : "completed",
        reason,
        rationale: "The evaluation could not be completed.",
        nextSteps: ["Retry the evaluation once the provider is healthy."],
        provider: "provider_failure_fallback",
      };
    }
  }

  // Storage failures must propagate, not be misreported or retried as provider failures.
  return db.evaluations.insert({ ...evaluation, completedAt: new Date().toISOString() });
}
