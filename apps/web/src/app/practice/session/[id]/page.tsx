"use client";

import { useState, useCallback, useEffect, use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Stepper } from "@/components/stepper";
import { DiffViewer } from "@/components/diff-viewer";
import { EvaluationResult } from "@/components/evaluation-result";
import { BlockEditor, type Block } from "@/components/block-editor";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserButton } from "@/components/user-button";
import { useSession } from "@/lib/auth-client";
import { api } from "@/lib/api";
import type { Session, Evaluation } from "@/lib/api";
import { GUEST_LIMIT, GUEST_STORAGE_KEY } from "@/lib/guest";
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  Loader2Icon,
  ShuffleIcon,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  code_review: "Code Review",
  system_design: "System Design",
  debugging: "Debugging",
  data_analysis: "Data Analysis",
  practical_coding: "Practical Coding",
};

type Step = "loading" | "diff" | "analysis" | "result";

export default function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: authSession } = useSession();
  const isAuthenticated = !!authSession?.user;

  const [step, setStep] = useState<Step>("loading");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // Language selection for practical_coding (user picks before answering)
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  // Code Review fields
  const [summary, setSummary] = useState("");
  const [findings, setFindings] = useState("");
  // System Design fields
  const [overview, setOverview] = useState("");
  const [components, setComponents] = useState("");
  const [tradeoffs, setTradeoffs] = useState("");
  const [scalingStrategy, setScalingStrategy] = useState("");
  // Debugging fields
  const [rootCause, setRootCause] = useState("");
  const [evidence, setEvidence] = useState("");
  // Data Analysis fields
  const [explanation, setExplanation] = useState("");
  const [optimization, setOptimization] = useState("");
  // Practical Coding fields (block editor)
  const [codeBlocks, setCodeBlocks] = useState<Block[]>(() => [
    { id: crypto.randomUUID(), type: "code", language: "javascript", content: "" },
  ]);
  const [approach, setApproach] = useState("");
  const [complexity, setComplexity] = useState("");
  // Data Analysis blocks
  const [queryBlocks, setQueryBlocks] = useState<Block[]>(() => [
    { id: crypto.randomUUID(), type: "code", language: "sql", content: "" },
  ]);
  // Debugging fix blocks
  const [fixBlocks, setFixBlocks] = useState<Block[]>(() => [
    { id: crypto.randomUUID(), type: "code", language: "javascript", content: "" },
  ]);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);

  const [guestCompletions, setGuestCompletions] = useState(0);

  const rightPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(GUEST_STORAGE_KEY);
    if (stored) setGuestCompletions(parseInt(stored) || 0);
  }, []);

  // Load session
  useEffect(() => {
    api.getSession(id).then(async (res) => {
      setSession(res.session);
      const lang = res.session.language ?? res.session.question.language ?? null;
      setSelectedLanguage(lang);
      const cat = res.session.question.category;
      if (cat === "practical_coding") {
        const template = lang ? (res.session.question.templates?.[lang] ?? "") : "";
        setCodeBlocks([{ id: crypto.randomUUID(), type: "code", language: lang ?? "javascript", content: template }]);
      } else if (cat === "data_analysis") {
        setQueryBlocks([{ id: crypto.randomUUID(), type: "code", language: "sql", content: "" }]);
      } else if (cat === "debugging") {
        setFixBlocks([{ id: crypto.randomUUID(), type: "code", language: lang ?? "javascript", content: "" }]);
      }

      // If session already answered, jump to result
      if (res.session.status === "answer_submitted") {
        try {
          const retry = await api.retryEvaluation(res.session.id);
          setEvaluation(retry.evaluation);
          setStep("result");
        } catch {
          setStep("diff"); // fallback: show problem
        }
      } else {
        setStep("diff");
      }
    }).catch(() => {
      setError("Session not found");
      setStep("diff");
    });
  }, [id]);

  // Scroll right panel into view when entering analysis
  useEffect(() => {
    if (step === "analysis" && rightPanelRef.current) {
      // Small delay to let the layout transition start
      setTimeout(() => {
        rightPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    }
  }, [step]);

  /** Serialize blocks into a readable string with language-tagged code fences */
  const serializeBlocks = useCallback((blocks: Block[]): string => {
    return blocks
      .map((b) => {
        if (b.type === "code" && b.content.trim()) {
          return `\`\`\`${b.language ?? ""}\n${b.content}\n\`\`\``;
        }
        return b.content;
      })
      .filter((s) => s.trim())
      .join("\n\n");
  }, []);

  const buildAnswerPayload = useCallback(() => {
    if (!session?.question) return null;
    const cat = session.question.category;
    const base = {
      sessionId: session.id,
      questionId: session.question.id,
      category: cat,
    };
    switch (cat) {
      case "system_design":
        return { ...base, overview, components, tradeoffs, scalingStrategy };
      case "debugging":
        return {
          ...base,
          rootCause,
          evidence,
          proposedFix: serializeBlocks(fixBlocks),
          blocks: fixBlocks.map(({ type, language, content }) => ({ type, language, content })),
        };
      case "data_analysis":
        return {
          ...base,
          query: serializeBlocks(queryBlocks),
          explanation,
          optimization,
          blocks: queryBlocks.map(({ type, language, content }) => ({ type, language, content })),
        };
      case "practical_coding":
        return {
          ...base,
          code: serializeBlocks(codeBlocks),
          approach,
          complexity,
          blocks: codeBlocks.map(({ type, language, content }) => ({ type, language, content })),
        };
      default: // code_review
        return {
          ...base,
          diff: session.question.diff,
          summary,
          findings: findings.split("\n").map((l) => l.replace(/^\d+\.\s*/, "").trim()).filter(Boolean),
        };
    }
  }, [session, summary, findings, overview, components, tradeoffs, scalingStrategy, rootCause, evidence, fixBlocks, queryBlocks, explanation, optimization, codeBlocks, approach, complexity, serializeBlocks]);

  const hasBlockContent = useCallback((blocks: Block[]) => {
    return blocks.some((b) => b.content.trim().length > 0);
  }, []);

  const isFormValid = useCallback(() => {
    if (!session?.question) return false;
    switch (session.question.category) {
      case "system_design": return !!(overview.trim() || components.trim());
      case "debugging": return !!rootCause.trim();
      case "data_analysis": return !!(hasBlockContent(queryBlocks) || explanation.trim());
      case "practical_coding": return hasBlockContent(codeBlocks);
      default: return !!summary.trim();
    }
  }, [session, summary, overview, components, rootCause, queryBlocks, explanation, codeBlocks, hasBlockContent]);

  const submitAnswer = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!isFormValid()) return;
      const payload = buildAnswerPayload();
      if (!payload) return;
      setLoading(true);
      setError(null);
      try {
        const res = await api.submitAnswer(payload);
        setEvaluation(res.evaluation);
        setStep("result");

        if (!isAuthenticated) {
          const newCount = guestCompletions + 1;
          setGuestCompletions(newCount);
          localStorage.setItem(GUEST_STORAGE_KEY, String(newCount));
          setShowSignupPrompt(true);
        }
      } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 409 && session) {
          // Answer already exists — fetch the existing evaluation
          try {
            const retry = await api.retryEvaluation(session.id);
            setEvaluation(retry.evaluation);
            setStep("result");
          } catch {
            setError("Answer already submitted for this session.");
          }
        } else {
          if (process.env.NODE_ENV === "development") console.error("Submit answer failed:", err);
          setError("Failed to submit answer. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [buildAnswerPayload, isFormValid, isAuthenticated, guestCompletions, session]
  );

  const startNewRandom = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const { session: newSession } = await api.createSession({
        category: session.question.category,
        type: session.question.type,
        language: session.language ?? undefined,
      });
      router.push(`/practice/session/${newSession.id}`);
    } catch {
      setLoading(false);
    }
  }, [session, router]);

  const category = session?.question.category ?? "code_review";
  /** User-chosen language (session level) > question-level language */
  const sessionLanguage = selectedLanguage ?? session?.language ?? session?.question.language ?? null;
  const backUrl = session ? `/practice/${category}/${session.question.type}` : "/practice";
  const categoryLabel = CATEGORY_LABELS[category] ?? "Practice";
  const guestLimitReached = !isAuthenticated && guestCompletions >= GUEST_LIMIT;

  const stepNumber = step === "diff" ? 1 : step === "analysis" ? 2 : step === "result" ? 3 : 0;

  const isSplit = step === "analysis" || step === "result";

  if (step === "loading") {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleStartAnalysis = async () => {
    // Persist language choice to session for practical_coding
    if (category === "practical_coding" && selectedLanguage && session) {
      try {
        await api.updateSession(session.id, { language: selectedLanguage });
        setSession({ ...session, language: selectedLanguage });
      } catch {
        // Non-blocking — evaluation will still use selectedLanguage from blocks
      }
    }
    setStep("analysis");
  };

  // -- Shared sub-components --

  const problemPanel = (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
            01 · {categoryLabel}
          </p>
          <span className="text-[10px] font-mono tracking-wide border border-border rounded px-1.5 py-0.5 text-muted-foreground">
            {session?.question.type.replace(/_/g, " ").toUpperCase()}
          </span>
          {sessionLanguage && (
            <span className="text-[10px] font-mono tracking-wide border border-border rounded px-1.5 py-0.5 text-muted-foreground">
              {sessionLanguage === "c_cpp" ? "C/C++" : sessionLanguage.toUpperCase()}
            </span>
          )}
        </div>
        <h2 className="text-xl font-semibold tracking-tight">{session?.question.title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{session?.question.prompt}</p>
      </div>
      {category !== "practical_coding" && (
        <DiffViewer diff={session?.question.diff ?? ""} />
      )}
      {step === "diff" && (
        <div className="pt-2 space-y-4">
          {/* Language picker for practical_coding */}
          {category === "practical_coding" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Choose your language
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: "python", label: "Python" },
                  { id: "java", label: "Java" },
                  { id: "javascript", label: "JavaScript" },
                  { id: "typescript", label: "TypeScript" },
                  { id: "csharp", label: "C#" },
                  { id: "c_cpp", label: "C/C++" },
                  { id: "rust", label: "Rust" },
                  { id: "go", label: "Go" },
                  { id: "kotlin", label: "Kotlin" },
                ].map((lang) => (
                  <Button
                    type="button"
                    key={lang.id}
                    variant={selectedLanguage === lang.id ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      setSelectedLanguage(lang.id);
                      const template = session?.question.templates?.[lang.id] ?? "";
                      setCodeBlocks([{ id: crypto.randomUUID(), type: "code", language: lang.id, content: template }]);
                    }}
                  >
                    {lang.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <Button type="button" onClick={handleStartAnalysis} disabled={category === "practical_coding" && !selectedLanguage}>
            {category === "code_review" && "I've read the code — write my review"}
            {category === "system_design" && "I've read the requirements — write my design"}
            {category === "debugging" && "I've read the code — diagnose the bug"}
            {category === "data_analysis" && "I've read the problem — write my solution"}
            {category === "practical_coding" && "I've read the problem — write my code"}
            {!["code_review", "system_design", "debugging", "data_analysis", "practical_coding"].includes(category) && "I've read the code — write my analysis"}
            <ArrowRightIcon className="size-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );

  const analysisPanel = session && (
    <div className="space-y-4" ref={rightPanelRef}>
      <div className="space-y-1">
        <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
          02 · Your {category === "code_review" ? "Analysis" : category === "system_design" ? "Design" : category === "debugging" ? "Diagnosis" : category === "data_analysis" ? "Solution" : "Implementation"}
        </p>
        <p className="text-sm text-muted-foreground">
          {category === "code_review" && "Write precisely. Vague answers score poorly."}
          {category === "system_design" && "Describe your architecture clearly. Justify your design choices."}
          {category === "debugging" && "Identify the root cause with evidence. Propose a concrete fix."}
          {category === "data_analysis" && "Write your query and explain your reasoning."}
          {category === "practical_coding" && "Write clean, working code. Explain your approach."}
        </p>
      </div>
      <form onSubmit={submitAnswer} className="space-y-4">

        {/* Code Review Form */}
        {(category === "code_review" || !["system_design", "debugging", "data_analysis", "practical_coding"].includes(category)) && (
          <>
            <div className="space-y-2">
              <label htmlFor="summary" className="text-sm font-medium text-foreground">
                Summary <span className="text-muted-foreground font-normal">— the single most important issue</span>
              </label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="The biggest problem in this code is..."
                rows={3}
                disabled={step === "result"}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="findings" className="text-sm font-medium text-foreground">
                Findings <span className="text-muted-foreground font-normal">— what you found and why it matters</span>
              </label>
              <Textarea
                id="findings"
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                placeholder={"1. Security: SQL injection in line 12...\n2. Performance: N+1 query in the loop...\n3. Error handling: unhandled promise rejection..."}
                rows={8}
                disabled={step === "result"}
              />
            </div>
          </>
        )}

        {/* System Design Form */}
        {category === "system_design" && (
          <>
            <div className="space-y-2">
              <label htmlFor="overview" className="text-sm font-medium text-foreground">
                Architecture Overview <span className="text-muted-foreground font-normal">— high-level system description</span>
              </label>
              <Textarea
                id="overview"
                value={overview}
                onChange={(e) => setOverview(e.target.value)}
                placeholder="The system uses a microservices architecture with..."
                rows={4}
                disabled={step === "result"}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="components" className="text-sm font-medium text-foreground">
                Key Components <span className="text-muted-foreground font-normal">— what are the main pieces and how they interact</span>
              </label>
              <Textarea
                id="components"
                value={components}
                onChange={(e) => setComponents(e.target.value)}
                placeholder={"1. API Gateway — routes requests, handles auth\n2. Message Queue — async processing\n3. Cache Layer — Redis for hot data..."}
                rows={6}
                disabled={step === "result"}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="tradeoffs" className="text-sm font-medium text-foreground">
                Tradeoffs <span className="text-muted-foreground font-normal">— what you chose and what you gave up</span>
              </label>
              <Textarea
                id="tradeoffs"
                value={tradeoffs}
                onChange={(e) => setTradeoffs(e.target.value)}
                placeholder="Chose eventual consistency over strong consistency because..."
                rows={4}
                disabled={step === "result"}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="scaling" className="text-sm font-medium text-foreground">
                Scaling Strategy <span className="text-muted-foreground font-normal">— how to handle growth</span>
              </label>
              <Textarea
                id="scaling"
                value={scalingStrategy}
                onChange={(e) => setScalingStrategy(e.target.value)}
                placeholder="Horizontal scaling via sharding by user_id. Read replicas for..."
                rows={4}
                disabled={step === "result"}
              />
            </div>
          </>
        )}

        {/* Debugging Form */}
        {category === "debugging" && (
          <>
            <div className="space-y-2">
              <label htmlFor="rootCause" className="text-sm font-medium text-foreground">
                Root Cause <span className="text-muted-foreground font-normal">— what exactly is causing the bug</span>
              </label>
              <Textarea
                id="rootCause"
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="The bug is caused by a race condition between..."
                rows={4}
                disabled={step === "result"}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="evidence" className="text-sm font-medium text-foreground">
                Evidence & Reasoning <span className="text-muted-foreground font-normal">— how you identified this</span>
              </label>
              <Textarea
                id="evidence"
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder={"Line 42: the mutex is acquired after the check, creating a TOCTOU window...\nThe stack trace shows the thread interleaving at..."}
                rows={6}
                disabled={step === "result"}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Proposed Fix <span className="text-muted-foreground font-normal">— concrete steps to resolve it</span>
              </label>
              {step === "result" ? (
                <div className="rounded-lg border border-input bg-muted/50 px-4 py-3 text-sm font-mono whitespace-pre-wrap">
                  {serializeBlocks(fixBlocks)}
                </div>
              ) : (
                <BlockEditor
                  blocks={fixBlocks}
                  onChange={setFixBlocks}
                  defaultLanguage={sessionLanguage ?? "javascript"}
                />
              )}
            </div>
          </>
        )}

        {/* Data Analysis Form */}
        {category === "data_analysis" && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Query / Solution <span className="text-muted-foreground font-normal">— your SQL, script, or analysis</span>
              </label>
              {step === "result" ? (
                <div className="rounded-lg border border-input bg-muted/50 px-4 py-3 text-sm font-mono whitespace-pre-wrap">
                  {serializeBlocks(queryBlocks)}
                </div>
              ) : (
                <BlockEditor
                  blocks={queryBlocks}
                  onChange={setQueryBlocks}
                  defaultLanguage="sql"
                />
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="explanation" className="text-sm font-medium text-foreground">
                Explanation <span className="text-muted-foreground font-normal">— walk through your approach</span>
              </label>
              <Textarea
                id="explanation"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="I used a LEFT JOIN to include users with no orders. The HAVING clause filters..."
                rows={4}
                disabled={step === "result"}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="optimization" className="text-sm font-medium text-foreground">
                Optimization <span className="text-muted-foreground font-normal">— performance considerations</span>
              </label>
              <Textarea
                id="optimization"
                value={optimization}
                onChange={(e) => setOptimization(e.target.value)}
                placeholder="Add index on orders(user_id, created_at). For large datasets, consider..."
                rows={3}
                disabled={step === "result"}
              />
            </div>
          </>
        )}

        {/* Practical Coding Form */}
        {category === "practical_coding" && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Code {sessionLanguage && (
                  <span className="text-[10px] font-mono tracking-wide border border-border rounded px-1.5 py-0.5 text-muted-foreground ml-1.5">
                    {sessionLanguage === "c_cpp" ? "C/C++" : sessionLanguage.toUpperCase()}
                  </span>
                )}
              </label>
              {step === "result" ? (
                <div className="rounded-lg border border-input bg-muted/50 px-4 py-3 text-sm font-mono whitespace-pre-wrap">
                  {serializeBlocks(codeBlocks)}
                </div>
              ) : (
                <BlockEditor
                  blocks={codeBlocks}
                  onChange={setCodeBlocks}
                  defaultLanguage={sessionLanguage ?? "javascript"}
                  templates={session?.question.templates}
                />
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="approach" className="text-sm font-medium text-foreground">
                Approach <span className="text-muted-foreground font-normal">— explain your strategy</span>
              </label>
              <Textarea
                id="approach"
                value={approach}
                onChange={(e) => setApproach(e.target.value)}
                placeholder="Used a hash map for O(1) lookups to avoid the brute-force O(n²) approach..."
                rows={3}
                disabled={step === "result"}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="complexity" className="text-sm font-medium text-foreground">
                Complexity Analysis <span className="text-muted-foreground font-normal">— time and space</span>
              </label>
              <Textarea
                id="complexity"
                value={complexity}
                onChange={(e) => setComplexity(e.target.value)}
                placeholder="Time: O(n) — single pass through the array. Space: O(n) — hash map stores up to n entries."
                rows={2}
                disabled={step === "result"}
              />
            </div>
          </>
        )}

        {step === "analysis" && (
          <Button type="submit" disabled={loading || !isFormValid()}>
            {loading ? <Loader2Icon className="size-4 animate-spin" /> : "Submit answer"}
          </Button>
        )}
      </form>
    </div>
  );

  const resultPanel = step === "result" && evaluation && (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
          03 · Evaluation
        </p>
        <p className="text-sm text-muted-foreground">AI-graded against expert criteria.</p>
      </div>
      <EvaluationResult evaluation={evaluation} />

      {/* Signup prompt for guests */}
      {showSignupPrompt && !isAuthenticated && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 space-y-3">
          <h3 className="text-base font-semibold">
            {guestCompletions >= GUEST_LIMIT
              ? "You've used all free sessions!"
              : `Nice work! ${GUEST_LIMIT - guestCompletions} free sessions remaining.`}
          </h3>
          <p className="text-sm text-muted-foreground">
            Create a free account to unlock all questions, track your scores, and review your history.
          </p>
          <div className="flex gap-3 pt-1">
            <Link href="/sign-up">
              <Button size="sm">
                Create free account <ArrowRightIcon className="size-3.5 ml-1.5" />
              </Button>
            </Link>
            {guestCompletions < GUEST_LIMIT && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setShowSignupPrompt(false)}>
                Maybe later
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="pt-4 flex gap-3">
        {guestLimitReached ? (
          <Link href="/sign-up">
            <Button>
              Create account to continue <ArrowRightIcon className="size-3.5 ml-1.5" />
            </Button>
          </Link>
        ) : (
          <>
            <Link href={backUrl}>
              <Button variant="outline">Back to questions</Button>
            </Link>
            <Button type="button" variant="outline" onClick={startNewRandom} disabled={loading}>
              {loading ? <Loader2Icon className="size-4 animate-spin" /> : (
                <>
                  <ShuffleIcon className="size-3.5 mr-1.5" />
                  Next random
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-dvh flex flex-col transition-all duration-500 ease-out ${
        isSplit ? "max-w-[100vw]" : "max-w-4xl mx-auto"
      }`}
      style={isSplit ? undefined : { width: "100%" }}
    >
      {/* Header */}
      <header className={`flex items-center justify-between py-6 border-b border-border mb-6 ${isSplit ? "px-8" : "px-6"}`}>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs font-bold tracking-[0.16em] uppercase hover:text-primary transition-colors">
            LGTM
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <Link href="/practice" className="text-xs text-muted-foreground tracking-wide hover:text-foreground transition-colors">
            Practice
          </Link>
          {session && (
            <>
              <Separator orientation="vertical" className="h-4" />
              <Link href={`/practice/${category}`} className="text-xs text-muted-foreground tracking-wide hover:text-foreground transition-colors">
                {categoryLabel}
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton />
        </div>
      </header>

      <div className={`${isSplit ? "px-8" : "px-6"}`}>
        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {session && (
          <section className="space-y-6">
            {/* Back + Stepper */}
            <div className="flex items-center gap-3">
              <Link
                href={backUrl}
                className="size-8 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors"
              >
                <ArrowLeftIcon className="size-3.5" />
              </Link>
              <span className="text-xs text-muted-foreground">Back to questions</span>
            </div>

            <Stepper current={stepNumber} />

            {/* Layout: single column (diff) or split (analysis/result) */}
            {!isSplit ? (
              /* -- Single column: reading the problem -- */
              <div className="pb-24">
                {problemPanel}
              </div>
            ) : (
              /* -- Split layout: problem left, answer right -- */
              <div className="flex gap-6 pb-24 animate-fade-in-up" style={{ animationDuration: "0.5s" }}>
                {/* Left: Problem (sticky, scrollable) */}
                <div className="w-1/2 shrink-0">
                  <div className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto pr-4 space-y-4 scrollbar-thin">
                    {problemPanel}
                  </div>
                </div>

                {/* Vertical divider */}
                <div className="w-px bg-border shrink-0" />

                {/* Right: Answer + Result */}
                <div className="w-1/2 min-w-0 space-y-10">
                  {analysisPanel}
                  {resultPanel}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
