"use client";

import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { UserIcon, LogOutIcon, ArrowRightIcon, BarChart3Icon } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function UserButton() {
  const { data: session, isPending } = useSession();
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isPending) {
    return (
      <div className="size-8 rounded-full bg-muted animate-pulse" />
    );
  }

  if (!session?.user) {
    return (
      <Link href="/sign-in">
        <Button size="sm" variant="outline">
          Sign in
          <ArrowRightIcon className="size-3.5 ml-1" />
        </Button>
      </Link>
    );
  }

  const user = session.user;
  const initials = (user.name ?? user.email ?? "U")
    .split(" ")
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium hover:opacity-90 transition-opacity overflow-hidden"
      >
        {user.image && !imgError ? (
          <img
            src={user.image}
            alt={user.name ?? ""}
            className="size-8 rounded-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-56 rounded-md border border-border bg-popover p-1 shadow-md z-50">
          <div className="px-3 py-2 border-b border-border mb-1">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <BarChart3Icon className="size-3.5" />
            Dashboard
          </Link>
          <button
            onClick={async () => {
              await signOut();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <LogOutIcon className="size-3.5" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
