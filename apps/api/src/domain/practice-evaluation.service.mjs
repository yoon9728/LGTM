function normalizeScore(score) {
  if (typeof score !== "number" || Number.isNaN(score)) return null;
  if (score >= 0 && score <= 1) return Math.round(score * 100);
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function createEvaluationState(answer) {
  return {
    id: `evaluation_${Date.now()}`,
    answerId: answer?.id || null,
    status: "queued",
    score: null,
    strengths: [],
    weaknesses: [],
    nextSteps: [],
    evaluable: true,
    reason: null,
    rationale: null,
    provider: null,
    createdAt: new Date().toISOString()
  };
}

export function markEvaluationCompleted(evaluation, result = {}) {
  const evaluable = result.evaluable !== false;
  return {
    ...evaluation,
    status: result.status || "completed",
    score: evaluable ? normalizeScore(result.score) : null,
    strengths: Array.isArray(result.strengths) ? result.strengths : [],
    weaknesses: Array.isArray(result.weaknesses) ? result.weaknesses : [],
    nextSteps: Array.isArray(result.nextSteps) ? result.nextSteps : [],
    evaluable,
    reason: result.reason || null,
    rationale: result.rationale || "Evaluation completed.",
    provider: result.provider || "unknown",
    completedAt: new Date().toISOString()
  };
}

export function buildEvaluationFailure(reason, provider = "provider_failure_fallback") {
  return {
    status: reason === "evaluation_timeout" ? "timeout" : "completed",
    score: null,
    strengths: [],
    weaknesses: [],
    nextSteps: ["Retry the evaluation once the provider path is healthy."],
    evaluable: false,
    reason,
    rationale: "The evaluation could not be completed in a trustworthy way.",
    provider
  };
}
