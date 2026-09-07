import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context, Next } from "hono";
import type { Session } from "../data/store.js";

const mocks = vi.hoisted(() => ({
  user: { id: "owner" } as { id: string } | null,
  db: {
    sessions: { get: vi.fn(), updateStatus: vi.fn() },
    questions: { getById: vi.fn() },
    answers: { findBySessionId: vi.fn(), insert: vi.fn() },
  },
  evaluate: vi.fn(),
  getRubric: vi.fn(),
}));

vi.mock("../data/store.js", () => ({ db: mocks.db }));
vi.mock("../services/evaluation.js", () => ({ evaluate: mocks.evaluate }));
vi.mock("../services/rubric-store.js", () => ({ getRubric: mocks.getRubric }));
vi.mock("../middleware/auth.js", () => ({
  optionalAuth: async (c: Context, next: Next) => {
    c.set("user", mocks.user ? { ...mocks.user, name: "Test User", email: "test@example.test" } : null);
    await next();
  },
}));

import { answerRoutes } from "./answers.js";

answerRoutes.onError((_error, c) => c.json({ error: "Test dependency failed" }, 500));

let session: Session;

function submit(body: unknown) {
  return submitRaw(JSON.stringify(body));
}

function submitRaw(body: string) {
  return answerRoutes.request("/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.user = { id: "owner" };
  session = {
    id: "session-1", candidateId: "owner", language: null, status: "question_ready",
    createdAt: "2026-01-01T00:00:00.000Z",
    question: {
      id: "canonical-question", category: "code_review", type: "security_review",
      title: "Review code", prompt: "Find the issues", diff: "canonical diff",
      rubric: { mustCover: ["SQL injection"], strongSignals: [], weakPatterns: [] },
    },
  };
  mocks.db.sessions.get.mockResolvedValue(session);
  mocks.db.answers.insert.mockImplementation(async (answer) => answer);
  mocks.getRubric.mockResolvedValue(session.question.rubric);
  mocks.evaluate.mockResolvedValue({ id: "evaluation-1", score: 80, evaluable: true });
});

describe("answer input validation", () => {
  it.each(["{", "", "null", "[]", "true", "42", '"answer"'])(
    "rejects malformed or non-object JSON %s without database access", async (raw) => {
      const response = await submitRaw(raw);
      expect(response.status).toBe(400);
      expect((await response.json()).error.code).toBe("invalid_input");
      expect(mocks.db.sessions.get).not.toHaveBeenCalled();
    },
  );

  it.each([{}, { sessionId: "" }, { sessionId: "   " }, { sessionId: 1 }, { sessionId: null }])(
    "rejects missing/invalid session IDs: %j", async (body) => {
      expect((await submit(body)).status).toBe(400);
      expect(mocks.db.sessions.get).not.toHaveBeenCalled();
    },
  );

  it.each([
    "sessionId", "questionId", "category", "diff", "summary", "overview", "components",
    "tradeoffs", "scalingStrategy", "rootCause", "evidence", "proposedFix", "query",
    "explanation", "optimization", "code", "approach", "complexity", "analysis",
    "recommendation", "reasoning", "selectedAnswer",
  ])("rejects non-string %s before database access", async (name) => {
    for (const value of [null, 123, true, [], {}]) {
      expect((await submit({ sessionId: session.id, summary: "review", [name]: value })).status).toBe(400);
    }
    expect(mocks.db.sessions.get).not.toHaveBeenCalled();
    expect(mocks.db.answers.insert).not.toHaveBeenCalled();
  });

  it.each([
    { summary: "x".repeat(50_001) }, { sessionId: "x".repeat(201) },
    { findings: null }, { findings: "issue" }, { findings: [123] }, { findings: [null] },
    { findings: ["x".repeat(50_001)] }, { findings: Array(101).fill("issue") },
    { blocks: null }, { blocks: {} }, { blocks: "code" }, { blocks: [null] },
    { blocks: [[]] }, { blocks: ["code"] }, { blocks: [{ content: "code" }] },
    { blocks: [{ type: "html", content: "code" }] },
    { blocks: [{ type: "code", content: 123 }] },
    { blocks: [{ type: "code", content: "x".repeat(50_001) }] },
    { blocks: [{ type: "code", content: "code", language: 1 }] },
    { blocks: [{ type: "code", content: "code", language: null }] },
    { blocks: [{ type: "code", content: "code", language: "python\ninstructions" }] },
    { blocks: Array(21).fill({ type: "text", content: "text" }) },
  ].map((body, index) => ({ body, index })))(
    "rejects malformed/oversized collections and fields, case $index", async ({ body }) => {
      expect((await submit({ sessionId: session.id, summary: "review", ...body })).status).toBe(400);
      expect(mocks.db.sessions.get).not.toHaveBeenCalled();
    },
  );
});

describe("canonical grading and ownership", () => {
  it("derives category, question ID, and diff from the session", async () => {
    const response = await submit({
      sessionId: session.id, category: "cfa", questionId: "forged-question",
      diff: "forged diff", summary: " Review ", findings: [" issue ", " "],
    });
    expect(response.status).toBe(201);
    expect(mocks.db.answers.insert).toHaveBeenCalledWith(expect.objectContaining({
      sessionId: session.id, questionId: session.question.id,
      review: { summary: "Review", findings: ["issue"], diff: "canonical diff" },
    }));
    expect(mocks.db.questions.getById).not.toHaveBeenCalled();
  });

  it("does not require the client to send the canonical diff", async () => {
    expect((await submit({ sessionId: session.id, summary: "Review" })).status).toBe(201);
  });

  it("rejects whitespace-only findings", async () => {
    expect((await submit({ sessionId: session.id, findings: [" "] })).status).toBe(400);
    expect(mocks.db.answers.insert).not.toHaveBeenCalled();
  });

  it("does not let a client category bypass the actual question's required fields", async () => {
    session.question.category = "practical_coding";
    expect((await submit({ sessionId: session.id, category: "code_review", summary: "Review" })).status).toBe(400);
    expect(mocks.getRubric).not.toHaveBeenCalled();
    expect(mocks.db.answers.insert).not.toHaveBeenCalled();
  });

  it.each([
    ["system_design", { overview: " Architecture " }, { overview: "Architecture" }],
    ["debugging", { rootCause: " Race " }, { rootCause: "Race" }],
    ["data_analysis", { query: " SELECT 1 " }, { query: "SELECT 1" }],
    ["practical_coding", { code: " print(1) " }, { code: "print(1)" }],
    ["cfa", { analysis: " Analysis " }, { analysis: "Analysis" }],
  ])("preserves valid %s submissions", async (category, fields, expected) => {
    session.question.category = category;
    expect((await submit({ sessionId: session.id, ...fields })).status).toBe(201);
    expect(mocks.db.answers.insert).toHaveBeenCalledWith(expect.objectContaining({
      review: expect.objectContaining(expected),
    }));
  });

  it.each(["debugging", "data_analysis", "practical_coding"])("preserves editor blocks for %s", async (category) => {
    session.question.category = category;
    const blocks = [
      { type: "code", content: "echo 1", language: "shell" },
      { type: "code", content: "{}", language: "json" },
      { type: "text", content: "Explanation" },
    ];
    expect((await submit({ sessionId: session.id, rootCause: "race", query: "select 1", code: "code", blocks })).status).toBe(201);
    expect(mocks.db.answers.insert).toHaveBeenCalledWith(expect.objectContaining({ review: expect.objectContaining({ blocks }) }));
  });

  it.each([null, { id: "someone-else" }])("checks ownership before category validation or grading", async (user) => {
    mocks.user = user;
    session.question.category = "practical_coding";
    expect((await submit({ sessionId: session.id })).status).toBe(403);
    expect(mocks.db.answers.findBySessionId).not.toHaveBeenCalled();
    expect(mocks.getRubric).not.toHaveBeenCalled();
    expect(mocks.evaluate).not.toHaveBeenCalled();
  });

  it("preserves guest session submission", async () => {
    session.candidateId = "guest";
    mocks.user = null;
    expect((await submit({ sessionId: session.id, summary: "Review" })).status).toBe(201);
  });

  it("returns 404 for an unknown session", async () => {
    mocks.db.sessions.get.mockResolvedValue(undefined);
    expect((await submit({ sessionId: "missing", summary: "Review" })).status).toBe(404);
    expect(mocks.getRubric).not.toHaveBeenCalled();
  });

  it("returns 409 for an existing answer before resolving a rubric", async () => {
    mocks.db.answers.findBySessionId.mockResolvedValue({ id: "existing" });
    expect((await submit({ sessionId: session.id, summary: "Review" })).status).toBe(409);
    expect(mocks.getRubric).not.toHaveBeenCalled();
    expect(mocks.db.answers.insert).not.toHaveBeenCalled();
  });

  it("resolves the rubric with the selected language before inserting", async () => {
    session.question.category = "practical_coding";
    session.question.language = "java";
    session.language = "python";
    const rubric = { mustCover: ["Resolved rubric"], strongSignals: [], weakPatterns: [] };
    mocks.getRubric.mockResolvedValue(rubric);
    expect((await submit({ sessionId: session.id, code: "print(1)" })).status).toBe(201);
    expect(mocks.getRubric).toHaveBeenCalledWith(expect.objectContaining({ language: "python" }));
    expect(mocks.evaluate).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ language: "python", rubric }));
    expect(mocks.getRubric.mock.invocationCallOrder[0]).toBeLessThan(mocks.db.answers.insert.mock.invocationCallOrder[0]);
    expect(mocks.db.sessions.updateStatus).toHaveBeenCalledWith(session.id, "answer_submitted");
  });

  it("allows resubmission after rubric preparation fails without persisting an answer", async () => {
    mocks.getRubric.mockRejectedValueOnce(new Error("Rubric unavailable"));
    const body = { sessionId: session.id, summary: "Review" };
    expect((await submit(body)).status).toBe(500);
    expect(mocks.db.answers.insert).not.toHaveBeenCalled();
    expect(mocks.db.sessions.updateStatus).not.toHaveBeenCalled();
    expect(mocks.evaluate).not.toHaveBeenCalled();
    expect((await submit(body)).status).toBe(201);
  });
});

describe("MCQ answers", () => {
  beforeEach(() => {
    session.question = {
      ...session.question, category: "cfa", format: "mcq",
      choices: ["First", "Second", "Third"], correctAnswer: "B",
    };
  });

  it.each(["D", "E", "F", "AB", "", " "])("rejects unavailable choice %j", async (selectedAnswer) => {
    expect((await submit({ sessionId: session.id, selectedAnswer })).status).toBe(400);
    expect(mocks.db.answers.insert).not.toHaveBeenCalled();
    expect(mocks.getRubric).not.toHaveBeenCalled();
  });

  it("normalizes actual choice letters and skips rubric generation", async () => {
    expect((await submit({ sessionId: session.id, selectedAnswer: " b " })).status).toBe(201);
    expect(mocks.db.answers.insert).toHaveBeenCalledWith(expect.objectContaining({ review: { selectedAnswer: "B" } }));
    expect(mocks.getRubric).not.toHaveBeenCalled();
    expect(mocks.db.questions.getById).not.toHaveBeenCalled();
    expect(mocks.evaluate).toHaveBeenCalledWith(expect.anything(), session.question);
  });

  it("accepts E when the question actually has five choices", async () => {
    session.question.choices!.push("Fourth", "Fifth");
    expect((await submit({ sessionId: session.id, selectedAnswer: "E" })).status).toBe(201);
  });

  it("does not accept a choice when the question has none", async () => {
    session.question.choices = undefined;
    expect((await submit({ sessionId: session.id, selectedAnswer: "A" })).status).toBe(400);
  });
});
