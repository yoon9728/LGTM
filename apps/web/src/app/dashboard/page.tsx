"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession } from "@/lib/auth-client";
import { api, type UserStats } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserButton } from "@/components/user-button";
import { MobileNav } from "@/components/mobile-nav";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  FlameIcon,
  TrophyIcon,
  TargetIcon,
  BarChart3Icon,
  ArrowRightIcon,
  CodeIcon,
  LayoutDashboardIcon,
  TerminalIcon,
  TableIcon,
  PencilLineIcon,
  SparklesIcon,
} from "lucide-react";

const CategoryRadarChart = dynamic(
  () =>
    import("@/components/charts/category-radar-chart").then(
      (m) => m.CategoryRadarChart
    ),
  { ssr: false }
);

const CATEGORY_LABELS: Record<string, string> = {
  code_review: "Code Review",
  system_design: "System Design",
  debugging: "Debugging",
  data_analysis: "Data Analysis",
  practical_coding: "Practical Coding",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  code_review: <CodeIcon className="size-4" />,
  system_design: <LayoutDashboardIcon className="size-4" />,
  debugging: <TerminalIcon className="size-4" />,
  data_analysis: <TableIcon className="size-4" />,
  practical_coding: <PencilLineIcon className="size-4" />,
};

const CATEGORY_ACCENT: Record<string, string> = {
  code_review: "text-blue-500 bg-blue-500/10",
  system_design: "text-violet-500 bg-violet-500/10",
  debugging: "text-amber-500 bg-amber-500/10",
  data_analysis: "text-emerald-500 bg-emerald-500/10",
  practical_coding: "text-rose-500 bg-rose-500/10",
};

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const { stats } = await api.getStats();
      setStats(stats);
    } catch {
      router.push("/sign-in");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.push("/sign-in");
      return;
    }
    fetchStats();
  }, [session, isPending, fetchStats, router]);

  if (isPending || loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!stats) return null;

  const { overview, categoryStats, recentSessions, weakestCategory } = stats;
  const allCategories = ["code_review", "system_design", "debugging", "data_analysis", "practical_coding"];

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Nav */}
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/">
              <span className="text-sm font-bold tracking-[0.12em] font-mono">LGTM</span>
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-sm font-medium text-muted-foreground">Dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserButton />
            <MobileNav />
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-8 w-full space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Growth Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your progress across all practice types
            </p>
          </div>
          <Link href="/practice">
            <Button size="sm">Practice now</Button>
          </Link>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Solved / Total */}
          <Card className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TargetIcon className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Progress</span>
            </div>
            <p className="text-3xl font-bold font-mono">
              {overview.solvedQuestions}
              <span className="text-base font-normal text-muted-foreground">/{overview.totalQuestions}</span>
            </p>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="progress-gradient h-1.5 transition-all"
                style={{ width: `${overview.totalQuestions > 0 ? (overview.solvedQuestions / overview.totalQuestions) * 100 : 0}%` }}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">questions solved (90+)</p>
          </Card>

          {/* Avg Score */}
          <Card className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3Icon className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Avg Score</span>
            </div>
            <p className="text-3xl font-bold font-mono">{overview.avgScore ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">out of 100</p>
          </Card>

          {/* Streak */}
          <Card className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FlameIcon className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Streak</span>
            </div>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-bold font-mono">{overview.streak}</p>
              <span className="text-sm text-muted-foreground">day{overview.streak !== 1 ? "s" : ""}</span>
            </div>
            {overview.streak > 0 && (
              <div className="flex gap-0.5">
                {Array.from({ length: Math.min(overview.streak, 7) }).map((_, i) => (
                  <div key={i} className="size-2 rounded-full bg-primary" />
                ))}
                {overview.streak < 7 &&
                  Array.from({ length: 7 - overview.streak }).map((_, i) => (
                    <div key={`e-${i}`} className="size-2 rounded-full bg-muted" />
                  ))}
              </div>
            )}
          </Card>

          {/* Best Score */}
          <Card className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrophyIcon className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Best Score</span>
            </div>
            <p className="text-3xl font-bold font-mono">
              {categoryStats.length > 0
                ? Math.max(...categoryStats.map((c) => c.bestScore ?? 0))
                : "—"}
            </p>
            <p className="text-[10px] text-muted-foreground">personal record</p>
          </Card>
        </div>

        {/* Radar + Next Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Radar */}
          <Card className="p-6 lg:col-span-3">
            <h2 className="text-sm font-semibold tracking-tight mb-4">Category Strengths</h2>
            {categoryStats.length > 0 ? (
              <CategoryRadarChart data={categoryStats} />
            ) : (
              <div className="h-[280px] flex flex-col items-center justify-center gap-3 text-center">
                <TargetIcon className="size-8 text-muted-foreground/30" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">No data yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Practice different categories to see your strengths</p>
                </div>
              </div>
            )}
          </Card>

          {/* Next Steps */}
          <Card className="p-6 lg:col-span-2 space-y-5">
            <h2 className="text-sm font-semibold tracking-tight">Next Steps</h2>

            {weakestCategory && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`size-7 rounded-md flex items-center justify-center ${CATEGORY_ACCENT[weakestCategory.category] ?? "bg-primary/10 text-primary"}`}>
                    {CATEGORY_ICONS[weakestCategory.category]}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Weakest area</p>
                    <p className="text-sm font-medium">{CATEGORY_LABELS[weakestCategory.category]}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Average score: <span className="font-mono font-bold text-foreground">{weakestCategory.avgScore}</span>
                </p>
                <Link href={`/practice/${weakestCategory.category}`}>
                  <Button size="sm" variant="outline" className="w-full mt-1">
                    Practice {CATEGORY_LABELS[weakestCategory.category]}
                    <ArrowRightIcon className="size-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            )}

            {overview.streak > 0 ? (
              <div className="rounded-lg bg-primary/5 border border-primary/10 p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <FlameIcon className="size-4 text-primary" />
                  <p className="text-sm font-medium">{overview.streak}-day streak!</p>
                </div>
                <p className="text-xs text-muted-foreground">Keep it going — practice today to maintain your streak.</p>
              </div>
            ) : (
              <div className="rounded-lg bg-muted/50 border border-border p-4 space-y-1">
                <div className="flex items-center gap-2">
                  <SparklesIcon className="size-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Start a streak</p>
                </div>
                <p className="text-xs text-muted-foreground">Practice today to begin building a streak.</p>
              </div>
            )}

            {!weakestCategory && categoryStats.length === 0 && (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Complete your first session to get personalized recommendations.</p>
                <Link href="/practice">
                  <Button size="sm" className="mt-3">
                    Start practicing
                    <ArrowRightIcon className="size-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>

        {/* Category Cards */}
        <div>
          <h2 className="text-sm font-semibold tracking-tight mb-4">Categories</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {allCategories.map((cat) => {
              const stat = categoryStats.find((s) => s.category === cat);
              const accent = CATEGORY_ACCENT[cat] ?? "bg-primary/10 text-primary";
              return (
                <Link key={cat} href={`/dashboard/${cat}`}>
                  <Card className="p-4 space-y-3 hover:border-primary/30 transition-colors group cursor-pointer h-full">
                    <div className="flex items-center gap-2">
                      <div className={`size-8 rounded-md flex items-center justify-center ${accent}`}>
                        {CATEGORY_ICONS[cat]}
                      </div>
                      <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors">
                        {CATEGORY_LABELS[cat]}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className={`text-2xl font-bold font-mono ${stat?.avgScore != null ? "" : "text-muted-foreground/40"}`}>
                        {stat?.avgScore ?? "—"}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {stat?.sessionCount
                          ? `${stat.sessionCount} session${stat.sessionCount !== 1 ? "s" : ""}`
                          : "Not started"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                        Detail →
                      </span>
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold tracking-tight">Recent Activity</h2>
            <Link href="/history" className="text-xs text-muted-foreground hover:text-primary transition-colors">
              View all →
            </Link>
          </div>
          {recentSessions.length > 0 ? (
            <div className="space-y-1">
              {recentSessions.slice(0, 5).map((s) => {
                const accent = CATEGORY_ACCENT[s.category] ?? "bg-primary/10 text-primary";
                return (
                  <Link
                    key={s.sessionId}
                    href={`/practice/session/${s.sessionId}`}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-accent/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`size-7 rounded-md flex items-center justify-center shrink-0 ${accent}`}>
                        {CATEGORY_ICONS[s.category]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm truncate group-hover:text-primary transition-colors">
                          {s.questionTitle}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {CATEGORY_LABELS[s.category]} · {s.type.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      {s.score != null ? (
                        <span className={`text-sm font-mono font-bold ${
                          s.score >= 80 ? "text-diff-add-fg" : s.score >= 50 ? "text-yellow-500" : "text-diff-remove-fg"
                        }`}>
                          {s.score}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                      <span className="text-[10px] text-muted-foreground w-14 text-right">
                        {relativeTime(s.date)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No sessions yet.{" "}
              <Link href="/practice" className="text-primary hover:underline">
                Start practicing
              </Link>
            </p>
          )}
        </Card>
      </main>
    </div>
  );
}
