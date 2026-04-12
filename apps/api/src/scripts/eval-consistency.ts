/**
 * Evaluation Consistency Test (Full Pipeline)
 *
 * Tests the real production pipeline:
 *   1. rubric-generator generates a rubric from the question
 *   2. That generated rubric is used to evaluate the same answer N times
 *   3. Measures score variance and criteria coverage stability
 *
 * This validates both rubric generation quality AND evaluation consistency.
 *
 * Usage:
 *   npx tsx apps/api/src/scripts/eval-consistency.ts
 *   npx tsx apps/api/src/scripts/eval-consistency.ts --runs 5
 *   npx tsx apps/api/src/scripts/eval-consistency.ts --runs 5 --save
 *   npx tsx apps/api/src/scripts/eval-consistency.ts --static-rubric   # use hand-written rubrics (baseline comparison)
 */

import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "..", "..", "..", "..", ".env") });

import { buildSystemPrompt, buildUserMessage } from "../services/prompt-factory.js";
import { generateRubric } from "../services/rubric-generator.js";
import * as questions from "../data/questions.js";
import type { Question } from "../data/questions.js";
import type { Answer } from "../data/store.js";

// ── Config ──

const runsArg = process.argv.find((a) => a.startsWith("--runs"));
const RUNS = runsArg?.includes("=")
  ? parseInt(runsArg.split("=")[1]) || 5
  : runsArg
    ? parseInt(process.argv[process.argv.indexOf("--runs") + 1]) || 5
    : 5;
const SAVE = process.argv.includes("--save");
const STATIC_RUBRIC = process.argv.includes("--static-rubric");
const MODEL = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";
const API_KEY = process.env.OPENAI_API_KEY ?? "";

if (!API_KEY) {
  console.error("ERROR: OPENAI_API_KEY not set");
  process.exit(1);
}

// ── Gold Standard Answers (mid-quality, deliberately imperfect) ──

interface TestCase {
  questionId: string;
  category: string;
  answer: Record<string, unknown>;
}

const TEST_CASES: TestCase[] = [
  {
    questionId: "cr_security_001",
    category: "code_review",
    answer: {
      diff: "see question",
      summary:
        "The main issue is SQL injection. The query parameter q is directly interpolated into the SQL string without sanitization. This allows an attacker to inject arbitrary SQL. The limit parameter also has the same problem. The fix should use parameterized queries with $1, $2 placeholders.",
      findings: [
        "SQL injection via string interpolation of user input q",
        "limit parameter is also vulnerable to injection",
        "Original parameterized queries were removed",
      ],
    },
  },
  {
    questionId: "sd_scalability_001",
    category: "system_design",
    answer: {
      overview:
        "I would use a horizontally scalable architecture with load balancers distributing traffic across multiple application servers. The database would use read replicas for read-heavy workloads and a primary for writes.",
      components:
        "Load Balancer (nginx) -> Application servers (stateless, auto-scaling) -> Database (PostgreSQL with read replicas). Cache layer with Redis for frequently accessed data. CDN for static assets.",
      tradeoffs:
        "Read replicas add eventual consistency which is acceptable for this use case. Redis adds operational complexity but significantly reduces DB load.",
      scalingStrategy:
        "Start with 2 app servers behind a load balancer. Add read replicas as read traffic grows. Implement caching for hot data.",
    },
  },
  {
    questionId: "debug_runtime_001",
    category: "debugging",
    answer: {
      rootCause:
        "The .map() call crashes because orders.items is undefined. The fetchRecentOrders function intermittently returns a response without the expected items property, likely due to a timeout or service error under peak load.",
      evidence:
        "The stack trace points to dashboard.js:15 which is the orders.items.map line. The 2% failure rate during peak hours matches a timeout pattern in the downstream order service.",
      proposedFix:
        "Add defensive checks: orders?.items?.map() with a fallback empty array. Better yet, use Promise.allSettled instead of Promise.all so one failing service doesn't affect the others. Also add response shape validation after each fetch.",
    },
  },
  {
    questionId: "da_sql_001",
    category: "data_analysis",
    answer: {
      query:
        "SELECT u.id, u.name, COUNT(o.id) as order_count, SUM(o.total) as total_spent FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.name HAVING COUNT(o.id) > 0 ORDER BY total_spent DESC LIMIT 10;",
      explanation:
        "I used a LEFT JOIN to connect users with their orders, then aggregated with GROUP BY to get per-user totals. The HAVING clause filters out users with no orders.",
      optimization:
        "An index on orders(user_id) would speed up the join. For large datasets, consider materializing this as a summary table.",
    },
  },
  {
    questionId: "pc_impl_001",
    category: "practical_coding",
    answer: {
      code: `class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}
        self.order = []

    def get(self, key: int) -> int:
        if key in self.cache:
            self.order.remove(key)
            self.order.append(key)
            return self.cache[key]
        return -1

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.order.remove(key)
        elif len(self.cache) >= self.capacity:
            lru = self.order.pop(0)
            del self.cache[lru]
        self.cache[key] = value
        self.order.append(key)`,
      approach:
        "Used a dictionary for O(1) lookup and a list to track access order. On get/put, move the key to the end of the list. When over capacity, remove the first element (LRU).",
      complexity: "get: O(n) due to list.remove, put: O(n) due to list.remove. Space: O(capacity).",
      blocks: [
        {
          type: "code",
          language: "python",
          content: `class LRUCache:
    def __init__(self, capacity: int):
        self.capacity = capacity
        self.cache = {}
        self.order = []

    def get(self, key: int) -> int:
        if key in self.cache:
            self.order.remove(key)
            self.order.append(key)
            return self.cache[key]
        return -1

    def put(self, key: int, value: int) -> None:
        if key in self.cache:
            self.order.remove(key)
        elif len(self.cache) >= self.capacity:
            lru = self.order.pop(0)
            del self.cache[lru]
        self.cache[key] = value
        self.order.append(key)`,
        },
      ],
    },
  },
];

// ── OpenAI Evaluation Call (no DB writes) ──

interface EvalResult {
  evaluable: boolean;
  score: number | null;
  strengths: string[];
  weaknesses: string[];
  criteriaResults: { criterion: string; coverage: string; evidence: string }[];
  rationale: string;
}

async function callEval(answer: Answer, question: Question): Promise<EvalResult> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildSystemPrompt(question) },
        { role: "user", content: buildUserMessage(answer, question) },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body.slice(0, 200)}`);
  }

  const payload = (await res.json()) as { choices: { message: { content: string } }[] };
  const raw = JSON.parse(payload.choices[0]?.message?.content ?? "{}");

  return {
    evaluable: raw.evaluable !== false,
    score: typeof raw.score === "number" ? Math.max(0, Math.min(100, Math.round(raw.score))) : null,
    strengths: Array.isArray(raw.strengths) ? raw.strengths : [],
    weaknesses: Array.isArray(raw.weaknesses) ? raw.weaknesses : [],
    criteriaResults: Array.isArray(raw.criteriaResults) ? raw.criteriaResults : [],
    rationale: String(raw.rationale ?? ""),
  };
}

// ── Statistics ──

function mean(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function stddev(nums: number[]): number {
  const m = mean(nums);
  return Math.sqrt(nums.reduce((sum, n) => sum + (n - m) ** 2, 0) / nums.length);
}

function coverageAgreement(runs: EvalResult[]): number {
  if (runs.length < 2 || runs[0].criteriaResults.length === 0) return 1;

  const criteria = runs[0].criteriaResults.map((c) => c.criterion);
  let agreements = 0;
  let comparisons = 0;

  for (const criterion of criteria) {
    const coverages = runs
      .map((r) => r.criteriaResults.find((c) => c.criterion === criterion)?.coverage)
      .filter(Boolean);
    if (coverages.length < 2) continue;

    for (let i = 0; i < coverages.length; i++) {
      for (let j = i + 1; j < coverages.length; j++) {
        comparisons++;
        if (coverages[i] === coverages[j]) agreements++;
      }
    }
  }

  return comparisons > 0 ? agreements / comparisons : 1;
}

// ── Main ──

interface QuestionResult {
  questionId: string;
  category: string;
  title: string;
  rubricSource: "generated" | "static";
  generatedRubric?: { mustCover: string[]; strongSignals: string[]; weakPatterns: string[] };
  runs: number;
  scores: number[];
  meanScore: number;
  stddev: number;
  minScore: number;
  maxScore: number;
  range: number;
  coverageAgreement: number;
  pass: boolean;
  details: EvalResult[];
}

async function runTest(tc: TestCase): Promise<QuestionResult> {
  const originalQuestion = questions.getById(tc.questionId);
  if (!originalQuestion) throw new Error(`Question ${tc.questionId} not found`);

  let question: Question;
  let rubricSource: "generated" | "static";
  let generatedRubric: QuestionResult["generatedRubric"];

  if (STATIC_RUBRIC) {
    // Use the hand-written rubric from questions.ts as baseline
    question = originalQuestion;
    rubricSource = "static";
    console.log(`  [rubric] Using static (hand-written)`);
  } else {
    // Generate rubric via AI — this is the real production path
    console.log(`  [rubric] Generating via AI...`);
    const rubric = await generateRubric({
      category: originalQuestion.category,
      type: originalQuestion.type,
      title: originalQuestion.title,
      prompt: originalQuestion.prompt,
      diff: originalQuestion.diff || undefined,
      language: originalQuestion.language,
    });
    question = { ...originalQuestion, rubric };
    rubricSource = "generated";
    generatedRubric = rubric;
    console.log(`  [rubric] Generated: ${rubric.mustCover.length} mustCover, ${rubric.strongSignals.length} strongSignals, ${rubric.weakPatterns.length} weakPatterns`);
  }

  const fakeAnswer: Answer = {
    id: "consistency-test",
    sessionId: "consistency-test",
    questionId: tc.questionId,
    review: tc.answer,
    status: "submitted",
    createdAt: new Date().toISOString(),
  };

  const results: EvalResult[] = [];

  for (let i = 0; i < RUNS; i++) {
    process.stdout.write(`  Run ${i + 1}/${RUNS}...`);
    try {
      const result = await callEval(fakeAnswer, question);
      results.push(result);
      process.stdout.write(` score=${result.score}\n`);
    } catch (err) {
      process.stdout.write(` ERROR: ${err}\n`);
    }
    if (i < RUNS - 1) await new Promise((r) => setTimeout(r, 500));
  }

  const scores = results.map((r) => r.score).filter((s): s is number => s != null);
  const m = scores.length > 0 ? mean(scores) : 0;
  const sd = scores.length > 1 ? stddev(scores) : 0;
  const ca = coverageAgreement(results);

  return {
    questionId: tc.questionId,
    category: tc.category,
    title: originalQuestion.title,
    rubricSource,
    generatedRubric,
    runs: results.length,
    scores,
    meanScore: Math.round(m * 10) / 10,
    stddev: Math.round(sd * 10) / 10,
    minScore: scores.length > 0 ? Math.min(...scores) : 0,
    maxScore: scores.length > 0 ? Math.max(...scores) : 0,
    range: scores.length > 0 ? Math.max(...scores) - Math.min(...scores) : 0,
    coverageAgreement: Math.round(ca * 1000) / 10,
    pass: sd <= 10 && ca >= 0.8,
    details: results,
  };
}

async function main() {
  const mode = STATIC_RUBRIC ? "static rubrics (baseline)" : "AI-generated rubrics (production)";
  const totalCalls = TEST_CASES.length * RUNS + (STATIC_RUBRIC ? 0 : TEST_CASES.length);

  console.log(`\n╔══════════════════════════════════════════════╗`);
  console.log(`║   LGTM Evaluation Consistency Test           ║`);
  console.log(`╠══════════════════════════════════════════════╣`);
  console.log(`║  Mode: ${mode.padEnd(38)}║`);
  console.log(`║  Model: ${MODEL.padEnd(37)}║`);
  console.log(`║  Runs per question: ${String(RUNS).padEnd(25)}║`);
  console.log(`║  Questions: ${String(TEST_CASES.length).padEnd(33)}║`);
  console.log(`║  Total API calls: ~${String(totalCalls).padEnd(26)}║`);
  console.log(`╚══════════════════════════════════════════════╝\n`);

  const results: QuestionResult[] = [];

  for (const tc of TEST_CASES) {
    const question = questions.getById(tc.questionId);
    console.log(`▸ ${tc.category} — ${question?.title ?? tc.questionId}`);
    const result = await runTest(tc);
    results.push(result);
    console.log();
  }

  // ── Summary Table ──
  console.log(`\n${"═".repeat(90)}`);
  console.log("RESULTS");
  console.log("═".repeat(90));
  console.log(
    "Category".padEnd(20) +
    "Question".padEnd(30) +
    "Mean".padEnd(8) +
    "StdDev".padEnd(8) +
    "Range".padEnd(8) +
    "CovAgr%".padEnd(9) +
    "Status"
  );
  console.log("─".repeat(90));

  for (const r of results) {
    const status = r.pass ? "PASS" : "FAIL";
    console.log(
      r.category.padEnd(20) +
      r.title.slice(0, 28).padEnd(30) +
      String(r.meanScore).padEnd(8) +
      String(r.stddev).padEnd(8) +
      String(r.range).padEnd(8) +
      `${r.coverageAgreement}%`.padEnd(9) +
      status
    );
  }
  console.log("─".repeat(90));

  const allPass = results.every((r) => r.pass);
  const avgStddev = mean(results.map((r) => r.stddev));
  const avgCovAgr = mean(results.map((r) => r.coverageAgreement));

  console.log(
    "OVERALL".padEnd(50) +
    `avg sd=${Math.round(avgStddev * 10) / 10}`.padEnd(16) +
    `avg cov=${Math.round(avgCovAgr * 10) / 10}%`.padEnd(15) +
    (allPass ? "ALL PASS" : "SOME FAIL")
  );
  console.log(`\nPass criteria: StdDev <= 10, Coverage Agreement >= 80%\n`);

  // ── Save Report ──
  if (SAVE) {
    const reportPath = resolve(__dirname, "..", "..", "..", "..", "docs", "eval-consistency-report.md");
    const now = new Date().toISOString().split("T")[0];

    let md = `# Evaluation Consistency Report\n\n`;
    md += `**Date:** ${now}  \n`;
    md += `**Mode:** ${mode}  \n`;
    md += `**Model:** ${MODEL}  \n`;
    md += `**Runs per question:** ${RUNS}  \n`;
    md += `**Pass criteria:** StdDev <= 10, Coverage Agreement >= 80%  \n\n`;

    md += `## Summary\n\n`;
    md += `| Category | Question | Mean | StdDev | Range | Coverage Agreement | Status |\n`;
    md += `|----------|----------|------|--------|-------|--------------------|--------|\n`;
    for (const r of results) {
      md += `| ${r.category} | ${r.title} | ${r.meanScore} | ${r.stddev} | ${r.range} | ${r.coverageAgreement}% | ${r.pass ? "PASS" : "FAIL"} |\n`;
    }
    md += `\n**Overall:** avg StdDev=${Math.round(avgStddev * 10) / 10}, avg Coverage Agreement=${Math.round(avgCovAgr * 10) / 10}% — ${allPass ? "ALL PASS" : "SOME FAIL"}\n`;

    // Generated rubrics section
    if (!STATIC_RUBRIC) {
      md += `\n## Generated Rubrics\n\n`;
      for (const r of results) {
        if (!r.generatedRubric) continue;
        md += `### ${r.category} — ${r.title}\n\n`;
        md += `**mustCover:**\n`;
        for (const item of r.generatedRubric.mustCover) {
          md += `1. ${item}\n`;
        }
        md += `\n**strongSignals:**\n`;
        for (const item of r.generatedRubric.strongSignals) {
          md += `- ${item}\n`;
        }
        md += `\n**weakPatterns:**\n`;
        for (const item of r.generatedRubric.weakPatterns) {
          md += `- ${item}\n`;
        }
        md += `\n`;
      }
    }

    md += `\n## Score Distributions\n\n`;
    for (const r of results) {
      md += `### ${r.category} — ${r.title}\n\n`;
      md += `Scores: ${r.scores.join(", ")}  \n`;
      md += `Mean: ${r.meanScore} | StdDev: ${r.stddev} | Range: ${r.minScore}–${r.maxScore}  \n\n`;

      if (r.details[0]?.criteriaResults.length > 0) {
        md += `| Criterion | ${r.details.map((_, i) => `Run ${i + 1}`).join(" | ")} |\n`;
        md += `|-----------|${r.details.map(() => "--------").join("|")}|\n`;
        const criteria = r.details[0].criteriaResults.map((c) => c.criterion);
        for (const crit of criteria) {
          const coverages = r.details.map(
            (d) => d.criteriaResults.find((c) => c.criterion === crit)?.coverage ?? "—"
          );
          md += `| ${crit.slice(0, 60)}${crit.length > 60 ? "..." : ""} | ${coverages.join(" | ")} |\n`;
        }
        md += `\n`;
      }
    }

    writeFileSync(reportPath, md);
    console.log(`Report saved to: docs/eval-consistency-report.md\n`);
  }

  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
