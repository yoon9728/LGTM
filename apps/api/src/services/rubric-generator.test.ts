import { describe, it, expect } from "vitest";
import { buildRubricSystemPrompt, buildRubricUserMessage, type RubricInput } from "./rubric-generator.js";

const sampleInput: RubricInput = {
  category: "code_review",
  type: "security_review",
  title: "Review an unescaped user input in SQL query",
  prompt: "Review the diff and identify all security issues.",
  diff: "SELECT * FROM users WHERE id = ${id}",
};

describe("buildRubricSystemPrompt", () => {
  it("includes the code_review analysis lens", () => {
    const prompt = buildRubricSystemPrompt("code_review");
    expect(prompt).toContain("Security vulnerabilities");
    expect(prompt).toContain("injection");
    expect(prompt).toContain("N+1 queries");
  });

  it("includes system_design lens for that category", () => {
    const prompt = buildRubricSystemPrompt("system_design");
    expect(prompt).toContain("Scalability");
    expect(prompt).toContain("CAP theorem");
  });

  it("includes debugging lens", () => {
    const prompt = buildRubricSystemPrompt("debugging");
    expect(prompt).toContain("Root cause precision");
    expect(prompt).toContain("Evidence chain");
  });

  it("includes data_analysis lens", () => {
    const prompt = buildRubricSystemPrompt("data_analysis");
    expect(prompt).toContain("Query correctness");
    expect(prompt).toContain("NULL handling");
  });

  it("includes practical_coding lens", () => {
    const prompt = buildRubricSystemPrompt("practical_coding");
    expect(prompt).toContain("Algorithm choice");
    expect(prompt).toContain("Edge cases");
  });

  it("falls back to general lens for unknown category", () => {
    const prompt = buildRubricSystemPrompt("unknown_category");
    expect(prompt).toContain("General");
    expect(prompt).toContain("completeness");
  });

  it("always includes mustCover/strongSignals/weakPatterns rules", () => {
    const prompt = buildRubricSystemPrompt("code_review");
    expect(prompt).toContain("mustCover");
    expect(prompt).toContain("strongSignals");
    expect(prompt).toContain("weakPatterns");
    expect(prompt).toContain("3–5 items");
    expect(prompt).toContain("2–4 items");
    expect(prompt).toContain("2–3 items");
  });

  it("requests JSON output format", () => {
    const prompt = buildRubricSystemPrompt("code_review");
    expect(prompt).toContain("strict JSON");
  });
});

describe("buildRubricUserMessage", () => {
  it("includes all fields", () => {
    const msg = buildRubricUserMessage(sampleInput);
    expect(msg).toContain("code_review");
    expect(msg).toContain("security_review");
    expect(msg).toContain("Review an unescaped user input");
    expect(msg).toContain("SELECT * FROM users");
  });

  it("includes language when provided", () => {
    const msg = buildRubricUserMessage({ ...sampleInput, language: "python" });
    expect(msg).toContain("Language: python");
  });

  it("omits language when not provided", () => {
    const msg = buildRubricUserMessage(sampleInput);
    expect(msg).not.toContain("Language:");
  });

  it("omits diff section when no diff", () => {
    const { diff: _, ...noDiff } = sampleInput;
    const msg = buildRubricUserMessage(noDiff);
    expect(msg).not.toContain("Code / Diff");
  });
});
