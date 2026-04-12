"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession } from "@/lib/auth-client";
import { api, type UserStats } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserButton } from "@/components/user-button";
import {
  ArrowLeftIcon,
  FlameIcon,
  TrophyIcon,
  TargetIcon,
  BarChart3Icon,
} from "lucide-react";

const ScoreLineChart = dynamic(
  () =>
    import("@/components/charts/score-line-chart").then(
      (m) => m.ScoreLineChart
    ),
  { ssr: false }
);

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
      // If unauthorized, redirect
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!stats) return null;

  const { overview, categoryStats, scoreTrend, recentSessions } = stats;

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Nav */}
      <nav className="border-b border-border">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <Link href="/">
              <span className="text-sm font-bold tracking-[0.12em] font-mono">
                LGTM
              </span>
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-sm font-medium text-muted-foreground">
              Dashboard
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserButton />
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto px-6 py-8 w-full space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Growth Dashboard
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your progress across all practice types
            </p>
          </div>
          <Link href="/practice">
            <Button size="sm">
              Practice now
            </Button>
          </Link>
        </div>

        {/* Overview cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TargetIcon className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                Sessions
              </span>
            </div>
            <p className="text-3xl font-bold font-mono">
              {overview.completedSessions}
            </p>
            <p className="text-xs text-muted-foreground">
              of {overview.totalSessions} started
            </p>
          </Card>

          <Card className="p-5 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3Icon className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                Avg Score
              </span>
            </div>
            <p className="text-3xl font-bold font-mono">
              {overview.avgScore ?? "—"}
            </p>
            <p className="text-xs text-muted-foreground">out of 100</p>
          </Card>

          <Card className="p-5 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FlameIcon className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                Streak
              </span>
            </div>
            <p className="text-3xl font-bold font-mono">{overview.streak}</p>
            <p className="text-xs text-muted-foreground">
              consecutive day{overview.streak !== 1 ? "s" : ""}
            </p>
          </Card>

          <Card className="p-5 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrophyIcon className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">
                Best Score
              </span>
            </div>
            <p className="text-3xl font-bold font-mono">
              {categoryStats.length > 0
                ? Math.max(
                    ...categoryStats
                      .map((c) => c.bestScore ?? 0)
                  )
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground">personal record</p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Trend */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold tracking-tight mb-4">
              Score Trend
            </h2>
            {scoreTrend.length > 0 ? (
              <ScoreLineChart data={scoreTrend} />
            ) : (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                Complete some sessions to see your trend
              </div>
            )}
          </Card>

          {/* Category Radar */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold tracking-tight mb-4">
              Category Strengths
            </h2>
            {categoryStats.length > 0 ? (
              <CategoryRadarChart data={categoryStats} />
            ) : (
              <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
                Practice different categories to see your profile
              </div>
            )}
          </Card>
        </div>

        {/* Category breakdown */}
        <Card className="p-6">
          <h2 className="text-sm font-semibold tracking-tight mb-4">
            Category Breakdown
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              "code_review",
              "system_design",
              "debugging",
              "data_analysis",
              "practical_coding",
            ].map((cat) => {
              const stat = categoryStats.find((s) => s.category === cat);
              return (
                <div
                  key={cat}
                  className="p-4 rounded-lg border border-border bg-card/50 space-y-2"
                >
                  <p className="text-xs font-medium text-muted-foreground">
                    {CATEGORY_LABELS[cat]}
                  </p>
                  <p className="text-2xl font-bold font-mono">
                    {stat?.avgScore ?? "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {stat?.sessionCount ?? 0} session
                    {(stat?.sessionCount ?? 0) !== 1 ? "s" : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent sessions */}
        <Card className="p-6">
          <h2 className="text-sm font-semibold tracking-tight mb-4">
            Recent Sessions
          </h2>
          {recentSessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 font-medium text-muted-foreground">
                      Question
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground">
                      Category
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground">
                      Score
                    </th>
                    <th className="pb-2 font-medium text-muted-foreground">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentSessions.map((s) => (
                    <tr
                      key={s.sessionId}
                      className="border-b border-border/50 hover:bg-card/50 transition-colors"
                    >
                      <td className="py-3 pr-4">
                        <Link
                          href={`/practice/session/${s.sessionId}`}
                          className="text-foreground hover:text-primary transition-colors"
                        >
                          {s.questionTitle}
                        </Link>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          {CATEGORY_LABELS[s.category] ?? s.category}
                        </span>
                      </td>
                      <td className="py-3 pr-4 font-mono font-medium">
                        {s.score != null ? (
                          <span
                            className={
                              s.score >= 80
                                ? "text-diff-add-fg"
                                : s.score >= 50
                                  ? "text-yellow-500"
                                  : "text-diff-remove-fg"
                            }
                          >
                            {s.score}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(s.date).toLocaleDateString("ko-KR", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

        {/* Back link */}
        <Link
          href="/practice"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back to practice
        </Link>
      </main>
    </div>
  );
}
