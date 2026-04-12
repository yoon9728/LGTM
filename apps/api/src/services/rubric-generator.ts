/**
 * AI-powered rubric generator.
 * Given a question's content (category, type, title, prompt, diff),
 * generates mustCover / strongSignals / weakPatterns automatically.
 */

// ── Category-specific analysis lenses ──────────────────

const CATEGORY_LENSES: Record<string, string> = {
  code_review: `### Analysis Lens: Code Review
Build criteria around these GRADUATED dimensions (fundamental → advanced):
1. FUNDAMENTAL: Does the candidate recognize the CLASS of security/correctness issue? (e.g., "identifies injection risk" — partial if vague, covered if specific)
2. FUNDAMENTAL: Does the candidate understand the REGRESSION — what was safe before and what broke? (e.g., "recognizes that parameterized queries were removed")
3. INTERMEDIATE: Can the candidate identify ALL vulnerable entry points, not just the most obvious one?
4. INTERMEDIATE: Does the candidate explain the IMPACT — what an attacker could actually do?
5. ADVANCED: Does the candidate notice secondary issues beyond the main vulnerability? (API contract changes, performance, missing validations)

IMPORTANT: If the same vulnerability type appears in multiple parameters, make it ONE criterion that tests whether the candidate finds all of them (partial = finds one, covered = finds all).`,

  system_design: `### Analysis Lens: System Design
Build criteria around these GRADUATED dimensions (fundamental → advanced):
1. FUNDAMENTAL: Does the candidate propose a reasonable high-level architecture with appropriate components? (partial = lists components, covered = explains why each component)
2. FUNDAMENTAL: Does the candidate address the data model and storage strategy?
3. INTERMEDIATE: Does the candidate design for the specific scale requirements stated in the problem (reads/sec, writes/sec, latency)?
4. INTERMEDIATE: Does the candidate discuss trade-offs between their choices and alternatives?
5. ADVANCED: Does the candidate address operational concerns (failure modes, monitoring, scaling strategy over time)?`,

  debugging: `### Analysis Lens: Debugging
Build criteria around these GRADUATED dimensions (fundamental → advanced):
1. FUNDAMENTAL: Does the candidate identify the correct root cause — which expression fails and why? (partial = right area, covered = exact expression)
2. FUNDAMENTAL: Does the candidate propose a fix that actually resolves the issue?
3. INTERMEDIATE: Does the candidate explain WHY the bug is intermittent / occurs under specific conditions?
4. INTERMEDIATE: Does the candidate consider the broader impact — other code paths with the same vulnerability?
5. ADVANCED: Does the candidate suggest regression prevention (tests, monitoring, architectural fixes)?

IMPORTANT: "What is the bug" and "where is the bug" are the SAME dimension — do not split them.`,

  data_analysis: `### Analysis Lens: Data Analysis
Build criteria around these GRADUATED dimensions (fundamental → advanced):
1. FUNDAMENTAL: Does the query use the correct tables and joins to answer the question? (partial = right tables, covered = correct join logic)
2. FUNDAMENTAL: Does the query produce the requested output columns with correct aggregation?
3. INTERMEDIATE: Does the query handle data filtering correctly (status filters, date ranges, exclusions)?
4. INTERMEDIATE: Does the candidate explain their approach clearly and correctly?
5. ADVANCED: Does the candidate discuss optimization (indexes, query plan, materialization)?

IMPORTANT for data_analysis:
- Criterion 5 (optimization) should give "covered" for discussing indexes and query plans. Do NOT require materialized views or exotic optimization for "covered" — those are strongSignals.
- A comprehensive answer covering criteria 1-5 with depth should be able to score 85+. Do not design rubrics where even a perfect answer can only reach ~75.`,

  practical_coding: `### Analysis Lens: Practical Coding
Build criteria around these GRADUATED dimensions (fundamental → advanced):
1. FUNDAMENTAL: Does the code correctly implement the core operations described in the problem? (partial = code runs and handles the basic case even with bugs, covered = all core operations work correctly)
2. FUNDAMENTAL: Does the candidate explain their approach and demonstrate understanding of what the problem requires? (partial = describes the general idea, covered = explains why this approach works)
3. INTERMEDIATE: Does the implementation handle edge cases (empty input, capacity limits, duplicate keys, boundary conditions)?
4. INTERMEDIATE: Is the complexity analysis correct and does the implementation meet the stated time complexity requirement? (partial = mentions complexity, covered = correct analysis with justification)
5. ADVANCED: Does the candidate discuss design choices, trade-offs, or why they rejected alternative approaches?

IMPORTANT for practical_coding:
- A correct implementation that is O(n) instead of O(1) should still earn "covered" on criterion 1 (correctness) and "partial" on criterion 4 (complexity). Do NOT penalize correctness for suboptimal complexity.
- Multiple valid implementations exist. Frame criteria as behavioral requirements (e.g., "handles eviction correctly") not specific implementations (e.g., "uses doubly linked list").
- Criterion 2 is about EXPLANATION quality, not code quality. A working solution with a brief explanation = partial. A working solution with clear reasoning = covered.`,
};

const DEFAULT_LENS = `### Analysis Lens: General
Analyze the problem for correctness, completeness, depth of reasoning, and practical applicability.`;

// ── System prompt builder ──────────────────────────────

function buildRubricSystemPrompt(category: string): string {
  const lens = CATEGORY_LENSES[category] ?? DEFAULT_LENS;

  return `You are an expert technical interview rubric designer with 10+ years of engineering and interviewing experience.

Your job: analyze the given problem and produce a precise, fair grading rubric that accurately differentiates beginner through expert-level answers.

## Rubric Structure

### mustCover (EXACTLY 5 items — no fewer, no more)
These criteria evaluate the candidate's understanding at different depth levels.

**CRITICAL: Write criteria as graduated understanding checks, NOT as "find specific detail X" checks.**

Each criterion MUST be achievable at TWO levels:
- **"partial"** = The candidate shows AWARENESS of this topic area (mentions the category, general direction, or related concept). A vague, one-sentence mention is enough for partial.
- **"covered"** = The candidate demonstrates SPECIFIC understanding (names exact locations, mechanisms, or provides detailed explanation).

**The partial threshold must be LOW.** A candidate who writes "there's a security issue with user input" should get partial on a SQL injection criterion. A candidate who writes "the queries are slow" should get partial on a performance criterion.

BAD criterion (too specific, binary pass/fail):
  "The raw q parameter is interpolated into the SQL ILIKE clause via template literal"
  → Either you mention "q" and "ILIKE" or you don't. No room for partial credit.

GOOD criterion (graduated, tests understanding):
  "Identifies SQL injection caused by string interpolation of unsanitized user input into the query, and can point to the specific vulnerable parameters"
  → Partial: "there's a SQL injection risk" or "string interpolation in SQL is dangerous" (correct category, vague on details)
  → Covered: "the q parameter in the ILIKE and limit in the LIMIT clause are both interpolated" (specific)

MORE GOOD EXAMPLES:
  "Recognizes that the original code had safety mechanisms (e.g., parameterized queries) that were removed in this change"
  → Partial: "should use prepared statements" (knows the fix direction)
  → Covered: "the original used $1/$2 parameterized queries which were safe; this change removes that protection" (specific regression)

  "Proposes an appropriate data structure or algorithm that achieves the required time complexity"
  → Partial: "need a way to track order and do fast lookups" (understands the requirements)
  → Covered: "hash map + doubly linked list gives O(1) for both operations" (specific solution)

**Difficulty distribution (MANDATORY):**
1. Item 1-2: FUNDAMENTAL — these must be VERY easy to get "partial" on. A single sentence mentioning the right problem area = partial. Example: "there's a security issue" should earn partial on a security criterion. A junior/mid developer who understands what category of problem this is should get partial. Specificity earns "covered".
2. Item 3-4: INTERMEDIATE — require more specific analysis. Test whether the candidate identifies specific details, root causes, or important secondary issues. Even here, a vague mention of the right topic = partial.
3. Item 5: ADVANCED — requires expert-level insight. Test whether the candidate sees non-obvious implications, edge cases, or systemic concerns. Only strong answers get partial here.

**Other rules:**
- Derive items directly from the diff/code/scenario — no generic filler
- Each item must be independently evaluable (one concept per item)
- **NO OVERLAP**: Each criterion must test a DISTINCT dimension. If two criteria would always be covered/missed together, merge them.

### strongSignals (2–4 items)
These distinguish top-10% answers. One level deeper than mustCover.
- Specific exploit payloads / attack scenarios
- Alternative approaches with trade-off analysis
- Downstream impact analysis
- Production-readiness considerations
- Should NOT overlap with mustCover

### weakPatterns (2–3 items)
Observable behaviors in shallow answers.
- Must be concrete behaviors, not just "didn't do X"
  GOOD: "Mentions the problem category in general terms without connecting it to the specific code shown"
- Examples: surface-level observation without root cause, generic textbook advice, finding only the most obvious issue

${lens}

## Critical Principles
- Multiple valid approaches exist. The rubric defines what MUST be covered, not the ONE correct answer.
- Base everything on the actual code/diff/scenario — never invent issues that aren't present.
- Write all rubric items in English.
- Test UNDERSTANDING and REASONING, not keyword matching.

## Output Format
Return strict JSON (no markdown, no comments):
{
  "mustCover": ["...", "...", "...", "...", "..."],
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
  const model = process.env.OPENAI_MODEL ?? "gpt-5.4-mini";

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
      temperature: 0.2, // Low temperature for consistent, precise rubrics
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
