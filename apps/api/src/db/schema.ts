import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
  index,
} from "drizzle-orm/pg-core";

// ── Better Auth tables ─────────────────────────────────

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// (users table is managed by Better Auth as "user" table above)

// ── Questions ──────────────────────────────────────────
export const questions = pgTable("questions", {
  id: text("id").primaryKey(),
  category: text("category").notNull().default("code_review"),
  type: text("type").notNull(),
  language: text("language"), // for practical_coding questions
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  diff: text("diff").notNull(),
  rubric: jsonb("rubric").notNull(), // { mustCover, strongSignals, weakPatterns }
  difficulty: text("difficulty").default("medium"),
  tags: jsonb("tags").default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// ── Sessions ───────────────────────────────────────────
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id),
  questionId: text("question_id").references(() => questions.id).notNull(),
  language: text("language"), // user-chosen language for practical_coding
  status: text("status", { enum: ["question_ready", "answer_submitted"] }).notNull().default("question_ready"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (t) => [
  index("sessions_user_id_idx").on(t.userId),
  index("sessions_question_id_idx").on(t.questionId),
]);

// ── Answers ────────────────────────────────────────────
export const answers = pgTable("answers", {
  id: text("id").primaryKey(),
  sessionId: text("session_id").references(() => sessions.id).notNull(),
  questionId: text("question_id").references(() => questions.id).notNull(),
  content: jsonb("content").notNull(), // { summary, findings, diff }
  status: text("status").notNull().default("submitted"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("answers_session_id_idx").on(t.sessionId),
  index("answers_question_id_idx").on(t.questionId),
]);

// ── Evaluations ────────────────────────────────────────
export const evaluations = pgTable("evaluations", {
  id: text("id").primaryKey(),
  answerId: text("answer_id").references(() => answers.id).notNull(),
  status: text("status", { enum: ["completed", "timeout"] }).notNull(),
  score: integer("score"),
  evaluable: boolean("evaluable").notNull().default(true),
  reason: text("reason"),
  rationale: text("rationale"),
  strengths: jsonb("strengths").notNull().default([]),
  weaknesses: jsonb("weaknesses").notNull().default([]),
  nextSteps: jsonb("next_steps").notNull().default([]),
  criteriaResults: jsonb("criteria_results").notNull().default([]),
  provider: text("provider").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
}, (t) => [
  index("evaluations_answer_id_idx").on(t.answerId),
]);
