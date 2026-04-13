"use client";

/**
 * Trendy loading spinner — three dots with staggered bounce animation.
 * Use <LoadingPage /> for full-page loading states.
 * Use <LoadingDots /> inline where needed.
 */

export function LoadingDots({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 ${className ?? ""}`}>
      <span className="size-1.5 rounded-full bg-primary animate-[loading-dot_1.4s_ease-in-out_infinite]" />
      <span className="size-1.5 rounded-full bg-primary animate-[loading-dot_1.4s_ease-in-out_0.2s_infinite]" />
      <span className="size-1.5 rounded-full bg-primary animate-[loading-dot_1.4s_ease-in-out_0.4s_infinite]" />
    </span>
  );
}

export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dotSize = size === "sm" ? "size-1.5" : size === "lg" ? "size-3" : "size-2";
  const gap = size === "sm" ? "gap-1" : size === "lg" ? "gap-2" : "gap-1.5";

  return (
    <div className={`flex items-center ${gap}`}>
      <div className={`${dotSize} rounded-full bg-primary animate-[loading-dot_1.4s_ease-in-out_infinite]`} />
      <div className={`${dotSize} rounded-full bg-primary animate-[loading-dot_1.4s_ease-in-out_0.2s_infinite]`} />
      <div className={`${dotSize} rounded-full bg-primary animate-[loading-dot_1.4s_ease-in-out_0.4s_infinite]`} />
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh gap-4">
      <LoadingSpinner size="lg" />
    </div>
  );
}
