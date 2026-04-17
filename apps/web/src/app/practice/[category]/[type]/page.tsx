"use client";

import { useState, useEffect, useCallback, useMemo, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserButton } from "@/components/user-button";
import { useSession } from "@/lib/auth-client";
import { api } from "@/lib/api";
import type { QuestionListItem, CategoryMeta, CategoryStats } from "@/lib/api";
import { GUEST_LIMIT, GUEST_STORAGE_KEY } from "@/lib/guest";
import { LoadingSpinner, LoadingDots } from "@/components/loading-spinner";
import { MobileNav } from "@/components/mobile-nav";
import {
  ArrowLeftIcon,
  LockIcon,
  HistoryIcon,
  ShuffleIcon,
  CheckCircle2Icon,
  LayoutListIcon,
  LayoutGridIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowUpDownIcon,
} from "lucide-react";

export default function TypeQuestionsPage({
  params,
}: {
  params: Promise<{ category: string; type: string }>;
}) {
  const { category, type } = use(params);
  const router = useRouter();

  const { data: authSession, isPending } = useSession();
  const isAuthenticated = !!authSession?.user;

  const [questions, setQuestions] = useState<QuestionListItem[]>([]);
  const [catMeta, setCatMeta] = useState<CategoryMeta | null>(null);
  const [typeMeta, setTypeMeta] = useState<{ id: string; label: string; description: string } | null>(null);
  const [stats, setStats] = useState<{ total: number; completed: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [guestCompletions, setGuestCompletions] = useState(0);
  const [viewMode, setViewMode] = useState<"list" | "card">("list");
  const [sortBy, setSortBy] = useState<"default" | "easy-first" | "hard-first">("default");
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const stored = localStorage.getItem(GUEST_STORAGE_KEY);
    if (stored) setGuestCompletions(parseInt(stored) || 0);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [currentPage]);

  const guestLimitReached = !isAuthenticated && !isPending && guestCompletions >= GUEST_LIMIT;

  const sortedQuestions = useMemo(() => {
    if (sortBy === "default") return questions;
    const order = { easy: 0, medium: 1, hard: 2 };
    return [...questions].sort((a, b) => {
      const oa = a.difficulty ? order[a.difficulty] : 3;
      const ob = b.difficulty ? order[b.difficulty] : 3;
      return sortBy === "easy-first" ? oa - ob : ob - oa;
    });
  }, [questions, sortBy]);

  useEffect(() => {
    Promise.all([
      api.getMeta(),
      api.getQuestions({ category, type }),
    ]).then(([metaRes, dataRes]) => {
      const cat = metaRes.categories.find((c) => c.id === category);
      setCatMeta(cat ?? null);
      const t = cat?.types.find((t) => t.id === type);
      setTypeMeta(t ?? null);
      setQuestions(dataRes.questions);
      setStats(dataRes.categoryStats[category]?.types[type] ?? null);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [category, type]);

  useEffect(() => {
    if (isPending || !isAuthenticated) return;
    api.getQuestions({ category, type }).then((dataRes) => {
      setQuestions(dataRes.questions);
      setStats(dataRes.categoryStats[category]?.types[type] ?? null);
    }).catch(() => {});
  }, [isPending, isAuthenticated, category, type]);

  const startSession = useCallback(async (questionId?: string) => {
    setStarting(true);
    try {
      const { session } = await api.createSession({
        questionId,
        category: questionId ? undefined : category,
        type: questionId ? undefined : type,
      });
      router.push(`/practice/session/${session.id}`);
    } catch {
      setStarting(false);
    }
  }, [category, type, router]);

  // No scroll-reveal on paginated lists — items should be visible immediately

  if (loading && !catMeta) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!catMeta || !typeMeta) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <p className="text-muted-foreground">Unknown type.</p>
        <Link href={`/practice/${category}`} className="text-primary hover:underline text-sm mt-2 block">
          Back to {category}
        </Link>
      </div>
    );
  }

  const isGuestPreview = !isAuthenticated && !isPending;
  const displayLabel = typeMeta.label;

  return (
    <div className="max-w-4xl mx-auto px-6 pb-24">
      {/* Header */}
      <header className="flex items-center justify-between py-6 border-b border-border mb-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs font-bold tracking-[0.16em] uppercase hover:text-primary transition-colors">
            LGTM
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <Link href="/practice" className="text-xs text-muted-foreground tracking-wide hover:text-foreground transition-colors">
            Practice
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <Link href={`/practice/${category}`} className="text-xs text-muted-foreground tracking-wide hover:text-foreground transition-colors">
            {catMeta.label}
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs text-muted-foreground tracking-wide">
            {displayLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <Link href="/history">
              <Button size="sm" variant="ghost">
                <HistoryIcon className="size-3.5 mr-1.5" />
                History
              </Button>
            </Link>
          )}
          <ThemeToggle />
          <UserButton />
          <MobileNav />
        </div>
      </header>

      {/* Guest limit */}
      {guestLimitReached && (
        <div className="rounded-xl border border-border p-8 text-center space-y-4 max-w-md mx-auto">
          <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <LockIcon className="size-5 text-primary" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Guest limit reached</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Create an account to unlock all questions.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link href="/sign-up"><Button>Create free account</Button></Link>
            <Link href="/sign-in"><Button variant="outline">Sign in</Button></Link>
          </div>
        </div>
      )}

      {!guestLimitReached && (
        <section className="space-y-6">
          {/* Title + Stats */}
          <div className="flex items-center gap-3">
            <Link
              href={`/practice/${category}`}
              className="size-8 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors"
            >
              <ArrowLeftIcon className="size-3.5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{displayLabel}</h1>
              <p className="text-sm text-muted-foreground">{typeMeta.description}</p>
              {stats && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.completed} of {stats.total} completed (90+ score)
                </p>
              )}
            </div>
          </div>

          {/* Random Button */}
          <Button onClick={() => startSession()} disabled={starting} className="w-full sm:w-auto">
            {starting ? (
              <LoadingDots />
            ) : (
              <>
                <ShuffleIcon className="size-4 mr-2" />
                Random question
              </>
            )}
          </Button>

          {/* Question Cards */}
          {sortedQuestions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">No questions available yet.</p>
            </div>
          ) : (
            <>
              {/* View controls */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-0 sm:justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setViewMode("list"); setCurrentPage(1); }}
                    className={`size-8 rounded-md flex items-center justify-center transition-colors ${
                      viewMode === "list" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LayoutListIcon className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setViewMode("card"); setCurrentPage(1); }}
                    className={`size-8 rounded-md flex items-center justify-center transition-colors ${
                      viewMode === "card" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <LayoutGridIcon className="size-3.5" />
                  </button>
                  <div className="w-px h-5 bg-border mx-1" />
                  <button
                    type="button"
                    onClick={() => { setSortBy((s) => s === "default" ? "easy-first" : s === "easy-first" ? "hard-first" : "default"); setCurrentPage(1); }}
                    className={`h-8 rounded-md flex items-center gap-1.5 px-2.5 text-[11px] font-medium transition-colors ${
                      sortBy !== "default" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ArrowUpDownIcon className="size-3.5" />
                    <span className="hidden sm:inline">{sortBy === "easy-first" ? "Easy first" : sortBy === "hard-first" ? "Hard first" : "Difficulty"}</span>
                  </button>
                </div>
                {sortedQuestions.length > 20 && (
                  <div className="flex items-center gap-1">
                    {[20, 50, 100].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => { setPageSize(size); setCurrentPage(1); }}
                        className={`text-[10px] font-mono px-2 py-1 rounded transition-colors ${
                          pageSize === size
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground border border-border"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* List view */}
              {viewMode === "list" && (() => {
                const totalPages = Math.ceil(sortedQuestions.length / pageSize);
                const start = (currentPage - 1) * pageSize;
                const paged = sortedQuestions.slice(start, start + pageSize);
                return (
                  <>
                    <div className="grid gap-3">
                      {paged.map((q) => (
                        <button
                          key={q.id}
                          onClick={() => startSession(q.id)}
                          disabled={starting}
                          className="card-glow group text-left rounded-lg px-5 py-4 w-full"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 space-y-1.5">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {q.title}
                                </h3>
                                {q.difficulty && (
                                  <span className={`text-[10px] font-mono font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded ${
                                    q.difficulty === "easy" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                                    q.difficulty === "hard" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" :
                                    "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                  }`}>
                                    {q.difficulty}
                                  </span>
                                )}
                                {q.format === "mcq" && (
                                  <span className="text-[10px] font-mono font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                                    MCQ
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                {q.prompt}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {q.bestScore != null && (
                                <span className={`text-sm font-mono font-bold ${
                                  q.bestScore >= 90 ? "text-primary" :
                                  q.bestScore >= 70 ? "text-foreground" :
                                  "text-muted-foreground"
                                }`}>
                                  {q.bestScore}
                                </span>
                              )}
                              {q.completed && (
                                <CheckCircle2Icon className="size-4 text-primary" />
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="size-8 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-30"
                        >
                          <ChevronLeftIcon className="size-3.5" />
                        </button>
                        <span className="text-xs font-mono text-muted-foreground">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="size-8 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-30"
                        >
                          <ChevronRightIcon className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Card view — grid of cards */}
              {viewMode === "card" && (() => {
                const totalPages = Math.ceil(sortedQuestions.length / pageSize);
                const start = (currentPage - 1) * pageSize;
                const paged = sortedQuestions.slice(start, start + pageSize);
                return (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {paged.map((q) => (
                        <button
                          key={q.id}
                          onClick={() => startSession(q.id)}
                          disabled={starting}
                          className="card-glow group text-left rounded-xl p-5 w-full space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                {q.title}
                              </h3>
                              {q.difficulty && (
                                <span className={`text-[10px] font-mono font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded shrink-0 ${
                                  q.difficulty === "easy" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" :
                                  q.difficulty === "hard" ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" :
                                  "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                }`}>
                                  {q.difficulty}
                                </span>
                              )}
                              {q.format === "mcq" && (
                                <span className="text-[10px] font-mono font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded shrink-0 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                                  MCQ
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              {q.bestScore != null && (
                                <span className={`text-sm font-mono font-bold ${
                                  q.bestScore >= 90 ? "text-primary" :
                                  q.bestScore >= 70 ? "text-foreground" :
                                  "text-muted-foreground"
                                }`}>
                                  {q.bestScore}
                                </span>
                              )}
                              {q.completed && (
                                <CheckCircle2Icon className="size-4 text-primary" />
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                            {q.prompt}
                          </p>
                        </button>
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="size-8 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-30"
                        >
                          <ChevronLeftIcon className="size-3.5" />
                        </button>
                        <span className="text-xs font-mono text-muted-foreground">
                          {currentPage} / {totalPages}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="size-8 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors disabled:opacity-30"
                        >
                          <ChevronRightIcon className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}

              {/* Guest teaser — more questions available */}
              {isGuestPreview && (
                <div className="rounded-lg border border-border border-dashed p-6 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <LockIcon className="size-4" />
                    <span className="text-sm font-semibold">100+ more questions</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                    Sign up to access the full question bank across all difficulty levels.
                  </p>
                  <div className="flex gap-2 justify-center pt-1">
                    <Link href="/sign-up">
                      <Button size="sm">Create free account</Button>
                    </Link>
                    <Link href="/sign-in">
                      <Button size="sm" variant="outline">Sign in</Button>
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
