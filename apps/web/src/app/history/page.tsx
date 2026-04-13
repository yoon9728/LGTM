"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserButton } from "@/components/user-button";
import { useSession } from "@/lib/auth-client";
import { api } from "@/lib/api";
import type { HistoryEntry } from "@/lib/api";
import { LoadingSpinner } from "@/components/loading-spinner";
import { MobileNav } from "@/components/mobile-nav";
import {
  ArrowRightIcon,
  CodeIcon,
  LayoutDashboardIcon,
  TerminalIcon,
  TableIcon,
  PencilLineIcon,
} from "lucide-react";

function scoreColor(score: number | null): string {
  if (score == null) return "text-muted-foreground";
  if (score >= 70) return "text-primary";
  if (score >= 40) return "text-foreground";
  return "text-muted-foreground";
}

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode }> = {
  code_review: { label: "Review", icon: <CodeIcon className="size-3.5" /> },
  system_design: { label: "Design", icon: <LayoutDashboardIcon className="size-3.5" /> },
  debugging: { label: "Debug", icon: <TerminalIcon className="size-3.5" /> },
  data_analysis: { label: "Data", icon: <TableIcon className="size-3.5" /> },
  practical_coding: { label: "Coding", icon: <PencilLineIcon className="size-3.5" /> },
};

const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "code_review", label: "Review" },
  { id: "system_design", label: "Design" },
  { id: "debugging", label: "Debug" },
  { id: "data_analysis", label: "Data" },
  { id: "practical_coding", label: "Coding" },
] as const;

export default function HistoryPage() {
  const { data: authSession, isPending } = useSession();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (isPending) return;
    if (!authSession?.user) {
      router.push("/sign-in");
      return;
    }
    api
      .getHistory()
      .then((res) => setHistory(res.history))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [authSession, isPending, router]);

  if (isPending || (!authSession?.user && !loading)) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const completedSessions = history.filter((h) => h.status === "answer_submitted");
  const avgScore =
    completedSessions.length > 0
      ? Math.round(
          completedSessions.reduce((sum, h) => sum + (h.score ?? 0), 0) /
            completedSessions.length
        )
      : null;

  const filteredHistory = filter === "all"
    ? history
    : history.filter((h) => h.questionCategory === filter);

  return (
    <div className="max-w-4xl mx-auto px-6 pb-24">
      {/* Header */}
      <header className="flex items-center justify-between py-6 border-b border-border mb-10">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-xs font-bold tracking-[0.16em] uppercase hover:text-primary transition-colors"
          >
            LGTM
          </Link>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-xs text-muted-foreground tracking-wide">
            History
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserButton />
          <MobileNav />
        </div>
      </header>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Practice History</h1>
        <p className="text-sm text-muted-foreground mt-1">Review your past sessions and track improvement</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">
            Sessions
          </p>
          <p className="text-2xl font-bold mt-1">{history.length}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">
            Completed
          </p>
          <p className="text-2xl font-bold mt-1">
            {completedSessions.length}
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-wide">
            Avg Score
          </p>
          <p className={`text-2xl font-bold mt-1 ${scoreColor(avgScore)}`}>
            {avgScore ?? "—"}
          </p>
        </div>
      </div>

      {/* Category Filter */}
      {history.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-6">
          {FILTER_OPTIONS.map((opt) => {
            const count = opt.id === "all"
              ? history.length
              : history.filter((h) => h.questionCategory === opt.id).length;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFilter(opt.id)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                  filter === opt.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground/20 hover:text-foreground"
                }`}
              >
                {opt.label}
                <span className="ml-1.5 text-[10px] opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* History List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="md" />
        </div>
      ) : filteredHistory.length === 0 && filter === "all" ? (
        <div className="text-center py-20 space-y-4">
          <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto">
            <CodeIcon className="size-7 text-muted-foreground/40" />
          </div>
          <div>
            <p className="text-base font-medium text-foreground">No sessions yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start a practice session to build your history</p>
          </div>
          <Link href="/practice">
            <Button className="mt-2">
              Start practicing
              <ArrowRightIcon className="size-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredHistory.length === 0 && filter !== "all" ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No sessions in this category yet.
            </p>
          ) : null}
          {filteredHistory.map((entry) => {
            const catMeta = CATEGORY_META[entry.questionCategory] ?? CATEGORY_META.code_review;
            return (
              <div
                key={entry.sessionId}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3 hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                    {catMeta.icon}
                    <span className="text-[10px] font-mono uppercase tracking-wide">
                      {catMeta.label}
                    </span>
                  </div>
                  <span className="text-sm truncate">
                    {entry.questionTitle}
                  </span>
                  {entry.questionLanguage && (
                    <span className="text-[9px] font-mono tracking-wide border border-border rounded px-1 py-0.5 text-muted-foreground shrink-0">
                      {entry.questionLanguage === "c_cpp" ? "C/C++" : entry.questionLanguage.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <span
                    className={`text-sm font-mono font-bold ${scoreColor(entry.score)}`}
                  >
                    {entry.score ?? "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Practice CTA */}
      {history.length > 0 && (
        <div className="pt-8 text-center">
          <Link href="/practice">
            <Button variant="outline">
              Practice more
              <ArrowRightIcon className="size-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
