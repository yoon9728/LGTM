"use client";

import { useState, useEffect, useCallback, use, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserButton } from "@/components/user-button";
import { useSession } from "@/lib/auth-client";
import { api } from "@/lib/api";
import type { CategoryMeta, CategoryStats } from "@/lib/api";
import {
  ArrowLeftIcon,
  Loader2Icon,
  LockIcon,
  HistoryIcon,
  ShuffleIcon,
  ArrowRightIcon,
} from "lucide-react";

const GUEST_LIMIT = 4;

function useScrollReveal(deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const children = el.querySelectorAll(".scroll-reveal:not(.revealed)");
    if (children.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => (entry.target as HTMLElement).classList.add("revealed"), i * 80);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    children.forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return ref;
}

export default function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const router = useRouter();
  const { data: authSession, isPending } = useSession();
  const isAuthenticated = !!authSession?.user;

  const [meta, setMeta] = useState<CategoryMeta | null>(null);
  const [stats, setStats] = useState<CategoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [guestCompletions, setGuestCompletions] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem("lgtm_guest_completions");
    if (stored) setGuestCompletions(parseInt(stored) || 0);
  }, []);

  const guestLimitReached = !isAuthenticated && !isPending && guestCompletions >= GUEST_LIMIT;

  useEffect(() => {
    Promise.all([
      api.getMeta(),
      api.getQuestions({ category }),
    ]).then(([metaRes, dataRes]) => {
      const cat = metaRes.categories.find((c) => c.id === category);
      setMeta(cat ?? null);
      setStats(dataRes.categoryStats[category] ?? null);
    }).catch((e) => console.error("Category page load error:", e)).finally(() => setLoading(false));
  }, [category]);

  useEffect(() => {
    if (isPending || !isAuthenticated) return;
    api.getQuestions({ category }).then((dataRes) => {
      setStats(dataRes.categoryStats[category] ?? null);
    }).catch(() => {});
  }, [isPending, isAuthenticated, category]);

  const startRandom = useCallback(async () => {
    setStarting(true);
    try {
      const { session } = await api.createSession({ category });
      router.push(`/practice/session/${session.id}`);
    } catch {
      setStarting(false);
    }
  }, [category, router]);

  const cardsRef = useScrollReveal([meta]);

  if (loading && !meta) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!meta) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-24 text-center">
        <p className="text-muted-foreground">Unknown category.</p>
        <Link href="/practice" className="text-primary hover:underline text-sm mt-2 block">
          Back to practice
        </Link>
      </div>
    );
  }

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
          <span className="text-xs text-muted-foreground tracking-wide">{meta.label}</span>
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
        <section className="space-y-8">
          {/* Title + Stats */}
          <div className="flex items-center gap-3">
            <Link
              href="/practice"
              className="size-8 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors"
            >
              <ArrowLeftIcon className="size-3.5" />
            </Link>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">{meta.label}</h1>
              <p className="text-sm text-muted-foreground">{meta.description}</p>
              {stats && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.completed} of {stats.total} completed (90+ score)
                </p>
              )}
            </div>
          </div>

          {/* Random Button */}
          <Button onClick={startRandom} disabled={starting} className="w-full sm:w-auto">
            {starting ? (
              <Loader2Icon className="size-4 animate-spin" />
            ) : (
              <>
                <ShuffleIcon className="size-4 mr-2" />
                Random {meta.label} question
              </>
            )}
          </Button>

          {/* Sub-type Cards */}
          <div className="space-y-3">
            <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
              Sub-topics
            </p>
            <div className="grid gap-3" ref={cardsRef}>
              {meta.types.map((t) => {
                const typeStats = stats?.types[t.id];
                return (
                  <Link key={t.id} href={`/practice/${category}/${t.id}`}>
                    <div className="scroll-reveal card-glow group text-left rounded-lg px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 space-y-1">
                          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {t.label}
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {t.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {typeStats && (
                            <span className="text-xs font-mono text-muted-foreground">
                              {typeStats.completed}/{typeStats.total}
                            </span>
                          )}
                          <ArrowRightIcon className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
