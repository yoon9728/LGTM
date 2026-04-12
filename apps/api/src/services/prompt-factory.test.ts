import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  buildUserMessage,
  getCategoryLabel,
  registerCategoryConfig,
  getRegisteredCategories,
} from "./prompt-factory.js";
import type { Question } from "../data/questions.js";
import type { Answer } from "../data/store.js";

const makeQuestion = (overrides: Partial<Question> = {}): Question => ({
  id: "q1",
  category: "code_review",
  type: "security",
  language: null,
  title: "SQL Injection Review",
  prompt: "Review the following code for security issues.",
  diff: "function getUser(id) { db.query(`SELECT * FROM users WHERE id = ${id}`); }",
  rubric: {
    mustCover: ["SQL injection vulnerability", "Use parameterized queries"],
    strongSignals: ["Mentions prepared statements"],
    weakPatterns: ["Only says 'looks fine'"],
  },
  ...overrides,
});

const makeAnswer = (review: Record<string, unknown> = {}): Answer => ({
  id: "a1",
  sessionId: "s1",
  questionId: "q1",
  review: { summary: "Found SQL injection", findings: ["Use parameterized queries"], ...review },
  status: "submitted",
  createdAt: new Date().toISOString(),
});

describe("getCategoryLabel", () => {
  it("returns 'Code Review' for code_review questions", () => {
    expect(getCategoryLabel(makeQuestion())).toBe("Code Review");
  });

  it("returns 'System Design' for system_design questions", () => {
    expect(getCategoryLabel(makeQuestion({ category: "system_design" }))).toBe("System Design");
  });

  it("includes language for practical_coding", () => {
    const q = makeQuestion({ category: "practical_coding", language: "python" });
    expect(getCategoryLabel(q)).toBe("Practical Coding (PYTHON)");
  });

  it("returns 'Code Review' when question is undefined", () => {
    expect(getCategoryLabel(undefined)).toBe("Code Review");
  });
});

describe("buildSystemPrompt", () => {
  it("includes rubric criteria when question has rubric", () => {
    const prompt = buildSystemPrompt(makeQuestion());
    expect(prompt).toContain("SQL injection vulnerability");
    expect(prompt).toContain("Use parameterized queries");
    expect(prompt).toContain("Mentions prepared statements");
    expect(prompt).toContain("Only says 'looks fine'");
  });

  it("includes scoring guidance", () => {
    const prompt = buildSystemPrompt(makeQuestion());
    expect(prompt).toContain("90-100");
    expect(prompt).toContain("0-29");
  });

  it("requests JSON response format", () => {
    const prompt = buildSystemPrompt(makeQuestion());
    expect(prompt).toContain("criteriaResults");
    expect(prompt).toContain("evaluable");
    expect(prompt).toContain("score");
  });

  it("handles question without rubric", () => {
    const q = makeQuestion({ rubric: undefined });
    const prompt = buildSystemPrompt(q);
    expect(prompt).toContain("criteriaResults");
    expect(prompt).not.toContain("Must Cover");
  });

  it("uses category-specific evaluation dimensions", () => {
    const prompt = buildSystemPrompt(makeQuestion({ category: "debugging" }));
    expect(prompt).toContain("Root cause accuracy");
    expect(prompt).toContain("Fix correctness");
  });
});

describe("buildUserMessage", () => {
  it("includes question and answer data", () => {
    const msg = buildUserMessage(makeAnswer(), makeQuestion());
    const parsed = JSON.parse(msg);
    expect(parsed.questionTitle).toBe("SQL Injection Review");
    expect(parsed.answer.summary).toBe("Found SQL injection");
  });

  it("includes diff when question has one", () => {
    const msg = buildUserMessage(makeAnswer(), makeQuestion());
    const parsed = JSON.parse(msg);
    expect(parsed.diff).toContain("SELECT * FROM users");
  });

  it("formats blocks with language tags when present", () => {
    const answer = makeAnswer({
      code: "```python\nprint('hello')\n```",
      blocks: [{ type: "code", language: "python", content: "print('hello')" }],
    });
    const msg = buildUserMessage(answer, makeQuestion({ category: "practical_coding" }));
    const parsed = JSON.parse(msg);
    expect(parsed.formattedCode).toContain("[python]");
    expect(parsed.formattedCode).toContain("print('hello')");
  });

  it("omits formattedCode when no blocks", () => {
    const msg = buildUserMessage(makeAnswer(), makeQuestion());
    const parsed = JSON.parse(msg);
    expect(parsed.formattedCode).toBeUndefined();
  });
});

describe("registerCategoryConfig", () => {
  it("adds a new category and it appears in getRegisteredCategories", () => {
    registerCategoryConfig("api_design", {
      label: "API Design",
      answerContext: "Evaluate REST API endpoints.",
      evaluationDimensions: ["Endpoint correctness"],
      scoringGuidance: "Score 0-100.",
    });
    expect(getRegisteredCategories()).toContain("api_design");
  });

  it("registered category works in buildSystemPrompt", () => {
    const q = makeQuestion({ category: "api_design" });
    const prompt = buildSystemPrompt(q);
    expect(prompt).toContain("API Design");
    expect(prompt).toContain("Endpoint correctness");
  });
});
