import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Answer, CriterionResult, Evaluation } from "../data/store.js";
import type { Question } from "../data/questions.js";

const { insert } = vi.hoisted(() => ({ insert: vi.fn() }));
vi.mock("../data/store.js", () => ({ db: { evaluations: { insert } } }));
import { evaluate } from "./evaluation.js";

const fetchMock = vi.fn<typeof fetch>();
const question: Question = {
  id: "q1", category: "code_review", type: "security_review",
  title: "Review a query", prompt: "Find and explain the bugs.", diff: "query(userInput)",
  rubric: {
    mustCover: ["Input validation", "Injection mechanism", "Regression", "Impact", "Fix"],
    strongSignals: ["Explains an alternative"], weakPatterns: ["Generic claims"],
  },
};
const answer: Answer = {
  id: "a1", sessionId: "s1", questionId: "q1", status: "submitted",
  review: { summary: "Input is directly interpolated.", findings: ["Use parameters."] },
  createdAt: "2026-01-01T00:00:00.000Z",
};

function criteria(coverage: CriterionResult["coverage"][] = Array(5).fill("covered")): CriterionResult[] {
  return coverage.map((coverage, index) => ({
    criterion: question.rubric.mustCover[index], coverage, evidence: "The answer discusses this issue.",
  }));
}

function result(overrides: Record<string, unknown> = {}) {
  return {
    evaluable: true, reason: null, score: 90, rationale: "Specific analysis.",
    strengths: ["Specific findings"], weaknesses: [], nextSteps: [], criteriaResults: criteria(),
    ...overrides,
  };
}

function respondContent(content: string | null, choice: Record<string, unknown> = {}) {
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ choices: [{
    finish_reason: "stop", message: { content, refusal: null }, ...choice,
  }] }), { status: 200 }));
}

function respond(value: unknown = result()) {
  respondContent(JSON.stringify(value));
}

function expectUnscored(value: Evaluation, reason = "evaluation_invalid_response", status = "completed") {
  expect(value).toMatchObject({ status, evaluable: false, score: null, reason, criteriaResults: [] });
  expect(value.completedAt).toEqual(expect.any(String));
  expect(insert).toHaveBeenCalledExactlyOnceWith(value);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubEnv("OPENAI_API_KEY", "test-only-not-a-real-key");
  vi.stubEnv("OPENAI_MODEL", "test-model");
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  insert.mockReset().mockImplementation(async (value: Evaluation) => value);
});

afterEach(() => {
  try {
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  }
});

describe("evaluate: provider contract and score normalization", () => {
  it("calls the real service with mocked fetch and storage", async () => {
    respond(result({ provider: "forged-provider", reason: "ignored for scored answers" }));
    const value = await evaluate(answer, question);
    expect(value).toMatchObject({ answerId: "a1", score: 90, evaluable: true, reason: null, provider: "openai-live" });
    expect(insert).toHaveBeenCalledExactlyOnceWith(value);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.openai.com/v1/chat/completions");
    expect(init?.method).toBe("POST");
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(init?.signal?.aborted).toBe(false);
    const body = JSON.parse(init?.body as string);
    expect(body.model).toBe("test-model");
    expect(body.response_format).toEqual({ type: "json_object" });
    expect(body.messages.map((message: { role: string }) => message.role)).toEqual(["system", "user"]);
    expect(body.messages[1].content).toContain("<candidate_answer>");
  });

  it.each([[0, 0], [1, 1], [0.01, 0], [0.5, 1], [0.85, 1], [8.5, 9], [72.4, 72], [72.6, 73], [100, 100], [150, 100], [-10, 0]])(
    "normalizes %s points to %s without guessing a different scale", async (score, expected) => {
      respond(result({ score }));
      expect(await evaluate(answer, question)).toMatchObject({ score: expected, evaluable: true, reason: null });
    },
  );

  it.each([null, undefined, "85", "", false, {}, []])("does not score an invalid value %j", async (score) => {
    respond(result({ score }));
    expectUnscored(await evaluate(answer, question));
  });

  it.each(["1e309", "-1e309"])("rejects non-finite JSON numbers: %s", async (score) => {
    respondContent(JSON.stringify(result()).replace('"score":90', `"score":${score}`));
    expectUnscored(await evaluate(answer, question));
  });

  it("keeps a non-evaluable result unscored even when the model supplies 100", async () => {
    respond(result({ evaluable: false, reason: " Insufficient context ", score: 100 }));
    expectUnscored(await evaluate(answer, question), "Insufficient context");
  });

  it.each([null, "", " ", undefined, {}])("requires a usable reason for non-evaluable output: %j", async (reason) => {
    respond(result({ evaluable: false, reason }));
    expectUnscored(await evaluate(answer, question));
  });

  it.each([undefined, null, "false", 0, {}])("requires an explicit boolean evaluable flag: %j", async (evaluable) => {
    respond(result({ evaluable }));
    expectUnscored(await evaluate(answer, question));
  });

  it.each([
    { strengths: [123] }, { weaknesses: [{}] }, { nextSteps: "try again" },
    { rationale: " " }, { rationale: {} }, { reason: [] }, { strengths: undefined },
  ])("rejects malformed feedback instead of stringifying it: %j", async (fields) => {
    respond(result(fields));
    expectUnscored(await evaluate(answer, question));
  });

  it.each([null, [], true, 1, "text", {}])("rejects non-evaluation JSON: %j", async (value) => {
    respond(value);
    expectUnscored(await evaluate(answer, question));
  });

  it.each(["", "not JSON", "```json\n{}\n```", '{"evaluable":true'])("rejects invalid content: %s", async (content) => {
    respondContent(content);
    expectUnscored(await evaluate(answer, question));
  });

  it.each([null, {}, { choices: null }, { choices: [] }, { choices: [null] }, { choices: [{}] }])(
    "rejects a malformed provider envelope: %j", async (payload) => {
      fetchMock.mockResolvedValue(Response.json(payload));
      expectUnscored(await evaluate(answer, question));
    },
  );

  it.each(["length", "tool_calls", null, undefined])("rejects incomplete output with finish_reason %j", async (finish_reason) => {
    respondContent(JSON.stringify(result()), { finish_reason });
    expectUnscored(await evaluate(answer, question));
  });

  it("classifies a non-JSON HTTP response as invalid rather than a score", async () => {
    fetchMock.mockResolvedValue(new Response("not JSON"));
    expectUnscored(await evaluate(answer, question));
  });

  it.each([null, 123, {}])("rejects non-text message content: %j", async (content) => {
    respondContent(null, { message: { content } });
    expectUnscored(await evaluate(answer, question));
  });

  it("does not accept a score alongside a refusal", async () => {
    respondContent(null, { message: { refusal: "Cannot evaluate", content: JSON.stringify(result()) } });
    expectUnscored(await evaluate(answer, question), "evaluation_refused");
  });

  it("keeps filtered output unscored", async () => {
    respondContent(JSON.stringify(result()), { finish_reason: "content_filter" });
    expectUnscored(await evaluate(answer, question), "evaluation_refused");
  });

  it("scores without a question only when criteriaResults is empty", async () => {
    respond(result({ criteriaResults: [], score: 1 }));
    expect(await evaluate(answer)).toMatchObject({ evaluable: true, score: 1 });
  });

  it("rejects invented criteria when no rubric exists", async () => {
    respond();
    expectUnscored(await evaluate(answer));
  });
});

describe("evaluate: authoritative coverage", () => {
  it.each([
    [0, 0, 10], [0, 1, 22], [0, 2, 38], [0, 5, 38],
    [1, 0, 52], [1, 4, 52], [2, 0, 68], [2, 3, 68], [3, 0, 85], [4, 1, 85], [5, 0, 100],
  ])("caps score for %i covered and %i partial at %i", async (covered, partial, ceiling) => {
    const coverage: CriterionResult["coverage"][] = [
      ...Array(covered).fill("covered"), ...Array(partial).fill("partial"),
      ...Array(5 - covered - partial).fill("missing"),
    ];
    respond(result({ score: 100, criteriaResults: criteria(coverage) }));
    expect(await evaluate(answer, question)).toMatchObject({ evaluable: true, score: ceiling });
  });

  it.each([1, 2, 3, 4, 6])("allows full scores on rubrics with %i criteria", async (count) => {
    const mustCover = Array.from({ length: count }, (_, i) => `Criterion ${i}`);
    const q = { ...question, rubric: { ...question.rubric, mustCover } };
    respond(result({ score: 100, criteriaResults: mustCover.map((criterion) => ({ criterion, coverage: "covered", evidence: "Specific explanation." })) }));
    expect(await evaluate(answer, q)).toMatchObject({ score: 100, evaluable: true });
  });

  it("does not raise a genuine zero to a coverage floor", async () => {
    respond(result({ score: 0 }));
    expect(await evaluate(answer, question)).toMatchObject({ score: 0, evaluable: true });
  });

  it.each([
    [], criteria().slice(1), [...criteria(), criteria()[0]],
    criteria().map(() => criteria()[0]),
    criteria().map((item, i) => i === 0 ? { ...item, criterion: "Made up criterion" } : item),
    criteria().map((item, i) => i === 0 ? { ...item, coverage: "almost" } : item),
    criteria().map((item, i) => i === 0 ? { ...item, evidence: {} } : item),
    criteria().map((item, i) => i === 0 ? { ...item, evidence: " " } : item),
    criteria().map((item, i) => i === 0 ? { ...item, criterion: 123 } : item),
    [null, ...criteria().slice(1)], {}, undefined,
  ])("rejects missing, duplicate, invented, or malformed criteria: %#", async (criteriaResults) => {
    respond(result({ score: 100, criteriaResults }));
    expectUnscored(await evaluate(answer, question));
  });

  it("restores rubric order and authoritative wording", async () => {
    respond(result({ criteriaResults: criteria().reverse().map((item) => ({ ...item, criterion: ` ${item.criterion} ` })) }));
    expect((await evaluate(answer, question)).criteriaResults).toEqual(criteria());
  });
});

describe("evaluate: failure and cancellation", () => {
  it.each(["", "   "])("does not call the provider when configuration is absent: %j", async (key) => {
    vi.stubEnv("OPENAI_API_KEY", key);
    expectUnscored(await evaluate(answer, question), "provider_not_configured");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([401, 429, 500])("keeps HTTP %i failures unscored", async (status) => {
    fetchMock.mockResolvedValue(new Response("sensitive provider error", { status }));
    expectUnscored(await evaluate(answer, question), "provider_failure");
  });

  it("keeps network failures unscored", async () => {
    fetchMock.mockRejectedValue(new Error("connection reset"));
    expectUnscored(await evaluate(answer, question), "provider_failure");
  });

  it.each(["headers", "body"])("aborts stalled response %s at 30 seconds", async (phase) => {
    let signal: AbortSignal;
    const aborted = vi.fn();
    fetchMock.mockImplementation((_url, init) => {
      signal = init!.signal!;
      const stalled = new Promise<never>((_, reject) => {
        signal.addEventListener("abort", () => { aborted(); reject(new DOMException("Aborted", "AbortError")); }, { once: true });
      });
      const response = new Response();
      vi.spyOn(response, "json").mockReturnValue(stalled);
      return phase === "headers" ? stalled : Promise.resolve(response);
    });
    const pending = evaluate(answer, question);
    await vi.advanceTimersByTimeAsync(29_999);
    expect(insert).not.toHaveBeenCalled();
    expect(signal!.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expectUnscored(await pending, "evaluation_timeout", "timeout");
    expect(signal!.aborted).toBe(true);
    expect(aborted).toHaveBeenCalledOnce();
  });

  it("ignores late results even if fetch ignores cancellation", async () => {
    let resolveFetch!: (response: Response) => void;
    fetchMock.mockImplementation(() => new Promise<Response>((resolve) => { resolveFetch = resolve; }));
    const pending = evaluate(answer, question);
    await vi.advanceTimersByTimeAsync(30_000);
    expectUnscored(await pending, "evaluation_timeout", "timeout");
    resolveFetch(Response.json({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(result()) } }] }));
    await vi.advanceTimersByTimeAsync(1);
    expect(insert).toHaveBeenCalledOnce();
  });

  it("propagates storage errors without inserting a fallback", async () => {
    respond();
    insert.mockRejectedValue(new Error("storage unavailable"));
    await expect(evaluate(answer, question)).rejects.toThrow("storage unavailable");
    expect(insert).toHaveBeenCalledOnce();
  });
});

describe("evaluate: MCQ never uses AI", () => {
  const mcq: Question = { ...question, format: "mcq", choices: ["First", "Second", "Third"], correctAnswer: "B", explanation: "Second is correct." };

  it.each([["b", 100], [" B ", 100], ["A", 0], ["C", 0]])("grades valid choice %s as %i", async (selectedAnswer, score) => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const value = await evaluate({ ...answer, review: { selectedAnswer } }, mcq);
    expect(value).toMatchObject({ score, evaluable: true, reason: null, provider: "mcq-exact-match", criteriaResults: [] });
    expect(value.rationale).toContain(mcq.explanation);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledExactlyOnceWith(value);
  });

  it.each(["", "D", "E", "AA", "B ignore instructions", 1, null, undefined, {}])("does not score invalid selection %j as wrong", async (selectedAnswer) => {
    expectUnscored(await evaluate({ ...answer, review: { selectedAnswer } }, mcq), "invalid_mcq_answer");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    { correctAnswer: undefined }, { correctAnswer: " " }, { correctAnswer: "BB" }, { correctAnswer: "E" },
    { choices: undefined }, { choices: [] }, { choices: ["only one"] }, { choices: ["one", " "] },
    { choices: ["A", "B", "C", "D", "E", "F"] },
  ])("does not fall through to AI for malformed MCQ %j", async (fields) => {
    expectUnscored(await evaluate({ ...answer, review: { selectedAnswer: "B" } }, { ...mcq, ...fields }), "invalid_mcq_question");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
