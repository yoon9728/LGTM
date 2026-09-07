import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { drizzle } from "drizzle-orm/pg-proxy";
import type { Context, Next } from "hono";

const mocks = vi.hoisted(() => ({ getPgDb: vi.fn(), authenticated: true }));
vi.mock("../db/index.js", () => ({ getPgDb: mocks.getPgDb }));
vi.mock("../middleware/auth.js", () => ({
  requireAuth: async (c: Context, next: Next) => {
    if (!mocks.authenticated) return c.json({ error: "Authentication required" }, 401);
    c.set("user", { id: "owner", name: "Test User", email: "test@example.test" });
    await next();
  },
}));
import { statsRoutes } from "./stats.js";
import { historyRoutes } from "./history.js";

const query = vi.fn<(sql: string, params: unknown[]) => Promise<{ rows: unknown[][] }>>();
let results: unknown[][][];
const older = "2026-01-01T12:00:00.000Z";
const newer = "2026-01-02T12:00:00.000Z";

beforeEach(() => {
  mocks.authenticated = true;
  results = [];
  query.mockReset().mockImplementation(async (sql) => {
    expect(sql).toMatch(/^select /);
    const rows = results.shift();
    if (!rows) throw new Error("Unexpected read query");
    return { rows };
  });
  mocks.getPgDb.mockReset().mockReturnValue(drizzle(query));
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Network forbidden in route tests"); }));
});

afterEach(() => {
  expect(fetch).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
});

function assertLatest(sql: string) {
  expect(sql).toContain('select distinct on ("answers"."session_id")');
  expect(sql).toContain('order by "answers"."session_id", "evaluations"."created_at" desc, "evaluations"."id" desc');
  expect(sql).toContain('CASE WHEN "evaluations"."status" = \'completed\'');
  expect(sql).toContain('"evaluations"."evaluable" = true');
  expect(sql).toContain('"evaluations"."score" BETWEEN 0 AND 100');
  expect(sql).toContain('THEN "evaluations"."score" ELSE NULL END');
  // Eligibility is in CASE, not WHERE: failures remain the newest attempt.
  expect(sql).not.toMatch(/where[^)]*"evaluations"\."(?:status|evaluable)"/);
}

function assertSessionOrdering(sql: string) {
  expect(sql).toContain('order by "sessions"."created_at" desc, "sessions"."id" desc');
}

function homeResults() {
  return [
    [["code_review", "2", "9", "100"], ["debugging", "1", "80", "80"], ["unscored", "1", null, null]],
    [["new", "code_review", "18", newer], ["old", "code_review", "0", older]],
    [["failed", "Failed retry", "code_review", "security", "answer_submitted", null, newer],
      ["old", "Old question", "code_review", "security", "answer_submitted", "0", older]],
    [],
    [["4", "3", "33"]],
    [["546"]],
    [["q1", "100"], ["q2", "80"], ["q3", null]],
    [["0"]],
  ];
}

function categoryResults(criteriaRows: unknown[][] = []) {
  return [
    [["3", "2", "40", "100"]],
    [["20"]],
    [["q1", "100"], ["q2", "0"]],
    [["new", "80", newer, "security"], ["old", "0", older, "security"]],
    [["security", "2", "40", "100"], ["unscored", "1", null, null]],
    [["security", "10"], ["unscored", "10"]],
    criteriaRows,
    [["failed", "Failed retry", "security", "answer_submitted", null, newer],
      ["old", "Old question", "security", "answer_submitted", "0", older]],
  ];
}

describe("stats/history access and read-only queries", () => {
  it.each(["overview", "category", "history"])("requires authentication before %s queries", async (route) => {
    mocks.authenticated = false;
    const response = route === "history" ? await historyRoutes.request("/") : await statsRoutes.request(route === "category" ? "/code_review" : "/");
    expect(response.status).toBe(401);
    expect(mocks.getPgDb).not.toHaveBeenCalled();
    expect(query).not.toHaveBeenCalled();
  });

  it("binds category input as data, never interpolated SQL", async () => {
    const category = "x' OR 1=1 --";
    results = categoryResults();
    const response = await statsRoutes.request(`/${encodeURIComponent(category)}`);
    expect(response.status).toBe(200);
    for (const [sql, params] of query.mock.calls) {
      expect(sql).not.toContain(category);
      expect(params).toContain(category);
    }
  });
});

describe("history", () => {
  it("uses one latest evaluation per session with stable newest-first ordering", async () => {
    results = [[
      ["failed", "answer_submitted", newer, "Failed retry", "code_review", "security", null, null],
      ["zero", "answer_submitted", older, "Zero score", "code_review", "security", "typescript", "0"],
    ]];
    const response = await historyRoutes.request("/");
    expect(response.status).toBe(200);
    const { history } = await response.json();
    expect(history.map((row: { sessionId: string }) => row.sessionId)).toEqual(["failed", "zero"]);
    expect(history[0]).toMatchObject({ score: null, questionLanguage: null, createdAt: newer });
    expect(history[1]).toMatchObject({ score: 0, questionLanguage: "typescript", createdAt: older });
    expect(query).toHaveBeenCalledOnce();
    const [sql, params] = query.mock.calls[0];
    assertLatest(sql);
    assertSessionOrdering(sql);
    expect(sql).toContain('left join (select distinct on');
    expect(sql).not.toContain('left join "answers"');
    expect(sql).not.toContain('left join "evaluations"');
    expect(params).toEqual(["owner", "owner"]);
  });

  it("returns an empty history without fabricating scores", async () => {
    results = [[]];
    expect(await (await historyRoutes.request("/")).json()).toEqual({ ok: true, history: [] });
  });
});

describe("stats overview", () => {
  it("decodes PostgreSQL aggregate strings as numbers and preserves zero/null", async () => {
    results = homeResults();
    const response = await statsRoutes.request("/");
    expect(response.status).toBe(200);
    const { stats } = await response.json();
    expect(stats.overview).toEqual({ totalSessions: 4, completedSessions: 3, avgScore: 33, streak: 0, totalQuestions: 546, solvedQuestions: 1, lgtmCount: 0 });
    expect(stats.categoryStats[0]).toEqual({ category: "code_review", sessionCount: 2, avgScore: 9, bestScore: 100 });
    expect(stats.categoryStats[2]).toMatchObject({ avgScore: null, bestScore: null });
    expect(stats.weakestCategory).toEqual({ category: "code_review", avgScore: 9 });
    expect(stats.scoreTrend.map((row: { score: number }) => row.score)).toEqual([0, 18]);
    expect(stats.recentSessions.map((row: { score: number | null }) => row.score)).toEqual([null, 0]);
    expect(results).toEqual([]);
  });

  it("uses latest scores for averages/trends/counts and historical scores only for explicit best metrics", async () => {
    results = homeResults();
    expect((await statsRoutes.request("/")).status).toBe(200);
    const calls = query.mock.calls;
    expect(calls).toHaveLength(8);
    for (const index of [0, 1, 2, 4, 7]) assertLatest(calls[index][0]);
    for (const index of [0, 4]) expect(calls[index][0]).toContain('AVG("latest_evaluation"."latest_score")');
    expect(calls[0][0]).toContain('MAX("best_evaluation"."best_score")');
    expect(calls[6][0]).toContain('MAX("best_evaluation"."best_score")');
    expect(calls[6][0]).not.toContain("latest_evaluation");
    expect(calls[7][0]).toContain('"latest_evaluation"."latest_score" = 100');
    expect(calls[1][0]).toContain('"latest_evaluation"."latest_score" is not null');
    expect(calls[2][0]).not.toContain('"latest_evaluation"."latest_score" is not null');
    for (const index of [1, 2]) assertSessionOrdering(calls[index][0]);
    expect(calls[1][1].at(-1)).toBe(30);
    expect(calls[2][1].at(-1)).toBe(10);
    for (const index of [0, 1, 2, 3, 4, 6, 7]) expect(calls[index][1]).toContain("owner");
  });

  it("returns null averages and empty collections when no sessions have scores", async () => {
    results = [[], [], [], [], [["0", "0", null]], [["546"]], [], [["0"]]];
    const { stats } = await (await statsRoutes.request("/")).json();
    expect(stats.overview).toMatchObject({ totalSessions: 0, completedSessions: 0, avgScore: null, lgtmCount: 0 });
    expect(stats.weakestCategory).toBeNull();
    expect(stats.scoreTrend).toEqual([]);
    expect(stats.recentSessions).toEqual([]);
  });
});

describe("category stats", () => {
  it("decodes numeric aggregates and separates latest session scores from best-ever scores", async () => {
    results = categoryResults();
    const response = await statsRoutes.request("/code_review");
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.overview).toEqual({ sessionCount: 3, completedCount: 2, avgScore: 40, bestScore: 100, totalQuestions: 20, solvedQuestions: 1 });
    expect(body.subtopicStats[0]).toEqual({ type: "security", sessionCount: 2, avgScore: 40, bestScore: 100, totalQuestions: 10 });
    expect(body.subtopicStats[1]).toMatchObject({ avgScore: null, bestScore: null });
    expect(body.scoreTrend.map((row: { score: number }) => row.score)).toEqual([0, 80]);
    expect(body.sessions.map((row: { score: number | null }) => row.score)).toEqual([null, 0]);
    const calls = query.mock.calls;
    expect(calls).toHaveLength(8);
    for (const index of [0, 3, 4, 6, 7]) assertLatest(calls[index][0]);
    for (const index of [0, 4]) {
      expect(calls[index][0]).toContain('AVG("latest_evaluation"."latest_score")');
      expect(calls[index][0]).toContain('MAX("best_evaluation"."best_score")');
    }
    expect(calls[2][0]).toContain('MAX("best_evaluation"."best_score")');
    expect(calls[6][0]).toContain('"latest_evaluation"."latest_score" is not null');
    expect(calls[7][0]).not.toContain("MAX(");
    for (const index of [3, 7]) assertSessionOrdering(calls[index][0]);
    for (const index of [0, 2, 3, 4, 6, 7]) expect(calls[index][1]).toContain("owner");
  });

  it("builds insights from criterion/coverage and ignores malformed, duplicate, and legacy entries", async () => {
    const criterion = (name: string, coverage: string) => ({ criterion: name, coverage, evidence: "Answer reference" });
    results = categoryResults([
      [[criterion("Safe queries", "covered"), criterion("Safe queries", "covered"), criterion("Explanation", "partial"), criterion("Edge cases", "missing")]],
      [[criterion("Safe queries", "covered"), criterion("Explanation", "covered"), criterion("Edge cases", "missing")]],
      [[criterion("Safe queries", "partial"), criterion("Explanation", "missing"), null, {},
        { label: "Legacy shape", met: true }, criterion(" ", "covered"), criterion("Invalid", "almost"),
        { criterion: 123, coverage: "covered" }]],
      [null], ["not an array"],
    ]);
    const { criteriaInsights } = await (await statsRoutes.request("/code_review")).json();
    expect(criteriaInsights.mostCovered).toEqual([{ label: "Safe queries", covered: 2, total: 3, rate: 2 / 3 }]);
    expect(criteriaInsights.mostMissed).toEqual([
      { label: "Edge cases", covered: 0, total: 2, rate: 0 },
      { label: "Explanation", covered: 1, total: 3, rate: 1 / 3 },
    ]);
  });

  it("does not turn prototype-like subtopic names into nonnumeric totals", async () => {
    results = categoryResults();
    results[4] = [["constructor", "1", null, null], ["__proto__", "1", null, null]];
    results[5] = [["__proto__", "2"]];
    const body = await (await statsRoutes.request("/code_review")).json();
    expect(body.subtopicStats.map((row: { totalQuestions: number }) => row.totalQuestions)).toEqual([0, 2]);
  });

  it("retains null category averages when no scored attempts exist", async () => {
    results = [[["0", "0", null, null]], [["0"]], [], [], [], [], [], []];
    const body = await (await statsRoutes.request("/unknown_category")).json();
    expect(body.overview).toEqual({ sessionCount: 0, completedCount: 0, avgScore: null, bestScore: null, totalQuestions: 0, solvedQuestions: 0 });
    expect(body.criteriaInsights).toEqual({ mostCovered: [], mostMissed: [] });
    expect(body.sessions).toEqual([]);
  });
});
