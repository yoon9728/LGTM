"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserButton } from "@/components/user-button";
import { MobileNav } from "@/components/mobile-nav";
import { warmUpApi } from "@/lib/api";
import {
  ArrowRightIcon,
  BrainCircuitIcon,
  TargetIcon,
  CodeIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  LayoutDashboardIcon,
  TableIcon,
  TerminalIcon,
  SearchIcon,
} from "lucide-react";

const ParticleMesh = dynamic(
  () => import("@/components/particle-mesh").then((m) => m.ParticleMesh),
  { ssr: false }
);

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const children = el.querySelectorAll(".scroll-reveal");
    if (children.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            const target = entry.target as HTMLElement;
            setTimeout(() => {
              target.classList.add("revealed");
            }, i * 80);
            observer.unobserve(target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    children.forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, []);
  return ref;
}

const scenarioCards = [
  {
    icon: CodeIcon,
    label: "Code Review",
    desc: "Read a diff, find the bugs, explain the risk",
    tag: "LIVE",
    href: "/practice/code_review",
  },
  {
    icon: LayoutDashboardIcon,
    label: "System Design",
    desc: "Architect a system, defend your tradeoffs",
    tag: "LIVE",
    href: "/practice/system_design",
  },
  {
    icon: TerminalIcon,
    label: "Debugging",
    desc: "Read logs, trace the root cause, propose a fix",
    tag: "LIVE",
    href: "/practice/debugging",
  },
  {
    icon: TableIcon,
    label: "Data Analysis",
    desc: "SQL queries, pipelines, dimensional modeling",
    tag: "LIVE",
    href: "/practice/data_analysis",
  },
  {
    icon: SearchIcon,
    label: "Practical Coding",
    desc: "Implement real systems in Python, Java, Rust, Go, and more",
    tag: "LIVE",
    href: "/practice/practical_coding",
  },
  {
    icon: BrainCircuitIcon,
    label: "More coming",
    desc: "Excel, PowerBI, incident response, capacity planning",
    tag: "",
    href: "",
  },
];

const howItWorks = [
  {
    step: "01",
    icon: TargetIcon,
    title: "Get a scenario",
    desc: "A real-world problem — a diff to review, a system to design, data to analyze. The kind of work you'd do on the job.",
  },
  {
    step: "02",
    icon: CodeIcon,
    title: "Write your analysis",
    desc: "No multiple choice. Explain your reasoning, identify risks, propose solutions. Write it like a senior would.",
  },
  {
    step: "03",
    icon: BrainCircuitIcon,
    title: "Get AI evaluation",
    desc: "Scored against expert rubrics with criterion-level coverage. See what you caught, what you missed, and what to practice next.",
  },
];

const skills = [
  {
    icon: ShieldCheckIcon,
    label: "Risk identification",
    detail: "Security holes, data leaks, failure modes, scaling bottlenecks",
  },
  {
    icon: TargetIcon,
    label: "Root cause analysis",
    detail: "Finding the real problem, not just the symptom",
  },
  {
    icon: TrendingUpIcon,
    label: "Tradeoff reasoning",
    detail: "Weighing options, explaining why one approach beats another",
  },
  {
    icon: BrainCircuitIcon,
    label: "Clear communication",
    detail:
      "Structured findings, actionable recommendations, evidence-based",
  },
];

export default function LandingPage() {
  const scenarioRef = useScrollReveal();
  const howRef = useScrollReveal();
  const skillsRef = useScrollReveal();
  const evalRef = useScrollReveal();

  // Wake up API server on landing page load (mitigates Render free-tier cold start)
  useEffect(() => { warmUpApi(); }, []);

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold tracking-[0.12em] font-mono">
              LGTM
            </span>
            <span className="text-[10px] text-muted-foreground font-mono tracking-wide border border-border rounded px-1.5 py-0.5">
              BETA
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <UserButton />
            <Link href="/practice" className="hidden md:inline-flex">
              <Button size="sm">
                Start practicing
                <ArrowRightIcon className="size-3.5 ml-1" />
              </Button>
            </Link>
            <MobileNav />
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex-1 flex items-center overflow-hidden min-h-[100dvh] noise-overlay radial-depth">
        <ParticleMesh className="absolute inset-0 w-full h-full" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 py-24 sm:py-32 w-full flex flex-col items-center text-center">
          <p className="animate-fade-in-up stagger-1 text-xs font-mono font-medium tracking-widest uppercase text-primary mb-6">
            AI-powered practice platform
          </p>

          <h1
            className="animate-fade-in-up stagger-2 font-bold tracking-tight leading-[1.05]"
            style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)" }}
          >
            Stop reading AI code.
          </h1>

          <h1
            className="animate-fade-in-up stagger-3 font-bold tracking-tight leading-[1.05] mt-2"
            style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)" }}
          >
            Start{" "}
            <span className="gradient-text">leading</span> it.
          </h1>

          <p className="animate-fade-in-up stagger-3 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl mt-8">
            Practice code review, system design, and debugging with real
            scenarios — scored by expert rubrics, not vibes.
          </p>

          <div className="animate-fade-in-up stagger-4 flex flex-col sm:flex-row items-center gap-4 mt-10">
            <Link href="/practice">
              <Button size="lg" className="btn-glow text-sm h-12 px-6 cursor-pointer">
                Start a session
                <ArrowRightIcon className="size-4 ml-2" />
              </Button>
            </Link>
            <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
              <span>~10 min</span>
              <span className="size-1 rounded-full bg-border" />
              <span>AI-graded</span>
              <span className="size-1 rounded-full bg-border" />
              <span>No signup</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem types + How it works — combined denser section */}
      <section className="bg-card/30 border-y border-border/30" ref={scenarioRef}>
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <p className="scroll-reveal text-xs font-mono font-medium tracking-widest uppercase text-muted-foreground">
              Multi-domain scenarios
            </p>
            <p className="scroll-reveal text-xs text-muted-foreground">
              5 categories · 52 questions
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scenarioCards.map((item) => {
              const inner = (
                <div
                  className="scroll-reveal card-glow group flex items-start gap-4 p-5 rounded-xl cursor-pointer"
                >
                  <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <item.icon className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {item.label}
                      </p>
                      {item.tag && (
                        <span
                          className={`text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded ${
                            item.tag === "LIVE"
                              ? "bg-diff-add/15 text-diff-add-fg"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {item.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
              return item.href ? (
                <Link key={item.label} href={item.href}>{inner}</Link>
              ) : (
                <div key={item.label}>{inner}</div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works — tighter layout */}
      <section ref={howRef}>
        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="scroll-reveal text-xs font-mono font-medium tracking-widest uppercase text-muted-foreground mb-8">
            How it works
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {howItWorks.map((s) => (
              <div
                key={s.step}
                className="scroll-reveal card-glow group space-y-3 p-5 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-mono font-bold text-primary/60">
                    {s.step}
                  </span>
                  <s.icon className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <h3 className="text-base font-semibold tracking-tight">
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you practice + Evaluation preview — combined */}
      <section className="bg-card/30 border-y border-border/30" ref={skillsRef}>
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6 scroll-reveal">
              <p className="text-xs font-mono font-medium tracking-widest uppercase text-muted-foreground">
                What you build
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                The judgment that
                <br />
                separates senior from junior.
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Not memorization. Not syntax. The ability to read a situation,
                identify what matters, and explain why — across any domain.
              </p>
            </div>
            <div className="space-y-3">
              {skills.map((item) => (
                <div
                  key={item.label}
                  className="scroll-reveal card-glow flex items-start gap-4 p-4 rounded-lg"
                >
                  <item.icon className="size-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Evaluation preview */}
      <section ref={evalRef}>
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center space-y-4 mb-10 scroll-reveal">
            <p className="text-xs font-mono font-medium tracking-widest uppercase text-muted-foreground">
              Not just a score
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Feedback that makes you better.
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              Every evaluation breaks down what you caught, what you missed,
              and gives you a concrete next step. No black-box grades.
            </p>
          </div>
          {/* Fake evaluation card */}
          <div className="scroll-reveal max-w-2xl mx-auto rounded-xl overflow-hidden card-glow">
            <div className="p-6 border-b border-border/50">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold font-mono text-primary">
                  72
                </span>
                <span className="text-sm text-muted-foreground">/ 100</span>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: "72%" }}
                />
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-mono font-semibold tracking-wide uppercase text-muted-foreground">
                  Criteria
                </p>
                {[
                  { label: "Identified the core risk", status: "covered" },
                  { label: "Explained downstream impact", status: "covered" },
                  {
                    label: "Proposed mitigation strategy",
                    status: "missing",
                  },
                ].map((c) => (
                  <div key={c.label} className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        c.status === "covered"
                          ? "bg-diff-add/15 text-diff-add-fg"
                          : "bg-diff-remove/15 text-diff-remove-fg"
                      }`}
                    >
                      {c.status}
                    </span>
                    <span className="text-sm text-foreground">{c.label}</span>
                  </div>
                ))}
              </div>
              <Separator />
              <div className="text-sm text-muted-foreground leading-relaxed italic">
                &ldquo;Strong analysis of the risk and its blast radius. To
                push past 80, include a concrete mitigation plan — what
                specifically should change and why.&rdquo;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-card/30 border-t border-border/30">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Ready to practice?
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            No account needed. Pick up a scenario, write your analysis, and
            see how you score. Takes about 10 minutes.
          </p>
          <Link href="/practice">
            <Button size="lg" className="btn-glow text-sm h-12 px-6 mt-2 cursor-pointer">
              Start your first session
              <ArrowRightIcon className="size-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-mono font-bold">LGTM</span>
            <span className="size-1 rounded-full bg-border" />
            <span>&copy; 2026</span>
          </div>
          <p className="text-xs text-muted-foreground">
            AI-powered practice platform
          </p>
        </div>
      </footer>
    </div>
  );
}
