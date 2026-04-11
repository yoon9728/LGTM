import { EvaluationProvider } from "./evaluation-provider.interface.mjs";

// Mock provider scoring contract:
// All scores are integers 0-100. This matches the normalization contract in
// practice-evaluation.service.mjs. Do NOT return 0-1 floats here.
//
// Score tiers:
//   0-30   — candidate missed most critical mustCover points
//   31-60  — partial coverage, notable gaps remain
//   61-85  — solid coverage, minor gaps
//   86-100 — near-complete coverage of all criteria
//
// The mock awards base points for content, not keyword matching.
// For rubric-aligned coverage, the live OpenAI provider is used.

export class MockEvaluationProvider extends EvaluationProvider {
  // `question` is passed by the job so the provider can generate per-criterion coverage.
  async evaluateAnswer(answer, question = null) {
    const findings = answer?.review?.findings || [];
    const summary = String(answer?.review?.summary || "").trim();
    const mustCover = question?.rubric?.mustCover || [];

    // Base score 0-100 (integer). Each signal adds discrete points.
    // Base: 20 (shows up and writes something)
    // Has a non-trivial summary (+20)
    // Has at least one finding (+25)
    // Has two or more findings (+15 bonus, total +40)
    let score = 20;
    if (summary.length >= 20) score += 20;
    if (findings.length >= 1) score += 25;
    if (findings.length >= 2) score += 15;
    score = Math.min(100, score);

    // Per-criterion coverage: mock uses answer length as a proxy.
    // In the live path, OpenAI evaluates each criterion against the actual answer.
    const hasSubstantialContent = summary.length >= 20 || findings.length >= 1;
    const criteriaResults = mustCover.map((criterion) => ({
      criterion,
      covered: hasSubstantialContent ? "partial" : "missing",
      evidence: hasSubstantialContent
        ? "Answer contains substantive text but mock provider cannot verify criterion-level accuracy."
        : "Answer is too short or empty to determine coverage."
    }));

    return {
      answerId: answer?.id || null,
      evaluable: true,
      score,
      criteriaResults,
      strengths: [
        findings.length > 0
          ? "Spotted at least one concrete issue in the diff."
          : "Kept the response concise for a first pass.",
        summary
          ? "Provided a review summary that can be shown in the result view."
          : "The response shape is valid and ready for iterative feedback."
      ],
      weaknesses: [
        findings.length < 2
          ? "Add more concrete findings from the diff to improve coverage."
          : "Findings coverage is decent but can be prioritized more clearly.",
        "Call out risk level and test follow-ups more explicitly."
      ],
      nextSteps: [
        "Prioritize the most severe issue first.",
        "Explain why the diff is risky and what test should be added before merge."
      ],
      rationale: "Mock provider completed the Code Review evaluation pass. Score is based on content presence, not rubric accuracy. Use the live provider for accurate criterion-level scoring.",
      provider: "mock"
    };
  }
}
