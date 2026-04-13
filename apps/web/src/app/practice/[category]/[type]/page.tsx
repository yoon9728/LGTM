"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserButton } from "@/components/user-button";
import { useSession } from "@/lib/auth-client";
import { api } from "@/lib/api";
import type { QuestionListItem, CategoryMeta, CategoryStats } from "@/lib/api";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { GUEST_LIMIT, GUEST_STORAGE_KEY } from "@/lib/guest";
import { LoadingSpinner, LoadingDots } from "@/components/loading-spinner";
import { MobileNav } from "@/components/mobile-nav";
import {
  ArrowLeftIcon,
  LockIcon,
  HistoryIcon,
  ShuffleIcon,
  CheckCircle2Icon,
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

  useEffect(() => {
    const stored = localStorage.getItem(GUEST_STORAGE_KEY);
    if (stored) setGuestCompletions(parseInt(stored) || 0);
  }, []);

  const guestLimitReached = !isAuthenticated && !isPending && guestCompletions >= GUEST_LIMIT;

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

  const cardsRef = useScrollReveal([questions]);

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
          {questions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">No questions available yet.</p>
            </div>
          ) : (
            <div className="grid gap-3" ref={cardsRef}>
              {questions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => startSession(q.id)}
                  disabled={starting}
                  className="scroll-reveal card-glow group text-left rounded-lg px-5 py-4 w-full"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-1.5">
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {q.title}
                      </h3>
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
          )}
        </section>
      )}
    </div>
  );
}
