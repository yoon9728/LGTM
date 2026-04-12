"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { CheckIcon, XIcon, ArrowRightIcon, CircleDotIcon, CircleIcon } from "lucide-react";
import type { Evaluation } from "@/lib/api";
import { cn } from "@/lib/utils";

interface EvaluationResultProps {
  evaluation: Evaluation;
}

function scoreBand(score: number) {
  if (score >= 70) return "high";
  if (score >= 40) return "mid";
  return "low";
}

export function EvaluationResult({ evaluation }: EvaluationResultProps) {
  const score = evaluation.score ?? 0;
  const band = scoreBand(score);

  return (
    <div className="space-y-6">
      {/* Score */}
      <div className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span
            className={cn(
              "text-5xl font-bold tracking-tight font-mono",
              band === "high" && "text-primary",
              band === "mid" && "text-foreground",
              band === "low" && "text-muted-foreground"
            )}
          >
            {score}
          </span>
          <span className="text-lg text-muted-foreground">/ 100</span>
        </div>
        <Progress
          value={score}
          className="h-1.5"
        />
      </div>

      {/* Reason */}
      {(evaluation.reason || evaluation.rationale) && (
        <blockquote className="border-l-2 border-primary pl-4 text-muted-foreground italic">
          {evaluation.reason || evaluation.rationale}
        </blockquote>
      )}

      {/* Criteria Coverage */}
      {evaluation.criteriaResults?.length > 0 && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium tracking-wide uppercase text-muted-foreground">
                Criteria Coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {evaluation.criteriaResults.map((cr, i) => (
                  <li key={i} className="space-y-1">
                    <div className="flex items-start gap-2">
                      {cr.coverage === "covered" && (
                        <CheckIcon className="size-4 mt-0.5 shrink-0 text-diff-add-fg" />
                      )}
                      {cr.coverage === "partial" && (
                        <CircleDotIcon className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                      )}
                      {cr.coverage === "missing" && (
                        <CircleIcon className="size-4 mt-0.5 shrink-0 text-diff-remove-fg" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {cr.criterion}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded",
                              cr.coverage === "covered" && "bg-diff-add/15 text-diff-add-fg",
                              cr.coverage === "partial" && "bg-muted text-muted-foreground",
                              cr.coverage === "missing" && "bg-diff-remove/15 text-diff-remove-fg"
                            )}
                          >
                            {cr.coverage}
                          </span>
                        </div>
                        {cr.evidence && (
                          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                            {cr.evidence}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Separator />
        </>
      )}

      {!evaluation.criteriaResults?.length && <Separator />}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium tracking-wide uppercase">
              <CheckIcon className="size-4 text-primary" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {evaluation.strengths.map((s, i) => (
                <li key={i} className="text-sm leading-relaxed text-foreground">
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium tracking-wide uppercase text-muted-foreground">
              <XIcon className="size-4" />
              Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {evaluation.weaknesses.map((w, i) => (
                <li
                  key={i}
                  className="text-sm leading-relaxed text-foreground"
                >
                  {w}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      {evaluation.nextSteps?.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium tracking-wide uppercase text-muted-foreground">
              <ArrowRightIcon className="size-4" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {evaluation.nextSteps.map((step, i) => (
                <li
                  key={i}
                  className="text-sm leading-relaxed text-foreground"
                >
                  {step}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
