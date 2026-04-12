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
import {
  ArrowRightIcon,
  Loader2Icon,
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

export default function HistoryPage() {
  const { data: authSession, isPending } = useSession();
  const router = useRouter();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

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
        <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
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
        </div>
      </header>

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

      {/* History List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2Icon className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <p className="text-muted-foreground">No sessions yet.</p>
          <Link href="/practice">
            <Button>
              Start practicing
              <ArrowRightIcon className="size-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {history.map((entry) => {
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
