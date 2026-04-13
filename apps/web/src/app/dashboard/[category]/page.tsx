"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useSession } from "@/lib/auth-client";
import { api, type CategoryDetail } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserButton } from "@/components/user-button";
import { MobileNav } from "@/components/mobile-nav";
import { LoadingSpinner } from "@/components/loading-spinner";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BarChart3Icon,
  TargetIcon,
  TrophyIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "lucide-react";

const ScoreLineChart = dynamic(
  () =>
    import("@/components/charts/score-line-chart").then(
      (m) => m.ScoreLineChart
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

const TYPE_LABELS: Record<string, string> = {
  // Code Review
  security_review: "Security Review",
  performance_review: "Performance Review",
  logic_review: "Logic Review",
  api_review: "API Review",
  // System Design
  scalability: "Scalability",
  database_design: "Database Design",
  api_architecture: "API Architecture",
  system_architecture: "System Architecture",
  // Debugging
  runtime_error: "Runtime Error",
  logic_error: "Logic Error",
  memory_issue: "Memory Issue",
  concurrency: "Concurrency",
  performance_bug: "Performance Bug",
  // Data Analysis
  sql_query: "SQL Query",
  data_pipeline: "Data Pipeline",
  data_modeling: "Data Modeling",
  statistical_analysis: "Statistical Analysis",
  // Practical Coding
  implementation: "Implementation",
  optimization: "Optimization",
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

export default function CategoryDetailPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = use(params);
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [data, setData] = useState<CategoryDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPending) return;
    if (!session?.user) {
      router.push("/sign-in");
      return;
    }
    api.getCategoryStats(category)
      .then((res) => setData(res))
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false));
  }, [session, isPending, category, router]);

  if (isPending || loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data) return null;

  const { overview, scoreTrend, subtopicStats, criteriaInsights, sessions } = data;
  const label = CATEGORY_LABELS[category] ?? category;

  // Transform scoreTrend for the chart component (needs 'category' field)
  const chartData = scoreTrend.map((p) => ({
    sessionId: p.sessionId,
    category,
    score: p.score,
    date: p.date,
  }));

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
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
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
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="size-8 rounded-md border border-border flex items-center justify-center hover:bg-accent transition-colors"
          >
            <ArrowLeftIcon className="size-3.5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{label}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Detailed performance breakdown
            </p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-5 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <BarChart3Icon className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Avg Score</span>
            </div>
            <p className="text-3xl font-bold font-mono">{overview.avgScore ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">across {overview.completedCount} session{overview.completedCount !== 1 ? "s" : ""}</p>
          </Card>

          <Card className="p-5 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TargetIcon className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Solved</span>
            </div>
            <p className="text-3xl font-bold font-mono">
              {overview.solvedQuestions}
              <span className="text-base font-normal text-muted-foreground">/{overview.totalQuestions}</span>
            </p>
            <div className="w-full bg-muted rounded-full h-1.5 mt-1">
              <div
                className="progress-gradient h-1.5 transition-all"
                style={{ width: `${overview.totalQuestions > 0 ? (overview.solvedQuestions / overview.totalQuestions) * 100 : 0}%` }}
              />
            </div>
          </Card>

          <Card className="p-5 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TrophyIcon className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Best Score</span>
            </div>
            <p className="text-3xl font-bold font-mono">{overview.bestScore ?? "—"}</p>
            <p className="text-[10px] text-muted-foreground">personal record</p>
          </Card>

          <Card className="p-5 space-y-1">
            <div className="flex items-center gap-2 text-muted-foreground">
              <TargetIcon className="size-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Sessions</span>
            </div>
            <p className="text-3xl font-bold font-mono">{overview.sessionCount}</p>
            <p className="text-[10px] text-muted-foreground">{overview.completedCount} completed</p>
          </Card>
        </div>

        {/* Score Trend */}
        <Card className="p-6">
          <h2 className="text-sm font-semibold tracking-tight mb-4">Score Trend</h2>
          {chartData.length > 0 ? (
            <ScoreLineChart data={chartData} />
          ) : (
            <div className="h-[280px] flex flex-col items-center justify-center gap-3 text-center">
              <BarChart3Icon className="size-8 text-muted-foreground/30" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">No scores yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Complete a session to see your score trend</p>
              </div>
            </div>
          )}
        </Card>

        {/* Sub-topics + Criteria Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sub-topic Breakdown */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold tracking-tight mb-4">Sub-topics</h2>
            {subtopicStats.length > 0 ? (
              <div className="space-y-4">
                {subtopicStats.map((st) => {
                  const solvedCount = st.bestScore != null && st.bestScore >= 90 ? 1 : 0;
                  return (
                    <div key={st.type} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{TYPE_LABELS[st.type] ?? st.type.replace(/_/g, " ")}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-mono font-bold ${
                            st.avgScore != null ? (st.avgScore >= 80 ? "text-diff-add-fg" : st.avgScore >= 50 ? "text-foreground" : "text-diff-remove-fg") : "text-muted-foreground/40"
                          }`}>
                            {st.avgScore ?? "—"}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {st.sessionCount}/{st.totalQuestions}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="progress-gradient h-1.5 transition-all rounded-full"
                          style={{ width: `${st.avgScore ?? 0}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No sessions in this category yet.
              </p>
            )}
          </Card>

          {/* Criteria Insights */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold tracking-tight mb-4">Criteria Insights</h2>
            {criteriaInsights.mostCovered.length > 0 || criteriaInsights.mostMissed.length > 0 ? (
              <div className="space-y-6">
                {/* Most Covered */}
                {criteriaInsights.mostCovered.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-1.5">
                      <CheckCircleIcon className="size-3.5 text-diff-add-fg" />
                      Strengths
                    </p>
                    <div className="space-y-1.5">
                      {criteriaInsights.mostCovered.map((c) => (
                        <div key={c.label} className="flex items-start justify-between gap-2">
                          <p className="text-sm text-foreground leading-snug">{c.label}</p>
                          <span className="text-[10px] font-mono text-diff-add-fg shrink-0">
                            {c.covered}/{c.total}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {criteriaInsights.mostCovered.length > 0 && criteriaInsights.mostMissed.length > 0 && (
                  <Separator />
                )}

                {/* Most Missed */}
                {criteriaInsights.mostMissed.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-1.5">
                      <XCircleIcon className="size-3.5 text-diff-remove-fg" />
                      Areas to improve
                    </p>
                    <div className="space-y-1.5">
                      {criteriaInsights.mostMissed.map((c) => (
                        <div key={c.label} className="flex items-start justify-between gap-2">
                          <p className="text-sm text-foreground leading-snug">{c.label}</p>
                          <span className="text-[10px] font-mono text-diff-remove-fg shrink-0">
                            {c.covered}/{c.total}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                Complete more sessions to get criteria insights.
              </p>
            )}
          </Card>
        </div>

        {/* All Sessions */}
        <Card className="p-6">
          <h2 className="text-sm font-semibold tracking-tight mb-4">All Sessions</h2>
          {sessions.length > 0 ? (
            <div className="space-y-1">
              {sessions.map((s, i) => (
                <Link
                  key={`${s.sessionId}-${i}`}
                  href={`/practice/session/${s.sessionId}`}
                  className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-accent/50 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-sm truncate group-hover:text-primary transition-colors">
                      {s.questionTitle}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {TYPE_LABELS[s.type] ?? s.type.replace(/_/g, " ")}
                    </p>
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
                    <span className="text-[10px] text-muted-foreground w-16 text-right">
                      {relativeTime(s.date)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No sessions yet.
            </p>
          )}
        </Card>

        {/* CTA */}
        <div className="flex gap-3">
          <Link href={`/practice/${category}`}>
            <Button>
              Practice {label}
              <ArrowRightIcon className="size-3.5 ml-1.5" />
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">
              <ArrowLeftIcon className="size-3.5 mr-1.5" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
