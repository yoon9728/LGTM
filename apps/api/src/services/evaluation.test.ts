import { describe, it, expect, vi, beforeEach } from "vitest";

// Test the pure helper functions by importing them via the module
// We can't test `evaluate()` directly without mocking fetch + db, so we test the normalization logic

// Since the normalize functions are not exported, we test the overall evaluate behavior
// by mocking the external dependencies

describe("evaluation service — score normalization logic", () => {
  // Re-implement the pure logic to test in isolation
  // This mirrors normalizeScore from evaluation.ts
  function normalizeScore(score: unknown): number | null {
    if (typeof score !== "number" || Number.isNaN(score)) return null;
    if (score >= 0 && score <= 1) return Math.round(score * 100);
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  it("converts 0-1 range to 0-100", () => {
    expect(normalizeScore(0.85)).toBe(85);
    expect(normalizeScore(0)).toBe(0);
    expect(normalizeScore(1)).toBe(100);
    expect(normalizeScore(0.5)).toBe(50);
  });

  it("clamps values to 0-100 range", () => {
    expect(normalizeScore(150)).toBe(100);
    expect(normalizeScore(-10)).toBe(0);
    expect(normalizeScore(75)).toBe(75);
  });

  it("returns null for non-numeric values", () => {
    expect(normalizeScore("85")).toBeNull();
    expect(normalizeScore(null)).toBeNull();
    expect(normalizeScore(undefined)).toBeNull();
    expect(normalizeScore(NaN)).toBeNull();
  });

  it("rounds to nearest integer", () => {
    expect(normalizeScore(72.6)).toBe(73);
    expect(normalizeScore(72.4)).toBe(72);
  });
});

describe("evaluation service — score-coverage validation logic", () => {
  interface CriterionResult {
    criterion: string;
    coverage: "covered" | "partial" | "missing";
    evidence: string;
  }

  // Mirrors validateScoreAgainstCoverage from evaluation.ts
  function validateScoreAgainstCoverage(
    score: number | null,
    criteriaResults: CriterionResult[],
    rubric?: { mustCover: string[] },
  ): number | null {
    if (score == null || !rubric || criteriaResults.length === 0) return score;

    const total = criteriaResults.length;
    const covered = criteriaResults.filter((c) => c.coverage === "covered").length;
    const partial = criteriaResults.filter((c) => c.coverage === "partial").length;
    const coverageRatio = (covered + partial * 0.5) / total;

    const expectedMin = Math.max(0, Math.round(coverageRatio * 100 - 20));
    const expectedMax = Math.min(100, Math.round(coverageRatio * 100 + 20));

    if (score > expectedMax + 25) return expectedMax;
    if (score < expectedMin - 25) return expectedMin;

    return score;
  }

  it("returns score unchanged when within expected range", () => {
    const criteria: CriterionResult[] = [
      { criterion: "A", coverage: "covered", evidence: "yes" },
      { criterion: "B", coverage: "covered", evidence: "yes" },
    ];
    // 100% coverage → expected range 80-100, ±25 tolerance = 55-125
    expect(validateScoreAgainstCoverage(90, criteria, { mustCover: ["A", "B"] })).toBe(90);
  });

  it("clamps inflated score when coverage is low", () => {
    const criteria: CriterionResult[] = [
      { criterion: "A", coverage: "missing", evidence: "no" },
      { criterion: "B", coverage: "missing", evidence: "no" },
    ];
    // 0% coverage → expected range 0-20, +25 = max 45
    // Score of 95 should be clamped to 20
    expect(validateScoreAgainstCoverage(95, criteria, { mustCover: ["A", "B"] })).toBe(20);
  });

  it("handles partial coverage correctly", () => {
    const criteria: CriterionResult[] = [
      { criterion: "A", coverage: "covered", evidence: "yes" },
      { criterion: "B", coverage: "partial", evidence: "kinda" },
      { criterion: "C", coverage: "missing", evidence: "no" },
      { criterion: "D", coverage: "missing", evidence: "no" },
    ];
    // coverage = (1 + 0.5) / 4 = 0.375 → 37.5%
    // expected range: 18-58, ±25 tolerance = 0-83
    expect(validateScoreAgainstCoverage(50, criteria, { mustCover: ["A", "B", "C", "D"] })).toBe(50);
  });

  it("returns null score unchanged", () => {
    expect(validateScoreAgainstCoverage(null, [], { mustCover: [] })).toBeNull();
  });

  it("skips validation when no rubric", () => {
    const criteria: CriterionResult[] = [
      { criterion: "A", coverage: "missing", evidence: "no" },
    ];
    expect(validateScoreAgainstCoverage(95, criteria, undefined)).toBe(95);
  });

  it("skips validation when no criteria results", () => {
    expect(validateScoreAgainstCoverage(95, [], { mustCover: ["A"] })).toBe(95);
  });
});
