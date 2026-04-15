"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoadingDots } from "@/components/loading-spinner";
import { MailIcon, ArrowRightIcon } from "lucide-react";

const ParticleMesh = dynamic(
  () => import("@/components/particle-mesh").then((m) => m.ParticleMesh),
  { ssr: false },
);

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn.email({ email, password });
      if (result.error) {
        setError(result.error.message ?? "Sign in failed");
      } else {
        router.push("/practice");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    await signIn.social({ provider: "google", callbackURL: `${window.location.origin}/practice` });
  }

  return (
    <div className="min-h-dvh flex">
      {/* Left: Branding panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden bg-background">
        <ParticleMesh className="absolute inset-0 w-full h-full" />
        <div className="relative z-10 max-w-md px-12 space-y-6">
          <Link href="/">
            <span className="text-sm font-bold tracking-[0.16em] font-mono text-foreground hover:text-primary transition-colors">
              LGTM
            </span>
          </Link>
          <h2 className="text-3xl font-bold tracking-tight leading-tight">
            Practice like a senior.
            <br />
            <span className="text-primary">Get evaluated like one.</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Real-world code review, system design, and debugging scenarios — scored against expert rubrics.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono pt-2">
            <span>5 categories</span>
            <span className="size-1 rounded-full bg-border" />
            <span>52 questions</span>
            <span className="size-1 rounded-full bg-border" />
            <span>AI-graded</span>
          </div>
        </div>
      </div>

      {/* Right: Sign In Form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile nav */}
        <nav className="flex items-center justify-between px-6 h-14 lg:px-10">
          <Link href="/" className="lg:hidden">
            <span className="text-sm font-bold tracking-[0.12em] font-mono">LGTM</span>
          </Link>
          <div className="lg:ml-auto">
            <ThemeToggle />
          </div>
        </nav>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm space-y-8">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-sm text-muted-foreground">
                Sign in to continue practicing
              </p>
            </div>

            {/* Google Sign In */}
            <Button
              variant="outline"
              className="w-full h-11 cursor-pointer"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <LoadingDots />
              ) : (
                <>
                  <svg className="size-4 mr-2" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </>
              )}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground">
                  or sign in with email
                </span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium leading-none">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                />
              </div>

              {error && (
                <div className="px-3 py-2 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-11 cursor-pointer" disabled={loading}>
                {loading ? (
                  <LoadingDots />
                ) : (
                  <>
                    Sign in
                    <ArrowRightIcon className="size-3.5 ml-2" />
                  </>
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/sign-up" className="font-medium text-primary hover:underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
