"use client";

import { useSyncExternalStore } from "react";

/** The server enforces the limit; this is a best-effort, daily UI counter. */
export const GUEST_LIMIT = 4;

// Do not migrate the old lifetime completion count: it has no expiration date.
export const GUEST_STORAGE_KEY = "lgtm_guest_sessions_v1";
const CHANGE_EVENT = "lgtm-guest-usage";
const DAY_MS = 24 * 60 * 60 * 1000;
type GuestUsage = { count: number; resetAt: number };
let memoryUsage: GuestUsage | null = null;

function readUsage(): GuestUsage | null {
  if (typeof window === "undefined") return null;
  let usage = memoryUsage;
  try {
    const stored = window.localStorage.getItem(GUEST_STORAGE_KEY);
    usage = stored ? JSON.parse(stored) : memoryUsage;
  } catch {
    // Restricted storage must not prevent practice or submission.
  }
  if (!usage || !Number.isInteger(usage.count) || usage.count < 0 ||
      !Number.isFinite(usage.resetAt) || usage.resetAt <= Date.now()) return null;
  return usage;
}

export function getGuestSessionCount(): number {
  return readUsage()?.count ?? 0;
}

export function recordGuestSession(): void {
  if (typeof window === "undefined") return;
  const previous = readUsage();
  memoryUsage = {
    count: (previous?.count ?? 0) + 1,
    resetAt: previous?.resetAt ?? Date.now() + DAY_MS,
  };
  try {
    window.localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(memoryUsage));
  } catch {
    // Keep the in-memory count for this tab when persistence is unavailable.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  const timer = window.setInterval(onChange, 60_000);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.clearInterval(timer);
  };
}

export function useGuestSessionCount(): number {
  return useSyncExternalStore(subscribe, getGuestSessionCount, () => 0);
}
