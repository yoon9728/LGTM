/**
 * AI-powered rubric generator.
 * Given a question's content (category, type, title, prompt, diff),
 * generates mustCover / strongSignals / weakPatterns automatically.
 */

// ── Category-specific analysis lenses ──────────────────

const CATEGORY_LENSES: Record<string, string> = {
  code_review: `### Analysis Lens: Code Review
Focus on these dimensions when extracting rubric criteria:
- **Security vulnerabilities**: injection (SQL, XSS, command), auth bypass, token/secret exposure, SSRF, path traversal
- **Data integrity**: race conditions, lost updates, inconsistent state, transaction boundaries
- **Error handling**: silent catches, error info leakage, missing validation, unchecked nulls
- **Performance**: N+1 queries, unbounded fetches, missing indexes, memory leaks, blocking I/O
- **API contract changes**: response shape changes, breaking changes, unintended field exposure
- **Concurrency**: thread safety, deadlocks, TOCTOU, shared mutable state
- **Testing gaps**: what edge cases need test coverage after this change`,

  system_design: `### Analysis Lens: System Design
Focus on these dimensions when extracting rubric criteria:
- **Core component selection**: why this database/queue/cache/protocol — justify choices
- **Scalability**: identify bottlenecks, horizontal vs vertical, sharding strategy, read/write ratio
- **Reliability**: single points of failure, failover, circuit breakers, graceful degradation
- **Data model**: consistency model (strong/eventual), partitioning strategy, replication lag handling
- **Trade-offs**: CAP theorem positioning, latency vs throughput, cost vs performance
- **Operational concerns**: monitoring, alerting, deployment strategy, rollback plan
- **Security boundary**: auth flow, data isolation, encryption at rest/transit`,

  debugging: `### Analysis Lens: Debugging
Focus on these dimensions when extracting rubric criteria:
- **Root cause precision**: exact line/condition/state that triggers the bug, not symptoms
- **Evidence chain**: what observations (logs, stack traces, repro steps) lead to the conclusion
- **Reproduction conditions**: when does it happen — always, under load, race condition, specific input
- **Fix correctness**: does the proposed fix actually resolve the root cause without side effects
- **Regression prevention**: what test would catch this if it reappeared
- **Blast radius**: what else could break from the same underlying issue
- **Similar pattern detection**: are there other code paths with the same vulnerability`,

  data_analysis: `### Analysis Lens: Data Analysis
Focus on these dimensions when extracting rubric criteria:
- **Query correctness**: does the query actually answer the question asked, JOIN logic, GROUP BY semantics
- **Edge cases**: NULL handling, empty result sets, duplicates, division by zero, date boundaries
- **Performance**: index utilization, avoid full scans, appropriate use of CTEs vs subqueries
- **Data interpretation**: does the candidate correctly interpret what the results mean
- **Optimization awareness**: EXPLAIN plan thinking, materialized views, partitioning for large tables
- **Business context**: does the analysis connect technical results to business implications`,

  practical_coding: `### Analysis Lens: Practical Coding
Focus on these dimensions when extracting rubric criteria:
- **Correctness**: does the code produce correct output for all valid inputs
- **Algorithm choice**: is the approach appropriate for the problem constraints (time/space)
- **Edge cases**: empty input, single element, boundary values, integer overflow, unicode
- **Code quality**: naming, structure, readability — would you approve this in code review
- **Complexity analysis**: is the stated complexity actually correct and well-justified
- **Testing mindset**: does the candidate reason about what inputs would break their solution
- **Trade-offs**: if multiple approaches exist, does the candidate acknowledge alternatives`,
};

const DEFAULT_LENS = `### Analysis Lens: General
Analyze the problem for correctness, completeness, depth of reasoning, and practical applicability.`;

// ── System prompt builder ──────────────────────────────

function buildRubricSystemPrompt(category: string): string {
  const lens = CATEGORY_LENSES[category] ?? DEFAULT_LENS;

  return `You are an expert technical interview rubric designer with 10+ years of engineering and interviewing experience.

Your job: analyze the given problem and produce a precise, fair grading rubric.

## Rubric Structure

### mustCover (3–5 items)
These are the critical points that ANY competent answer MUST address.

Rules:
- Each item must be **specific and verifiable** from the problem content
  BAD:  "Security is important"
  GOOD: "User input 'q' is interpolated directly into the SQL string via template literal, creating a SQL injection vulnerability that allows arbitrary query manipulation."
- Derive items directly from the diff/code/scenario — no generic filler
- Order by severity: most critical issue first
- Each item must be independently evaluable (don't combine two issues into one)
- Write as factual statements about what the problem contains, not as instructions

### strongSignals (2–4 items)
These distinguish top-10% answers from merely adequate ones.

Rules:
- One level deeper than mustCover — shows genuine expertise
- Examples: specific exploit payloads, alternative architecture with trade-off analysis, downstream impact analysis, production war story parallels
- Should NOT overlap with mustCover — these are bonus depth indicators

### weakPatterns (2–3 items)
Common patterns seen in shallow or poor answers.

Rules:
- Observable behaviors, not just "didn't do X"
  BAD:  "Didn't mention security"
  GOOD: "Mentions SQL injection as a general concept without identifying the specific vulnerable code path in this diff"
- Include patterns like: surface-level observation without root cause, finding only one issue when multiple critical ones exist, copy-paste generic advice without connecting to the specific code

${lens}

## Critical Principles
- Multiple valid approaches exist. The rubric defines what MUST be covered, not the ONE correct answer.
- Base everything on the actual code/diff/scenario — never invent issues that aren't present.
- Write all rubric items in English.
- Each mustCover item should be a single, clear sentence.

## Output Format
Return strict JSON (no markdown, no comments):
{
  "mustCover": ["...", "..."],
  "strongSignals": ["...", "..."],
  "weakPatterns": ["...", "..."]
}`;
}

// ── User message builder ───────────────────────────────

function buildRubricUserMessage(input: RubricInput): string {
  const parts = [
    `## Problem Information`,
    `- Category: ${input.category}`,
    `- Type: ${input.type}`,
    `- Title: ${input.title}`,
    `- Prompt: ${input.prompt}`,
  ];

  if (input.language) {
    parts.push(`- Language: ${input.language}`);
  }

  if (input.diff) {
    parts.push(`\n## Code / Diff\n\`\`\`\n${input.diff}\n\`\`\``);
  }

  parts.push(`\nAnalyze this problem and generate the grading rubric.`);

  return parts.join("\n");
}

// ── Public API ─────────────────────────────────────────

export interface RubricInput {
  category: string;
  type: string;
  title: string;
  prompt: string;
  diff?: string;
  language?: string;
}

export interface Rubric {
  mustCover: string[];
  strongSignals: string[];
  weakPatterns: string[];
}

export async function generateRubric(input: RubricInput): Promise<Rubric> {
  const apiKey = process.env.OPENAI_API_KEY ?? "";
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.3, // Low temperature for consistent, precise rubrics
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: buildRubricSystemPrompt(input.category) },
        { role: "user", content: buildRubricUserMessage(input) },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`OpenAI API error ${res.status}:`, body);
    throw new Error(`OpenAI API error (status ${res.status})`);
  }

  const payload = (await res.json()) as {
    choices: { message: { content: string } }[];
  };

  const raw = JSON.parse(payload.choices[0]?.message?.content ?? "{}");

  // Validate structure
  const rubric: Rubric = {
    mustCover: validateStringArray(raw.mustCover, 1),
    strongSignals: validateStringArray(raw.strongSignals, 1),
    weakPatterns: validateStringArray(raw.weakPatterns, 1),
  };

  return rubric;
}

function validateStringArray(value: unknown, minLength: number): string[] {
  if (!Array.isArray(value)) {
    throw new Error("Rubric generation failed: invalid response structure");
  }
  const arr = value
    .map((v) => String(v ?? "").trim())
    .filter((s) => s.length > 0);
  if (arr.length < minLength) {
    throw new Error(`Rubric generation failed: expected at least ${minLength} items`);
  }
  return arr;
}

// Export prompt builders for testing
export { buildRubricSystemPrompt, buildRubricUserMessage };
