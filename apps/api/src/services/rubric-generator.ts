/**
 * AI-powered rubric generator.
 * Given a question's content (category, type, title, prompt, diff),
 * generates mustCover / strongSignals / weakPatterns automatically.
 */

// ── Category-specific analysis lenses ──────────────────

const CATEGORY_LENSES: Record<string, string> = {
  code_review: `### Analysis Lens: Code Review
Build criteria around these GRADUATED dimensions (fundamental → advanced):
1. FUNDAMENTAL: Does the candidate recognize the CLASS of security/correctness issue? (e.g., "identifies injection risk" — partial if vague, covered if specific with mechanism explanation)
2. FUNDAMENTAL: Does the candidate understand the REGRESSION — what was safe before and what broke? (e.g., "recognizes that parameterized queries were removed")
3. INTERMEDIATE: Can the candidate identify ALL vulnerable entry points, not just the most obvious one? (partial = finds the main one, covered = finds additional ones)
4. INTERMEDIATE: Does the candidate explain the IMPACT — what an attacker could actually do, with specific scenarios?
5. ADVANCED: Does the candidate provide COMPREHENSIVE secondary analysis beyond the main vulnerability? (API contract changes, performance, missing validations, architectural implications — covered requires addressing 2+ secondary concerns with specific detail)

IMPORTANT: If the same vulnerability type appears in multiple parameters, make it ONE criterion that tests whether the candidate finds all of them (partial = finds one, covered = finds all).
IMPORTANT: Merely IDENTIFYING an issue is "partial". "Covered" requires EXPLAINING the mechanism or demonstrating deep understanding. A one-line correct finding = partial, not covered.`,

  system_design: `### Analysis Lens: System Design
Build criteria around these GRADUATED dimensions (fundamental → advanced):
1. FUNDAMENTAL: Does the candidate propose a reasonable high-level architecture with appropriate components? (partial = names 3+ relevant infrastructure components in any form, covered = explains how components connect and data flows between them)
2. FUNDAMENTAL: Does the candidate show awareness of the access pattern and choose storage/messaging accordingly? (partial = mentions ANY database, cache, or queue by name or concept, covered = explains WHY they chose that storage type for this workload)
3. INTERMEDIATE: Does the candidate design for the specific scale requirements stated in the problem? (partial = acknowledges scale with any concrete number, covered = calculates capacity or sizes components)
4. INTERMEDIATE: Does the candidate discuss trade-offs between their choices and alternatives? (partial = mentions one tradeoff, covered = compares alternatives with reasoning)
5. ADVANCED: Does the candidate provide a comprehensive operational plan? (covered requires EXPLICIT discussion of failure modes AND scaling phases or monitoring — not just mentioning "monitoring")

IMPORTANT for system_design:
- A 40pt-level answer that describes an event-driven or request-based architecture with named components (queue, cache, DB, workers) MUST get at least partial on criteria 1 AND 2. It should also get partial on criteria 3-4 if it mentions any scaling or tradeoff concept.
- criterion 1 partial threshold is VERY LOW: naming 3+ relevant infrastructure components = partial. Describing an architecture flow (e.g., "API → queue → workers → DB") = covered.
- criterion 2 partial threshold is VERY LOW: mentioning ANY storage technology or pattern = partial.
- Do NOT make fundamental criteria about specific technologies. "Uses a message queue for async processing" is covered whether they say Kafka, RabbitMQ, SQS, or just "message queue".`,

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
2. FUNDAMENTAL: Does the candidate WRITE a clear explanation of their approach? (partial = 1-2 sentences describing the general idea, covered = multi-sentence explanation of HOW and WHY the approach works. NOTE: "covered" requires WRITTEN text — correct code alone does NOT satisfy this criterion)
3. INTERMEDIATE: Does the implementation handle edge cases (empty input, capacity limits, duplicate keys, boundary conditions)?
4. INTERMEDIATE: Is the complexity analysis correct and does the implementation meet the stated time complexity requirement? (partial = mentions complexity, covered = correct Big-O with justification for WHY it achieves that complexity)
5. ADVANCED: Does the candidate EXPLICITLY compare alternative approaches and explain why they chose this one? (partial = briefly mentions one alternative exists, covered = names 2+ alternatives, explains their trade-offs, and justifies why the chosen approach is better. A correct implementation with no written comparison = "missing" on this criterion)

IMPORTANT for practical_coding:
- A correct implementation that is O(n) instead of O(1) should still earn "covered" on criterion 1 (correctness) and "partial" on criterion 4 (complexity). Do NOT penalize correctness for suboptimal complexity.
- Multiple valid implementations exist. Frame criteria as behavioral requirements (e.g., "handles eviction correctly") not specific implementations (e.g., "uses doubly linked list").
- Criterion 2 is about WRITTEN EXPLANATION quality, not code quality. A working solution with a one-line approach description like "Hash map + linked list" = partial (too brief). A working solution with a paragraph explaining the design = covered.
- Criterion 5 (design choices/trade-offs) is what separates Strong from Expert. "covered" REQUIRES explicit text comparing alternatives. Perfect code with a one-line approach description should get at most 4/5 covered (criteria 1,3,4 + partial on 2), placing it in the Strong range (68-85).
- strongSignals should require deep analysis: performance implications, memory optimization, why rejected approaches fail, handling of constraint boundaries. A correct-but-unexplained implementation should NOT trigger strongSignals.`,
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
3. Item 5: ADVANCED — requires expert-level insight. This item MUST test something that ONLY appears in truly exceptional answers: deep trade-off analysis, non-obvious implications, systemic concerns, or explicit comparison of alternatives with reasoning. A correct-but-brief answer should NOT satisfy this criterion. "Covered" on item 5 requires EXPLICIT WRITTEN ANALYSIS, not just correct behavior demonstrated through code.

**Technology-agnostic fundamentals:**
Items 1-2 must test ARCHITECTURAL CONCEPTS or problem understanding, not specific technologies. "Proposes a caching layer for read-heavy access" is good; "Uses Redis for caching" is bad for a fundamental criterion. Any reasonable technology choice that fulfills the concept should earn "covered".

**Other rules:**
- Derive items directly from the diff/code/scenario — no generic filler
- Each item must be independently evaluable (one concept per item)
- **NO OVERLAP**: Each criterion must test a DISTINCT dimension. If two criteria would always be covered/missed together, merge them.
- Each criterion must be satisfiable by MULTIPLE valid approaches. If only one specific answer satisfies it, the criterion is too narrow.

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
