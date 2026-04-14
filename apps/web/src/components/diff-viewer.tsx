"use client";

import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";

interface DiffViewerProps {
  diff: string;
  filename?: string;
}

function parseDiffLine(line: string) {
  if (line.startsWith("@@")) return { type: "meta" as const, text: line };
  if (line.startsWith("+")) return { type: "add" as const, text: line };
  if (line.startsWith("-")) return { type: "remove" as const, text: line };
  return { type: "neutral" as const, text: line };
}

export const DiffViewer = memo(function DiffViewer({ diff, filename }: DiffViewerProps) {
  const lines = useMemo(() => diff.split("\n").map(parseDiffLine), [diff]);

  let addCount = 0;
  let removeCount = 0;
  for (const line of lines) {
    if (line.type === "add") addCount++;
    if (line.type === "remove") removeCount++;
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-card border-b border-border">
        <div className="flex items-center gap-2 text-sm font-mono">
          <span className="text-muted-foreground">diff</span>
          {filename && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-foreground">{filename}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="text-diff-add-fg">+{addCount}</span>
          <span className="text-diff-remove-fg">−{removeCount}</span>
        </div>
      </div>

      {/* Code */}
      <div className="overflow-x-auto bg-[oklch(0.97_0_0)] dark:bg-[oklch(0.13_0_0)]">
        {lines.map((line, i) => (
          <div
            key={i}
            className={cn(
              "flex text-sm font-mono leading-7 hover:bg-white/[0.02] transition-colors",
              line.type === "add" && "bg-diff-add/10 hover:bg-diff-add/15",
              line.type === "remove" &&
                "bg-diff-remove/10 hover:bg-diff-remove/15",
              line.type === "meta" && "bg-card/50"
            )}
          >
            <span className="w-12 shrink-0 text-right pr-3 text-xs text-muted-foreground/40 select-none leading-7 border-r border-border">
              {i + 1}
            </span>
            <code
              className={cn(
                "flex-1 px-4 whitespace-pre-wrap break-all md:whitespace-pre md:break-normal",
                line.type === "add" && "text-diff-add-fg",
                line.type === "remove" && "text-diff-remove-fg",
                line.type === "meta" && "text-diff-meta",
                line.type === "neutral" && "text-muted-foreground"
              )}
            >
              {line.text}
            </code>
          </div>
        ))}
      </div>
    </div>
  );
});
