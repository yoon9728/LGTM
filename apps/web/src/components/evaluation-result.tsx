"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  CheckIcon,
  XIcon,
  ArrowRightIcon,
  CircleDotIcon,
  CircleIcon,
  ChevronDownIcon,
} from "lucide-react";
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

function scoreLabel(score: number, band: string) {
  if (score === 100) return "LGTM";
  if (score === 0) return "Not scored";
  if (band === "high") return "Strong";
  if (band === "mid") return "Developing";
  return "Needs work";
}

const isLgtm = (score: number) => score === 100;

export function EvaluationResult({ evaluation }: EvaluationResultProps) {
  const score = evaluation.score ?? 0;
  const band = scoreBand(score);
  const [criteriaOpen, setCriteriaOpen] = useState(false);

  const coveredCount = evaluation.criteriaResults?.filter(
    (cr) => cr.coverage === "covered"
  ).length ?? 0;
  const totalCriteria = evaluation.criteriaResults?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Score */}
      <div className="space-y-4">
        {isLgtm(score) ? (
          <div className="text-center py-4 space-y-2">
            <p className="text-5xl font-black tracking-tight text-primary font-mono">
              LGTM
            </p>
            <p className="text-sm text-muted-foreground">
              Perfect score — nothing to improve
            </p>
            <Progress value={100} className="h-1.5" />
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-3">
              <span
                className={cn(
                  "text-5xl font-bold tracking-tight font-mono",
                  band === "high" && "text-primary",
                  band === "mid" && "text-foreground",
                  band === "low" && score === 0 ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {score}
              </span>
              <span className="text-lg text-muted-foreground">/ 100</span>
              <span
                className={cn(
                  "text-xs font-medium px-2 py-0.5 rounded-full ml-1",
                  band === "high" && "bg-primary/10 text-primary",
                  band === "mid" && "bg-foreground/10 text-foreground",
                  band === "low" && score === 0
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {scoreLabel(score, band)}
              </span>
            </div>
            <Progress
              value={score}
              className={cn("h-1.5", score === 0 && "[&>div]:bg-destructive")}
            />
          </>
        )}
      </div>

      {/* Reason */}
      {(evaluation.reason || evaluation.rationale) && (
        <blockquote
          className={cn(
            "border-l-2 pl-4 text-sm leading-relaxed",
            score === 0
              ? "border-destructive/50 text-destructive/80 bg-destructive/5 py-3 pr-4 rounded-r-lg"
              : "border-primary text-muted-foreground italic"
          )}
        >
          {evaluation.reason || evaluation.rationale}
        </blockquote>
      )}

      {/* Criteria Coverage — collapsible */}
      {totalCriteria > 0 && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <button
                type="button"
                className="flex items-center justify-between w-full text-left"
                onClick={() => setCriteriaOpen(!criteriaOpen)}
              >
                <CardTitle className="text-sm font-medium tracking-wide uppercase text-muted-foreground">
                  Criteria Coverage
                  <span className="ml-2 text-xs font-mono normal-case">
                    {coveredCount}/{totalCriteria} covered
                  </span>
                </CardTitle>
                <ChevronDownIcon
                  className={cn(
                    "size-4 text-muted-foreground transition-transform",
                    criteriaOpen && "rotate-180"
                  )}
                />
              </button>
            </CardHeader>
            {criteriaOpen && (
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
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-foreground">
                              {cr.criterion}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded",
                                cr.coverage === "covered" && "bg-diff-add/15 text-diff-add-fg",
                                cr.coverage === "partial" && "bg-muted text-muted-foreground",
                                cr.coverage === "missing" && "bg-diff-remove/15 text-diff-remove-fg"
                              )}
                            >
                              {cr.coverage}
                            </span>
                          </div>
                          {cr.evidence && (
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                              {cr.evidence}
                            </p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>
          <Separator />
        </>
      )}

      {!totalCriteria && <Separator />}

      {/* Strengths & Weaknesses — balanced height */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium tracking-wide uppercase">
              <CheckIcon className="size-4 text-primary" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5 max-h-48 overflow-y-auto">
              {evaluation.strengths.length > 0 ? (
                evaluation.strengths.map((s, i) => (
                  <li key={i} className="text-sm leading-relaxed text-foreground">
                    {s}
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground italic">
                  No strengths identified
                </li>
              )}
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
            <ul className="space-y-2.5 max-h-48 overflow-y-auto">
              {evaluation.weaknesses.length > 0 ? (
                evaluation.weaknesses.map((w, i) => (
                  <li key={i} className="text-sm leading-relaxed text-foreground">
                    {w}
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted-foreground italic">
                  No weaknesses identified
                </li>
              )}
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
