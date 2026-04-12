"use client";

import { cn } from "@/lib/utils";

const STEPS = ["Diff", "Analysis", "Result"] as const;

interface StepperProps {
  current: number;
}

export function Stepper({ current }: StepperProps) {
  return (
    <div className="flex items-center gap-3">
      {STEPS.map((label, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isDone = step < current;

        return (
          <div key={label} className="flex items-center gap-3">
            {i > 0 && (
              <div
                className={cn(
                  "h-px w-8 transition-colors",
                  isDone ? "bg-primary/40" : "bg-border"
                )}
              />
            )}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "size-2 rounded-full transition-all",
                  isActive && "bg-primary scale-125 ring-4 ring-primary/10",
                  isDone && "bg-muted-foreground/40",
                  !isActive && !isDone && "bg-border"
                )}
              />
              <span
                className={cn(
                  "text-xs font-medium tracking-wide uppercase font-mono",
                  isActive && "text-foreground",
                  isDone && "text-muted-foreground",
                  !isActive && !isDone && "text-muted-foreground/50"
                )}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
