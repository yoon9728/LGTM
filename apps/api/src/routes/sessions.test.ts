import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Context, Next } from "hono";
import type { Session } from "../data/store.js";

const mocks = vi.hoisted(() => ({
  user: { id: "owner" } as { id: string } | null,
  ip: "test-ip",
  db: {
    sessions: { listByUser: vi.fn(), get: vi.fn(), insert: vi.fn(), updateLanguage: vi.fn() },
    questions: { getById: vi.fn(), getRandom: vi.fn() },
    answers: { findBySessionId: vi.fn() },
    evaluations: { findByAnswerId: vi.fn() },
  },
  evaluate: vi.fn(),
  getRubric: vi.fn(),
}));

vi.mock("../data/store.js", () => ({ db: mocks.db }));
vi.mock("../services/evaluation.js", () => ({ evaluate: mocks.evaluate }));
vi.mock("../services/rubric-store.js", () => ({ getRubric: mocks.getRubric }));
vi.mock("../lib/ip.js", () => ({ getClientIp: () => mocks.ip }));
vi.mock("../middleware/auth.js", () => ({
  optionalAuth: async (c: Context, next: Next) => {
    c.set("user", mocks.user ? { ...mocks.user, name: "Test User", email: "test@example.test" } : null);
    await next();
  },
}));

import { sessionRoutes } from "./sessions.js";

sessionRoutes.onError((_error, c) => c.json({ error: "Test dependency failed" }, 500));

let session: Session;

function request(method: string, body: unknown, path = "/") {
  return requestRaw(method, JSON.stringify(body), path);
}

function requestRaw(method: string, body: string, path = "/") {
  return sessionRoutes.request(path, { method, body, headers: { "Content-Type": "application/json" } });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.user = { id: "owner" };
  mocks.ip = crypto.randomUUID();
  session = {
    id: crypto.randomUUID(), candidateId: "owner", language: "java", status: "question_ready",
    createdAt: "2026-01-01T00:00:00.000Z",
    question: {
      id: "question-1", category: "practical_coding", type: "algorithms", guest: true,
      title: "Question", prompt: "Solve this", diff: "", language: "java",
      templates: { java: "class Solution {}", python: "def solve(): pass" },
      rubric: { mustCover: ["secret criterion"], strongSignals: [], weakPatterns: [] },
      correctAnswer: "B", explanation: "secret explanation",
    },
  };
  mocks.db.sessions.get.mockResolvedValue(session);
  mocks.db.sessions.listByUser.mockResolvedValue([session]);
  mocks.db.sessions.insert.mockImplementation(async (value) => value);
  mocks.db.sessions.updateLanguage.mockResolvedValue(true);
  mocks.db.questions.getById.mockResolvedValue(session.question);
  mocks.db.questions.getRandom.mockResolvedValue(session.question);
  mocks.getRubric.mockResolvedValue(session.question.rubric);
});

afterEach(() => vi.restoreAllMocks());

describe("session payload safety", () => {
  it("removes grading secrets from list responses without modifying stored questions", async () => {
    const response = await sessionRoutes.request("/");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.sessions[0].question).not.toHaveProperty("rubric");
    expect(body.sessions[0].question).not.toHaveProperty("correctAnswer");
    expect(body.sessions[0].question).not.toHaveProperty("explanation");
    expect(body.sessions[0].question.templates).toEqual(session.question.templates);
    expect(session.question.rubric.mustCover).toEqual(["secret criterion"]);
    expect(session.question.correctAnswer).toBe("B");
    expect(mocks.db.sessions.listByUser).toHaveBeenCalledWith("owner");
  });

  it("returns an empty list to guests without querying the database", async () => {
    mocks.user = null;
    expect(await (await sessionRoutes.request("/")).json()).toEqual({ ok: true, sessions: [] });
    expect(mocks.db.sessions.listByUser).not.toHaveBeenCalled();
  });

  it.each(["POST", "PATCH"])("rejects malformed %s JSON before database access", async (method) => {
    for (const raw of ["{", "", "null", "[]", "42", "true", '"text"']) {
      expect((await requestRaw(method, raw, method === "PATCH" ? `/${session.id}` : "/")).status).toBe(400);
    }
    expect(mocks.db.sessions.get).not.toHaveBeenCalled();
    expect(mocks.db.questions.getById).not.toHaveBeenCalled();
    expect(mocks.db.questions.getRandom).not.toHaveBeenCalled();
  });

  it.each(["questionId", "category", "type", "language"])("validates optional %s before database access", async (field) => {
    for (const value of [null, 12, true, {}, [], "", " ", "x".repeat(201)]) {
      expect((await request("POST", { [field]: value })).status).toBe(400);
    }
    expect(mocks.db.questions.getById).not.toHaveBeenCalled();
    expect(mocks.db.questions.getRandom).not.toHaveBeenCalled();
    expect(mocks.db.sessions.insert).not.toHaveBeenCalled();
  });

  it("preserves empty options for random session creation", async () => {
    const response = await request("POST", {});
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.session.language).toBe("java");
    expect(body.session.question).not.toHaveProperty("rubric");
    expect(body.session.question).not.toHaveProperty("correctAnswer");
    expect(body.session.question).not.toHaveProperty("explanation");
  });

  it("rejects unsupported languages and missing practical coding templates", async () => {
    expect((await request("POST", { questionId: "question-1", language: "invalid" })).status).toBe(400);
    expect(mocks.db.questions.getById).not.toHaveBeenCalled();
    expect((await request("POST", { questionId: "question-1", language: "rust" })).status).toBe(400);
    expect(mocks.db.sessions.insert).not.toHaveBeenCalled();
  });

  it("creates a practical session using an available template language", async () => {
    const response = await request("POST", { questionId: "question-1", language: "python" });
    expect(response.status).toBe(201);
    expect((await response.json()).session.language).toBe("python");
  });
});

describe("guest session reservations", () => {
  beforeEach(() => { mocks.user = null; });

  async function expectFullAllowance() {
    for (let i = 0; i < 4; i++) {
      expect((await request("POST", { questionId: "question-1" })).status).toBe(201);
    }
    expect((await request("POST", { questionId: "question-1" })).status).toBe(429);
  }

  it("does not consume quota for invalid JSON or fields", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await requestRaw("POST", "{")).status).toBe(400);
      expect((await request("POST", { questionId: 1 })).status).toBe(400);
    }
    await expectFullAllowance();
  });

  it("rolls back reservations for missing or unavailable random questions", async () => {
    mocks.db.questions.getById.mockResolvedValue(undefined);
    mocks.db.questions.getRandom.mockResolvedValue(undefined);
    for (let i = 0; i < 5; i++) {
      expect((await request("POST", { questionId: "missing" })).status).toBe(404);
      expect((await request("POST", {})).status).toBe(404);
    }
    mocks.db.questions.getById.mockResolvedValue(session.question);
    await expectFullAllowance();
  });

  it("rolls back reservations for authentication and template failures", async () => {
    mocks.db.questions.getById.mockResolvedValue({ ...session.question, guest: false });
    for (let i = 0; i < 5; i++) {
      expect((await request("POST", { questionId: "private" })).status).toBe(401);
    }
    mocks.db.questions.getById.mockResolvedValue(session.question);
    for (let i = 0; i < 5; i++) {
      expect((await request("POST", { questionId: "question-1", language: "rust" })).status).toBe(400);
    }
    await expectFullAllowance();
  });

  it("rolls back reservations for database read and insert failures", async () => {
    mocks.db.questions.getById.mockRejectedValue(new Error("Read failed"));
    for (let i = 0; i < 5; i++) {
      expect((await request("POST", { questionId: "question-1" })).status).toBe(500);
    }
    mocks.db.questions.getById.mockResolvedValue(session.question);
    mocks.db.sessions.insert.mockRejectedValue(new Error("Insert failed"));
    for (let i = 0; i < 5; i++) {
      expect((await request("POST", { questionId: "question-1" })).status).toBe(500);
    }
    mocks.db.sessions.insert.mockImplementation(async (value) => value);
    await expectFullAllowance();
  });

  it("reserves quota before awaits so overlapping requests cannot bypass the limit", async () => {
    const releases: (() => void)[] = [];
    mocks.db.questions.getById.mockImplementation(() => new Promise((resolve) => {
      releases.push(() => resolve(session.question));
    }));
    const pending = Array.from({ length: 4 }, () => request("POST", { questionId: "question-1" }));
    await vi.waitFor(() => expect(releases).toHaveLength(4));
    expect((await request("POST", { questionId: "question-1" })).status).toBe(429);
    releases.forEach((release) => release());
    expect((await Promise.all(pending)).map((response) => response.status)).toEqual([201, 201, 201, 201]);
  });

  it("does not release a new window's quota when an old reservation fails", async () => {
    const now = vi.spyOn(Date, "now").mockReturnValue(1_000);
    let fail: (error: Error) => void = () => { throw new Error("Reservation not started"); };
    mocks.db.questions.getById.mockImplementationOnce(() => new Promise((_resolve, reject) => { fail = reject; }));
    const pending = request("POST", { questionId: "question-1" });
    await vi.waitFor(() => expect(mocks.db.questions.getById).toHaveBeenCalledTimes(1));
    now.mockReturnValue(1_001 + 24 * 60 * 60 * 1000);
    await expectFullAllowance();
    fail(new Error("Old read failed"));
    expect((await pending).status).toBe(500);
    expect((await request("POST", { questionId: "question-1" })).status).toBe(429);
  });

  it("does not apply guest quota to authenticated users", async () => {
    mocks.user = { id: "owner" };
    for (let i = 0; i < 6; i++) expect((await request("POST", {})).status).toBe(201);
  });
});

describe("session language changes", () => {
  function patch(body: unknown = { language: "python" }) {
    return request("PATCH", body, `/${session.id}`);
  }

  it("allows an available practical language before an answer and strips secrets", async () => {
    const response = await patch();
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.session.language).toBe("python");
    expect(body.session.question).not.toHaveProperty("rubric");
    expect(body.session.question).not.toHaveProperty("correctAnswer");
    expect(body.session.question).not.toHaveProperty("explanation");
    expect(mocks.db.sessions.updateLanguage).toHaveBeenCalledWith(session.id, "python");
  });

  it.each([null, 1, [], {}, "", "rusty"])("rejects invalid language %j before lookup", async (language) => {
    expect((await patch({ language })).status).toBe(400);
    expect(mocks.db.sessions.get).not.toHaveBeenCalled();
  });

  it("rejects changes for non-practical questions or missing templates", async () => {
    expect((await patch({ language: "rust" })).status).toBe(400);
    session.question.category = "code_review";
    expect((await patch()).status).toBe(400);
    expect(mocks.db.sessions.updateLanguage).not.toHaveBeenCalled();
  });

  it("requires an own string-valued template", async () => {
    session.question.templates = Object.create({ python: "inherited template" });
    expect((await patch()).status).toBe(400);
    session.question.templates = { python: 12 } as unknown as Record<string, string>;
    expect((await patch()).status).toBe(400);
    expect(mocks.db.sessions.updateLanguage).not.toHaveBeenCalled();
  });

  it("rejects submitted status or an existing answer even when status is stale", async () => {
    session.status = "answer_submitted";
    expect((await patch()).status).toBe(409);
    session.status = "question_ready";
    mocks.db.answers.findBySessionId.mockResolvedValue({ id: "answer-1" });
    expect((await patch()).status).toBe(409);
    expect(mocks.db.sessions.updateLanguage).not.toHaveBeenCalled();
  });

  it("reports a guarded storage update that loses a race", async () => {
    mocks.db.sessions.updateLanguage.mockResolvedValue(false);
    expect((await patch()).status).toBe(409);
    expect(session.language).toBe("java");
  });

  it("checks ownership before looking up answers", async () => {
    mocks.user = { id: "someone-else" };
    expect((await patch()).status).toBe(403);
    expect(mocks.db.answers.findBySessionId).not.toHaveBeenCalled();
    expect(mocks.db.sessions.updateLanguage).not.toHaveBeenCalled();
  });

  it("preserves an empty PATCH as a no-op", async () => {
    expect((await patch({})).status).toBe(200);
    expect(mocks.db.sessions.updateLanguage).not.toHaveBeenCalled();
  });

  it("returns 404 for missing sessions", async () => {
    mocks.db.sessions.get.mockResolvedValue(undefined);
    expect((await patch()).status).toBe(404);
  });
});

describe("existing session read and retry behavior", () => {
  it("reads a failed saved result without starting another paid evaluation", async () => {
    const answer = { id: "saved-answer", review: { code: "saved" } };
    const evaluation = { id: "failed", evaluable: false, score: null };
    mocks.db.answers.findBySessionId.mockResolvedValue(answer);
    mocks.db.evaluations.findByAnswerId.mockResolvedValue(evaluation);
    const response = await sessionRoutes.request(`/${session.id}/result`);
    expect(await response.json()).toEqual({ ok: true, answer, evaluation });
    expect(mocks.evaluate).not.toHaveBeenCalled();
    expect(mocks.getRubric).not.toHaveBeenCalled();
  });

  it("restricts saved results to the session owner", async () => {
    mocks.user = { id: "someone-else" };
    expect((await sessionRoutes.request(`/${session.id}/result`)).status).toBe(403);
    expect(mocks.db.answers.findBySessionId).not.toHaveBeenCalled();
  });

  it("retry uses the chosen session language and resolved rubric", async () => {
    session.language = "python";
    mocks.db.answers.findBySessionId.mockResolvedValue({ id: "a" });
    mocks.evaluate.mockResolvedValue({ id: "new" });
    expect((await sessionRoutes.request(`/${session.id}/retry-evaluation`, { method: "POST" })).status).toBe(200);
    expect(mocks.evaluate.mock.calls[0][1].language).toBe("python");
    expect(mocks.getRubric).toHaveBeenCalledTimes(1);
  });

  it("does not start concurrent retries", async () => {
    mocks.db.answers.findBySessionId.mockResolvedValue({ id: "a" });
    let resolveEvaluation!: (value: unknown) => void;
    mocks.evaluate.mockReturnValue(new Promise((resolve) => { resolveEvaluation = resolve; }));
    const first = sessionRoutes.request(`/${session.id}/retry-evaluation`, { method: "POST" });
    await vi.waitFor(() => expect(mocks.evaluate).toHaveBeenCalledOnce());
    const second = await sessionRoutes.request(`/${session.id}/retry-evaluation`, { method: "POST" });
    expect(second.status).toBe(409);
    resolveEvaluation({ id: "new" });
    expect((await first).status).toBe(200);
  });
  it("strips grading secrets from a session read", async () => {
    const body = await (await sessionRoutes.request(`/${session.id}`)).json();
    expect(body.session.question).not.toHaveProperty("rubric");
    expect(body.session.question).not.toHaveProperty("correctAnswer");
    expect(body.session.question).not.toHaveProperty("explanation");
  });

  it("denies another user's read and retry before answer lookup", async () => {
    mocks.user = { id: "someone-else" };
    expect((await sessionRoutes.request(`/${session.id}`)).status).toBe(403);
    expect((await sessionRoutes.request(`/${session.id}/retry-evaluation`, { method: "POST" })).status).toBe(403);
    expect(mocks.db.answers.findBySessionId).not.toHaveBeenCalled();
  });

  it("reuses a completed evaluation instead of evaluating again", async () => {
    mocks.db.answers.findBySessionId.mockResolvedValue({ id: "answer-1" });
    mocks.db.evaluations.findByAnswerId.mockResolvedValue({ id: "latest", score: 90, evaluable: true });
    const response = await sessionRoutes.request(`/${session.id}/retry-evaluation`, { method: "POST" });
    expect(response.status).toBe(200);
    expect((await response.json()).reused).toBe(true);
    expect(mocks.evaluate).not.toHaveBeenCalled();
  });
});
