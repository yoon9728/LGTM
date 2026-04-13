import { eq, and, sql, desc } from "drizzle-orm";
import { getPgDb } from "../db/index.js";
import {
  sessions as sessionsTable,
  answers as answersTable,
  evaluations as evaluationsTable,
  questions as questionsTable,
} from "../db/schema.js";
import type { Question } from "./questions.js";

// ── Types (kept for backward compat with routes/services) ──

export interface Session {
  id: string;
  candidateId: string;
  language: string | null;
  status: "question_ready" | "answer_submitted";
  question: Question;
  createdAt: string;
}

export interface Answer {
  id: string;
  sessionId: string;
  questionId: string;
  review: Record<string, unknown>;
  status: "submitted";
  createdAt: string;
}

export interface CriterionResult {
  criterion: string;
  coverage: "covered" | "partial" | "missing";
  evidence: string;
}

export interface Evaluation {
  id: string;
  answerId: string;
  status: "completed" | "timeout";
  score: number | null;
  evaluable: boolean;
  reason: string | null;
  rationale: string | null;
  strengths: string[];
  weaknesses: string[];
  nextSteps: string[];
  criteriaResults: CriterionResult[];
  provider: string;
  createdAt: string;
  completedAt: string | null;
}

// ── Helper to build Question from DB row ──

function toQuestion(qRow: {
  id: string;
  category: string;
  type: string;
  language: string | null;
  difficulty: string | null;
  title: string;
  prompt: string;
  diff: string;
  rubric: unknown;
  templates: unknown;
  guest: boolean;
}): Question {
  return {
    id: qRow.id,
    category: qRow.category,
    type: qRow.type,
    ...(qRow.language ? { language: qRow.language } : {}),
    ...(qRow.difficulty ? { difficulty: qRow.difficulty as Question["difficulty"] } : {}),
    title: qRow.title,
    prompt: qRow.prompt,
    diff: qRow.diff,
    rubric: qRow.rubric as Question["rubric"],
    ...(qRow.templates ? { templates: qRow.templates as Record<string, string> } : {}),
    ...(qRow.guest ? { guest: true } : {}),
  };
}

// ── Helpers to convert DB rows ↔ app types ──

function toSession(row: {
  id: string;
  userId: string | null;
  questionId: string;
  language: string | null;
  status: string;
  createdAt: Date;
}, question: Question): Session {
  return {
    id: row.id,
    candidateId: row.userId ?? "guest",
    language: row.language ?? null,
    status: row.status as Session["status"],
    question,
    createdAt: row.createdAt.toISOString(),
  };
}

function toAnswer(row: {
  id: string;
  sessionId: string;
  questionId: string;
  content: unknown;
  status: string;
  createdAt: Date;
}): Answer {
  return {
    id: row.id,
    sessionId: row.sessionId,
    questionId: row.questionId,
    review: (row.content ?? {}) as Record<string, unknown>,
    status: "submitted",
    createdAt: row.createdAt.toISOString(),
  };
}

function toEvaluation(row: {
  id: string;
  answerId: string;
  status: string;
  score: number | null;
  evaluable: boolean;
  reason: string | null;
  rationale: string | null;
  strengths: unknown;
  weaknesses: unknown;
  nextSteps: unknown;
  criteriaResults: unknown;
  provider: string;
  createdAt: Date;
  completedAt: Date | null;
}): Evaluation {
  return {
    id: row.id,
    answerId: row.answerId,
    status: row.status as Evaluation["status"],
    score: row.score,
    evaluable: row.evaluable,
    reason: row.reason,
    rationale: row.rationale,
    strengths: (row.strengths ?? []) as string[],
    weaknesses: (row.weaknesses ?? []) as string[],
    nextSteps: (row.nextSteps ?? []) as string[],
    criteriaResults: (row.criteriaResults ?? []) as CriterionResult[],
    provider: row.provider,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

// ── DB access layer (async, backed by Neon Postgres) ──

export const db = {
  questions: {
    async getAll(): Promise<Question[]> {
      const rows = await getPgDb()
        .select()
        .from(questionsTable)
        .orderBy(questionsTable.category, questionsTable.type);
      return rows.map(toQuestion);
    },
    async getById(id: string): Promise<Question | undefined> {
      const [row] = await getPgDb()
        .select()
        .from(questionsTable)
        .where(eq(questionsTable.id, id));
      return row ? toQuestion(row) : undefined;
    },
    async getByCategory(
      category: string,
      type?: string,
      language?: string,
    ): Promise<Question[]> {
      const conditions = [eq(questionsTable.category, category)];
      if (type) conditions.push(eq(questionsTable.type, type));
      if (language) conditions.push(eq(questionsTable.language, language));
      const rows = await getPgDb()
        .select()
        .from(questionsTable)
        .where(and(...conditions));
      return rows.map(toQuestion);
    },
    async getGuestQuestions(): Promise<Question[]> {
      const rows = await getPgDb()
        .select()
        .from(questionsTable)
        .where(eq(questionsTable.guest, true));
      return rows.map(toQuestion);
    },
    async getFiltered(opts: {
      category?: string;
      type?: string;
      language?: string;
      guestOnly?: boolean;
    }): Promise<Question[]> {
      const conditions = [];
      if (opts.category) conditions.push(eq(questionsTable.category, opts.category));
      if (opts.type) conditions.push(eq(questionsTable.type, opts.type));
      if (opts.language) conditions.push(eq(questionsTable.language, opts.language));
      if (opts.guestOnly) conditions.push(eq(questionsTable.guest, true));
      const rows = await getPgDb()
        .select()
        .from(questionsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(questionsTable.category, questionsTable.type);
      return rows.map(toQuestion);
    },
    async getRandom(opts?: {
      category?: string;
      type?: string;
      language?: string;
      guestOnly?: boolean;
    }): Promise<Question | undefined> {
      const conditions = [];
      if (opts?.category) conditions.push(eq(questionsTable.category, opts.category));
      if (opts?.type) conditions.push(eq(questionsTable.type, opts.type));
      if (opts?.language) conditions.push(eq(questionsTable.language, opts.language));
      if (opts?.guestOnly) conditions.push(eq(questionsTable.guest, true));
      const [row] = await getPgDb()
        .select()
        .from(questionsTable)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(sql`RANDOM()`)
        .limit(1);
      return row ? toQuestion(row) : undefined;
    },
  },

  sessions: {
    async insert(s: Session): Promise<Session> {
      const [row] = await getPgDb()
        .insert(sessionsTable)
        .values({
          id: s.id,
          userId: s.candidateId === "guest" ? null : s.candidateId,
          questionId: s.question.id,
          language: s.language,
          status: s.status,
        })
        .returning();
      return toSession(row, s.question);
    },
    async get(id: string): Promise<Session | undefined> {
      const [row] = await getPgDb()
        .select()
        .from(sessionsTable)
        .innerJoin(questionsTable, eq(sessionsTable.questionId, questionsTable.id))
        .where(eq(sessionsTable.id, id));
      if (!row) return undefined;
      return toSession(row.sessions, toQuestion(row.questions));
    },
    async list(limit = 100): Promise<Session[]> {
      const rows = await getPgDb()
        .select()
        .from(sessionsTable)
        .innerJoin(questionsTable, eq(sessionsTable.questionId, questionsTable.id))
        .orderBy(desc(sessionsTable.createdAt))
        .limit(limit);
      return rows.map((r) => toSession(r.sessions, toQuestion(r.questions)));
    },
    async listByUser(userId: string, limit = 100): Promise<Session[]> {
      const rows = await getPgDb()
        .select()
        .from(sessionsTable)
        .innerJoin(questionsTable, eq(sessionsTable.questionId, questionsTable.id))
        .where(eq(sessionsTable.userId, userId))
        .orderBy(desc(sessionsTable.createdAt))
        .limit(limit);
      return rows.map((r) => toSession(r.sessions, toQuestion(r.questions)));
    },
    async updateStatus(id: string, status: Session["status"]): Promise<void> {
      await getPgDb()
        .update(sessionsTable)
        .set({
          status,
          ...(status === "answer_submitted" ? { completedAt: new Date() } : {}),
        })
        .where(eq(sessionsTable.id, id));
    },
    async updateLanguage(id: string, language: string): Promise<void> {
      await getPgDb()
        .update(sessionsTable)
        .set({ language })
        .where(eq(sessionsTable.id, id));
    },
  },

  answers: {
    async insert(a: Answer): Promise<Answer> {
      const [row] = await getPgDb()
        .insert(answersTable)
        .values({
          id: a.id,
          sessionId: a.sessionId,
          questionId: a.questionId,
          content: a.review,
          status: a.status,
        })
        .returning();
      return toAnswer(row);
    },
    async get(id: string): Promise<Answer | undefined> {
      const [row] = await getPgDb()
        .select()
        .from(answersTable)
        .where(eq(answersTable.id, id));
      return row ? toAnswer(row) : undefined;
    },
    async list(limit = 100): Promise<Answer[]> {
      const rows = await getPgDb()
        .select()
        .from(answersTable)
        .orderBy(desc(answersTable.createdAt))
        .limit(limit);
      return rows.map(toAnswer);
    },
    async findBySessionId(sessionId: string): Promise<Answer | undefined> {
      const [row] = await getPgDb()
        .select()
        .from(answersTable)
        .where(eq(answersTable.sessionId, sessionId));
      return row ? toAnswer(row) : undefined;
    },
  },

  evaluations: {
    async insert(e: Evaluation): Promise<Evaluation> {
      const [row] = await getPgDb()
        .insert(evaluationsTable)
        .values({
          id: e.id,
          answerId: e.answerId,
          status: e.status,
          score: e.score,
          evaluable: e.evaluable,
          reason: e.reason,
          rationale: e.rationale,
          strengths: e.strengths,
          weaknesses: e.weaknesses,
          nextSteps: e.nextSteps,
          criteriaResults: e.criteriaResults,
          provider: e.provider,
          completedAt: e.completedAt ? new Date(e.completedAt) : null,
        })
        .returning();
      return toEvaluation(row);
    },
    async get(id: string): Promise<Evaluation | undefined> {
      const [row] = await getPgDb()
        .select()
        .from(evaluationsTable)
        .where(eq(evaluationsTable.id, id));
      return row ? toEvaluation(row) : undefined;
    },
    async list(limit = 100): Promise<Evaluation[]> {
      const rows = await getPgDb()
        .select()
        .from(evaluationsTable)
        .orderBy(desc(evaluationsTable.createdAt))
        .limit(limit);
      return rows.map(toEvaluation);
    },
    async findByAnswerId(answerId: string): Promise<Evaluation | undefined> {
      const [row] = await getPgDb()
        .select()
        .from(evaluationsTable)
        .where(eq(evaluationsTable.answerId, answerId));
      return row ? toEvaluation(row) : undefined;
    },
    /** Get best score per question for a user */
    async bestScoresByUser(userId: string): Promise<Map<string, number>> {
      const rows = await getPgDb()
        .select({
          questionId: sessionsTable.questionId,
          bestScore: sql<number>`MAX(${evaluationsTable.score})`.as("best_score"),
        })
        .from(evaluationsTable)
        .innerJoin(answersTable, eq(evaluationsTable.answerId, answersTable.id))
        .innerJoin(sessionsTable, eq(answersTable.sessionId, sessionsTable.id))
        .where(and(
          eq(sessionsTable.userId, userId),
          eq(evaluationsTable.status, "completed"),
        ))
        .groupBy(sessionsTable.questionId);

      const map = new Map<string, number>();
      for (const row of rows) {
        if (row.bestScore != null) {
          map.set(row.questionId, row.bestScore);
        }
      }
      return map;
    },
  },
};
