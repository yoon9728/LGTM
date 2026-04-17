"use client";

import { useState, useCallback, useEffect, use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
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
import { LoadingSpinner } from "@/components/loading-spinner";
import { MobileNav } from "@/components/mobile-nav";
import {
  ArrowRightIcon,
  ArrowLeftIcon,
  Loader2Icon,
  ShuffleIcon,
  ClockIcon,
} from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  code_review: "Code Review",
  system_design: "System Design",
  debugging: "Debugging",
  data_analysis: "Data Analysis",
  practical_coding: "Practical Coding",
  cfa: "CFA (Canadian)",
};

const CATEGORY_COLORS: Record<string, string> = {
  code_review: "text-blue-500",
  system_design: "text-violet-500",
  debugging: "text-amber-500",
  data_analysis: "text-emerald-500",
  practical_coding: "text-rose-500",
  cfa: "text-cyan-500",
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
  // CFA fields
  const [analysis, setAnalysis] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [reasoning, setReasoning] = useState("");
  // MCQ (CFA multiple-choice)
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
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

  // Session timer
  const [elapsed, setElapsed] = useState(0);

  const rightPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(GUEST_STORAGE_KEY);
    if (stored) setGuestCompletions(parseInt(stored) || 0);
  }, []);

  // Timer runs only during answer writing
  useEffect(() => {
    if (step === "analysis") {
      const id = setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => clearInterval(id);
    }
  }, [step]);

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
    if (session.question.format === "mcq") {
      return { ...base, selectedAnswer };
    }
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
      case "cfa":
        return { ...base, analysis, recommendation, reasoning };
      default: // code_review
        return {
          ...base,
          diff: session.question.diff,
          summary,
          findings: findings.split("\n").map((l) => l.replace(/^\d+\.\s*/, "").trim()).filter(Boolean),
        };
    }
  }, [session, summary, findings, overview, components, tradeoffs, scalingStrategy, rootCause, evidence, fixBlocks, queryBlocks, explanation, optimization, codeBlocks, approach, complexity, analysis, recommendation, reasoning, selectedAnswer, serializeBlocks]);

  const hasBlockContent = useCallback((blocks: Block[]) => {
    return blocks.some((b) => b.content.trim().length > 0);
  }, []);

  const isFormValid = useCallback(() => {
    if (!session?.question) return false;
    if (session.question.format === "mcq") return !!selectedAnswer;
    switch (session.question.category) {
      case "system_design": return !!(overview.trim() || components.trim());
      case "debugging": return !!rootCause.trim();
      case "data_analysis": return !!(hasBlockContent(queryBlocks) || explanation.trim());
      case "practical_coding": return hasBlockContent(codeBlocks);
      case "cfa": return !!analysis.trim();
      default: return !!summary.trim();
    }
  }, [session, summary, overview, components, rootCause, queryBlocks, explanation, codeBlocks, analysis, selectedAnswer, hasBlockContent]);

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
  const isMcq = session?.question.format === "mcq";
  /** User-chosen language (session level) > question-level language */
  const sessionLanguage = selectedLanguage ?? session?.language ?? session?.question.language ?? null;
  const backUrl = session ? `/practice/${category}/${session.question.type}` : "/practice";
  const categoryLabel = CATEGORY_LABELS[category] ?? "Practice";

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };
  const guestLimitReached = !isAuthenticated && guestCompletions >= GUEST_LIMIT;

  const stepNumber = step === "diff" ? 1 : step === "analysis" ? 2 : step === "result" ? 3 : 0;

  const isSplit = step === "analysis" || step === "result";

  if (step === "loading") {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <LoadingSpinner size="lg" />
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
          <p className={`text-xs font-semibold tracking-wide uppercase ${CATEGORY_COLORS[category] ?? "text-muted-foreground"}`}>
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
          {session?.question.difficulty && (
            <span className={`text-[10px] font-mono font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded ${
              session.question.difficulty === "easy" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
              session.question.difficulty === "hard" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" :
              "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}>
              {session.question.difficulty}
            </span>
          )}
        </div>
        <h2 className="text-xl font-semibold tracking-tight">{session?.question.title}</h2>
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{session?.question.prompt}</p>
      </div>
      {category !== "practical_coding" && category !== "cfa" && !isMcq && (
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
            {isMcq
              ? "Show answer choices"
              : <>
                  {category === "code_review" && "I've read the code — write my review"}
                  {category === "system_design" && "I've read the requirements — write my design"}
                  {category === "debugging" && "I've read the code — diagnose the bug"}
                  {category === "data_analysis" && "I've read the problem — write my solution"}
                  {category === "practical_coding" && "I've read the problem — write my code"}
                  {category === "cfa" && "I've read the scenario — write my answer"}
                  {!["code_review", "system_design", "debugging", "data_analysis", "practical_coding", "cfa"].includes(category) && "I've read the code — write my analysis"}
                </>
            }
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
          02 · {isMcq ? "Choose your answer" : `Your ${category === "code_review" ? "Analysis" : category === "system_design" ? "Design" : category === "debugging" ? "Diagnosis" : category === "data_analysis" ? "Solution" : category === "cfa" ? "Response" : "Implementation"}`}
        </p>
        <p className="text-sm text-muted-foreground">
          {isMcq && "Pick the best answer. You'll see the explanation right after."}
          {!isMcq && category === "code_review" && "Write precisely. Vague answers score poorly."}
          {!isMcq && category === "system_design" && "Describe your architecture clearly. Justify your design choices."}
          {!isMcq && category === "debugging" && "Identify the root cause with evidence. Propose a concrete fix."}
          {!isMcq && category === "data_analysis" && "Write your query and explain your reasoning."}
          {!isMcq && category === "practical_coding" && "Write clean, working code. Explain your approach."}
          {!isMcq && category === "cfa" && "Identify the applicable standard or concept, recommend an action, and justify your reasoning."}
        </p>
      </div>
      <form onSubmit={submitAnswer} className="space-y-4">

        {/* MCQ Form */}
        {isMcq && session.question.choices && (
          <div className="space-y-2">
            {session.question.choices.map((choice, idx) => {
              const letter = String.fromCharCode(65 + idx); // A, B, C, D...
              const isSelected = selectedAnswer === letter;
              const isResult = step === "result";
              const evalRationale = evaluation?.rationale ?? "";
              // Parse correct letter out of rationale ("The correct answer is X" or "Correct")
              let correctLetter = "";
              const match = evalRationale.match(/correct answer is ([A-E])/i);
              if (match) correctLetter = match[1].toUpperCase();
              else if (evalRationale.startsWith("Correct") && isSelected) correctLetter = letter;
              const isCorrect = isResult && correctLetter === letter;
              const isWrongSelected = isResult && isSelected && correctLetter && correctLetter !== letter;
              return (
                <button
                  key={letter}
                  type="button"
                  disabled={isResult}
                  onClick={() => setSelectedAnswer(letter)}
                  className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                    isCorrect
                      ? "border-emerald-500 bg-emerald-500/10"
                      : isWrongSelected
                        ? "border-rose-500 bg-rose-500/10"
                        : isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50 hover:bg-muted/30"
                  } ${isResult ? "cursor-default" : "cursor-pointer"}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`text-xs font-mono font-semibold rounded px-1.5 py-0.5 mt-0.5 shrink-0 ${
                      isCorrect
                        ? "bg-emerald-500 text-white"
                        : isWrongSelected
                          ? "bg-rose-500 text-white"
                          : isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground/70"
                    }`}>
                      {letter}
                    </span>
                    <span className="text-sm text-foreground/90 leading-relaxed">{choice}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Code Review Form */}
        {!isMcq && (category === "code_review" || !["system_design", "debugging", "data_analysis", "practical_coding", "cfa"].includes(category)) && (
          <>
            <div className="space-y-2">
              <label htmlFor="summary" className="text-sm font-medium text-foreground">
                Summary <span className="text-muted-foreground font-normal">— the single most important issue</span>
              </label>
              {step === "result" ? (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap bg-muted/30 rounded-lg px-4 py-3">{summary || "—"}</p>
              ) : (
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="The biggest problem in this code is..."
                  rows={3}
                />
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="findings" className="text-sm font-medium text-foreground">
                Findings <span className="text-muted-foreground font-normal">— what you found and why it matters</span>
              </label>
              {step === "result" ? (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap bg-muted/30 rounded-lg px-4 py-3">{findings || "—"}</p>
              ) : (
                <Textarea
                  id="findings"
                  value={findings}
                  onChange={(e) => setFindings(e.target.value)}
                  placeholder={"1. Security: SQL injection in line 12...\n2. Performance: N+1 query in the loop...\n3. Error handling: unhandled promise rejection..."}
                  rows={8}
                />
              )}
            </div>
          </>
        )}

        {/* System Design Form */}
        {category === "system_design" && (
          <>
            {([
              { id: "overview", label: "Architecture Overview", hint: "high-level system description", value: overview, set: setOverview, placeholder: "The system uses a microservices architecture with...", rows: 4 },
              { id: "components", label: "Key Components", hint: "what are the main pieces and how they interact", value: components, set: setComponents, placeholder: "1. API Gateway — routes requests, handles auth\n2. Message Queue — async processing\n3. Cache Layer — Redis for hot data...", rows: 6 },
              { id: "tradeoffs", label: "Tradeoffs", hint: "what you chose and what you gave up", value: tradeoffs, set: setTradeoffs, placeholder: "Chose eventual consistency over strong consistency because...", rows: 4 },
              { id: "scaling", label: "Scaling Strategy", hint: "how to handle growth", value: scalingStrategy, set: setScalingStrategy, placeholder: "Horizontal scaling via sharding by user_id. Read replicas for...", rows: 4 },
            ] as const).map((field) => (
              <div key={field.id} className="space-y-2">
                <label htmlFor={field.id} className="text-sm font-medium text-foreground">
                  {field.label} <span className="text-muted-foreground font-normal">— {field.hint}</span>
                </label>
                {step === "result" ? (
                  <p className="text-sm text-foreground/80 whitespace-pre-wrap bg-muted/30 rounded-lg px-4 py-3">{field.value || "—"}</p>
                ) : (
                  <Textarea
                    id={field.id}
                    value={field.value}
                    onChange={(e) => field.set(e.target.value)}
                    placeholder={field.placeholder}
                    rows={field.rows}
                  />
                )}
              </div>
            ))}
          </>
        )}

        {/* Debugging Form */}
        {category === "debugging" && (
          <>
            <div className="space-y-2">
              <label htmlFor="rootCause" className="text-sm font-medium text-foreground">
                Root Cause <span className="text-muted-foreground font-normal">— what exactly is causing the bug</span>
              </label>
              {step === "result" ? (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap bg-muted/30 rounded-lg px-4 py-3">{rootCause || "—"}</p>
              ) : (
                <Textarea
                  id="rootCause"
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="The bug is caused by a race condition between..."
                  rows={4}
                />
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="evidence" className="text-sm font-medium text-foreground">
                Evidence & Reasoning <span className="text-muted-foreground font-normal">— how you identified this</span>
              </label>
              {step === "result" ? (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap bg-muted/30 rounded-lg px-4 py-3">{evidence || "—"}</p>
              ) : (
                <Textarea
                  id="evidence"
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  placeholder={"Line 42: the mutex is acquired after the check, creating a TOCTOU window...\nThe stack trace shows the thread interleaving at..."}
                  rows={6}
                />
              )}
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
              {step === "result" ? (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap bg-muted/30 rounded-lg px-4 py-3">{explanation || "—"}</p>
              ) : (
                <Textarea
                  id="explanation"
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  placeholder="I used a LEFT JOIN to include users with no orders. The HAVING clause filters..."
                  rows={4}
                />
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="optimization" className="text-sm font-medium text-foreground">
                Optimization <span className="text-muted-foreground font-normal">— performance considerations</span>
              </label>
              {step === "result" ? (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap bg-muted/30 rounded-lg px-4 py-3">{optimization || "—"}</p>
              ) : (
                <Textarea
                  id="optimization"
                  value={optimization}
                  onChange={(e) => setOptimization(e.target.value)}
                  placeholder="Add index on orders(user_id, created_at). For large datasets, consider..."
                  rows={3}
                />
              )}
            </div>
          </>
        )}

        {/* CFA Form */}
        {category === "cfa" && !isMcq && (
          <>
            <div className="space-y-2">
              <label htmlFor="analysis" className="text-sm font-medium text-foreground">
                Analysis <span className="text-muted-foreground font-normal">— what's happening, what standard or concept applies, what the key issue is</span>
              </label>
              {step === "result" ? (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap bg-muted/30 rounded-lg px-4 py-3">{analysis || "—"}</p>
              ) : (
                <Textarea
                  id="analysis"
                  value={analysis}
                  onChange={(e) => setAnalysis(e.target.value)}
                  placeholder="This scenario implicates Standard II(A) Material Nonpublic Information because..."
                  rows={6}
                />
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="recommendation" className="text-sm font-medium text-foreground">
                Recommendation <span className="text-muted-foreground font-normal">— what should be done</span>
              </label>
              {step === "result" ? (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap bg-muted/30 rounded-lg px-4 py-3">{recommendation || "—"}</p>
              ) : (
                <Textarea
                  id="recommendation"
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                  placeholder="Sarah should not incorporate this information in her report. She should isolate it, refrain from trading, and notify compliance..."
                  rows={4}
                />
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="reasoning" className="text-sm font-medium text-foreground">
                Reasoning <span className="text-muted-foreground font-normal">— the chain from facts to conclusion</span>
              </label>
              {step === "result" ? (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap bg-muted/30 rounded-lg px-4 py-3">{reasoning || "—"}</p>
              ) : (
                <Textarea
                  id="reasoning"
                  value={reasoning}
                  onChange={(e) => setReasoning(e.target.value)}
                  placeholder="The information is (1) material — a 30% earnings beat would move the stock — and (2) nonpublic — a private conversation. Passive acquisition does not change MNPI status..."
                  rows={5}
                />
              )}
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
              {step === "result" ? (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap bg-muted/30 rounded-lg px-4 py-3">{approach || "—"}</p>
              ) : (
                <Textarea
                  id="approach"
                  value={approach}
                  onChange={(e) => setApproach(e.target.value)}
                  placeholder="Used a hash map for O(1) lookups to avoid the brute-force O(n²) approach..."
                  rows={3}
                />
              )}
            </div>
            <div className="space-y-2">
              <label htmlFor="complexity" className="text-sm font-medium text-foreground">
                Complexity Analysis <span className="text-muted-foreground font-normal">— time and space</span>
              </label>
              {step === "result" ? (
                <p className="text-sm text-foreground/80 whitespace-pre-wrap bg-muted/30 rounded-lg px-4 py-3">{complexity || "—"}</p>
              ) : (
                <Textarea
                  id="complexity"
                  value={complexity}
                  onChange={(e) => setComplexity(e.target.value)}
                  placeholder="Time: O(n) — single pass through the array. Space: O(n) — hash map stores up to n entries."
                  rows={2}
                />
              )}
            </div>
          </>
        )}

        {step === "analysis" && (
          <div className="space-y-2">
            <Button type="submit" disabled={loading || !isFormValid()}>
              {loading ? (
                <>
                  <Loader2Icon className="size-4 animate-spin mr-2" />
                  {isMcq ? "Checking..." : "Evaluating..."}
                </>
              ) : (
                isMcq ? "Submit answer" : "Submit & get AI evaluation"
              )}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              {isMcq
                ? "Instant feedback — no AI evaluation needed"
                : "Your answer will be graded by AI against expert criteria"}
            </p>
          </div>
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
      <EvaluationResult evaluation={evaluation} isGuest={!isAuthenticated} />

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
          <MobileNav />
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

            <div className="flex items-center justify-between">
              <Stepper current={stepNumber} />
              {step !== "diff" && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
                  <ClockIcon className="size-3.5" />
                  <span>{formatTime(elapsed)}</span>
                </div>
              )}
            </div>

            {/* Layout: single column (diff) or split (analysis/result) */}
            {!isSplit ? (
              /* -- Single column: reading the problem -- */
              <div className="pb-24">
                {problemPanel}
              </div>
            ) : (
              <>
                {/* Mobile: stacked */}
                <div className="lg:hidden flex flex-col gap-6 pb-24 animate-fade-in-up" style={{ animationDuration: "0.5s" }}>
                  <div className="space-y-4">{problemPanel}</div>
                  <div className="h-px bg-border" />
                  <div className="space-y-10">
                    {analysisPanel}
                    {resultPanel}
                  </div>
                </div>
                {/* Desktop: resizable panels */}
                <div className="hidden lg:block pb-24 animate-fade-in-up" style={{ animationDuration: "0.5s" }}>
                  <ResizablePanelGroup orientation="horizontal" className="min-h-[calc(100dvh-14rem)]">
                    <ResizablePanel defaultSize={45} minSize={30} maxSize={65}>
                      <div className="h-full overflow-y-auto pr-4 space-y-4 scrollbar-thin">
                        {problemPanel}
                      </div>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={55} minSize={30} maxSize={70}>
                      <div className="h-full overflow-y-auto pl-4 space-y-10">
                        {analysisPanel}
                        {resultPanel}
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
