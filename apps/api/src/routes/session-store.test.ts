import { beforeEach, describe, expect, it, vi } from "vitest";
import { sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

const query = vi.hoisted(() => ({
  select: vi.fn(), update: vi.fn(), from: vi.fn(), set: vi.fn(), where: vi.fn(),
  orderBy: vi.fn(), limit: vi.fn(), returning: vi.fn(),
}));

// Import the real store but never create a database client or execute SQL.
vi.mock("../db/index.js", () => ({ getPgDb: () => query }));

import { db } from "../data/store.js";

const dialect = new PgDialect();

beforeEach(() => {
  vi.resetAllMocks();
  for (const method of [query.select, query.update, query.from, query.set, query.where, query.orderBy]) {
    method.mockReturnValue(query);
  }
  query.limit.mockResolvedValue([]);
  query.returning.mockResolvedValue([]);
});

describe("session result lookup queries", () => {
  it.each([
    { table: "answers", parentColumn: "session_id", find: () => db.answers.findBySessionId("session-1"), id: "session-1" },
    { table: "evaluations", parentColumn: "answer_id", find: () => db.evaluations.findByAnswerId("answer-1"), id: "answer-1" },
  ])("fetches the latest $table row with deterministic ties and limit 1", async ({ table, parentColumn, find, id }) => {
    expect(await find()).toBeUndefined();
    const where = dialect.sqlToQuery(query.where.mock.calls[0][0]);
    expect(where.sql).toBe(`"${table}"."${parentColumn}" = $1`);
    expect(where.params).toEqual([id]);
    const orderBy = dialect.sqlToQuery(sql.join(query.orderBy.mock.calls[0], sql`, `));
    expect(orderBy.sql).toBe(`"${table}"."created_at" desc, "${table}"."id" desc`);
    expect(query.limit).toHaveBeenCalledWith(1);
  });

  it("maps the selected answer row", async () => {
    query.limit.mockResolvedValue([{
      id: "latest-answer", sessionId: "session-1", questionId: "question-1", content: { summary: "review" },
      status: "submitted", createdAt: new Date("2026-01-01T00:00:00.000Z"),
    }]);
    expect(await db.answers.findBySessionId("session-1")).toEqual({
      id: "latest-answer", sessionId: "session-1", questionId: "question-1", review: { summary: "review" },
      status: "submitted", createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("maps the selected evaluation row", async () => {
    query.limit.mockResolvedValue([{
      id: "latest-evaluation", answerId: "answer-1", status: "completed", score: 80,
      evaluable: true, reason: null, rationale: "Good", strengths: [], weaknesses: [], nextSteps: [],
      criteriaResults: [], provider: "test", createdAt: new Date("2026-01-01T00:00:00.000Z"),
      completedAt: new Date("2026-01-01T00:00:01.000Z"),
    }]);
    expect(await db.evaluations.findByAnswerId("answer-1")).toMatchObject({
      id: "latest-evaluation", score: 80, createdAt: "2026-01-01T00:00:00.000Z", completedAt: "2026-01-01T00:00:01.000Z",
    });
  });
});

describe("guarded session language update", () => {
  it("checks current status and absence of an answer in the update statement", async () => {
    query.returning.mockResolvedValue([{ id: "session-1" }]);
    expect(await db.sessions.updateLanguage("session-1", "python")).toBe(true);
    expect(query.set).toHaveBeenCalledWith({ language: "python" });
    const where = dialect.sqlToQuery(query.where.mock.calls[0][0]);
    expect(where.sql).toContain('"sessions"."id" = $1');
    expect(where.sql).toContain('"sessions"."status" = $2');
    expect(where.sql).toContain('NOT EXISTS (SELECT 1 FROM "answers" WHERE "answers"."session_id" = "sessions"."id")');
    expect(where.params).toEqual(["session-1", "question_ready"]);
    expect(query.returning).toHaveBeenCalledOnce();
  });

  it("reports when no eligible session was updated", async () => {
    expect(await db.sessions.updateLanguage("session-1", "python")).toBe(false);
  });
});
