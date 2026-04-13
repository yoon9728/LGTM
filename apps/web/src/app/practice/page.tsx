"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserButton } from "@/components/user-button";
import { useSession } from "@/lib/auth-client";
import { api } from "@/lib/api";
import type { CategoryMeta, CategoryStats } from "@/lib/api";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { GUEST_LIMIT, GUEST_STORAGE_KEY } from "@/lib/guest";
import { LoadingSpinner } from "@/components/loading-spinner";
import { MobileNav } from "@/components/mobile-nav";
import {
  ArrowRightIcon,
  LockIcon,
  HistoryIcon,
  CodeIcon,
  LayoutDashboardIcon,
  TerminalIcon,
  TableIcon,
  PencilLineIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  code_review: <CodeIcon className="size-5" />,
  system_design: <LayoutDashboardIcon className="size-5" />,
  debugging: <TerminalIcon className="size-5" />,
  data_analysis: <TableIcon className="size-5" />,
  practical_coding: <PencilLineIcon className="size-5" />,
};

const CATEGORY_ACCENT: Record<string, string> = {
  code_review: "bg-blue-500/10 text-blue-500",
  system_design: "bg-violet-500/10 text-violet-500",
  debugging: "bg-amber-500/10 text-amber-500",
  data_analysis: "bg-emerald-500/10 text-emerald-500",
  practical_coding: "bg-rose-500/10 text-rose-500",
};

export default function PracticeTypesPage() {
  const { data: authSession, isPending } = useSession();
  const isAuthenticated = !!authSession?.user;

  const [categories, setCategories] = useState<CategoryMeta[]>([]);
  const [categoryStats, setCategoryStats] = useState<Record<string, CategoryStats>>({});
  const [guestCompletions, setGuestCompletions] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(GUEST_STORAGE_KEY);
    if (stored) setGuestCompletions(parseInt(stored) || 0);
  }, []);

  useEffect(() => {
    Promise.all([
      api.getMeta(),
      api.getQuestions(),
    ]).then(([meta, data]) => {
      setCategories(meta.categories);
      setCategoryStats(data.categoryStats);
    }).catch((e) => console.error("Practice page load error:", e)).finally(() => setLoading(false));
  }, []);

  // Re-fetch with auth when auth resolves
  useEffect(() => {
    if (isPending || !isAuthenticated) return;
    api.getQuestions().then((data) => {
      setCategoryStats(data.categoryStats);
    }).catch(() => {});
  }, [isPending, isAuthenticated]);

  const guestLimitReached = !isAuthenticated && !isPending && guestCompletions >= GUEST_LIMIT;
  const cardsRef = useScrollReveal([categories]);

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 pb-24">
      {/* Header */}
      <header className="flex items-center justify-between py-6 border-b border-border mb-10">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xs font-bold tracking-[0.16em] uppercase hover:text-primary transition-colors">
            LGTM
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs text-muted-foreground tracking-wide">Practice</span>
          {!isAuthenticated && (
            <span className="text-[10px] text-muted-foreground font-mono tracking-wide border border-border rounded px-1.5 py-0.5">
              GUEST · {guestCompletions}/{GUEST_LIMIT}
            </span>
          )}
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

      {/* Guest limit reached */}
      {guestLimitReached && (
        <section className="space-y-6 pt-8">
          <div className="rounded-xl border border-border p-8 text-center space-y-4 max-w-md mx-auto">
            <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <LockIcon className="size-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">Guest limit reached</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You&apos;ve completed {GUEST_LIMIT} free sessions. Create an account to unlock all questions and track your progress.
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <Link href="/sign-up">
                <Button>
                  Create free account
                  <ArrowRightIcon className="size-3.5 ml-1.5" />
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline">Sign in</Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Category Selection */}
      {!guestLimitReached && (
        <section className="space-y-8 pt-4">
          <div className="space-y-3">
            <h1 className="text-2xl font-bold tracking-tight">Choose a category</h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
              Each category tests a different professional skill. Pick one to explore sub-topics and questions.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2" ref={cardsRef}>
            {categories.map((cat) => {
              const stats = categoryStats[cat.id];
              return (
                <Link key={cat.id} href={`/practice/${cat.id}`}>
                  <div className="scroll-reveal card-glow group text-left rounded-xl p-6 space-y-3 h-full">
                    <div className="flex items-start justify-between">
                      <div className={`size-10 rounded-lg flex items-center justify-center ${CATEGORY_ACCENT[cat.id] ?? "bg-primary/10 text-primary"}`}>
                        {CATEGORY_ICONS[cat.id] ?? <CodeIcon className="size-5" />}
                      </div>
                      {stats && (
                        <span className="text-xs font-mono text-muted-foreground">
                          {stats.completed}/{stats.total}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                        {cat.label}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.types.slice(0, 4).map((t) => (
                        <span key={t.id} className="text-[10px] font-mono tracking-wide text-muted-foreground border border-border rounded px-1.5 py-0.5">
                          {t.label}
                        </span>
                      ))}
                      {cat.types.length > 4 && (
                        <span className="text-[10px] font-mono tracking-wide text-muted-foreground">
                          +{cat.types.length - 4}
                        </span>
                      )}
                    </div>
                    {stats && stats.completed > 0 && stats.total > 0 && (
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="progress-gradient h-1.5 transition-all"
                          style={{ width: `${(stats.completed / stats.total) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
