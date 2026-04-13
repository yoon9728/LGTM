"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  MenuIcon,
  HomeIcon,
  CodeIcon,
  HistoryIcon,
  BarChart3Icon,
  LogInIcon,
  UserPlusIcon,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/practice", label: "Practice", icon: CodeIcon },
  { href: "/dashboard", label: "Dashboard", icon: BarChart3Icon, auth: true },
  { href: "/history", label: "History", icon: HistoryIcon, auth: true },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="md:hidden inline-flex items-center justify-center size-9 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
      >
        <MenuIcon className="size-4" />
        <span className="sr-only">Menu</span>
      </SheetTrigger>
      <SheetContent side="right" className="w-64 p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="text-sm font-bold tracking-[0.12em] font-mono text-left">
            LGTM
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col py-4">
          {NAV_ITEMS.map((item) => {
            if (item.auth && !isAuthenticated) return null;
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-6 py-3 text-sm transition-colors ${
                  isActive
                    ? "text-primary font-medium bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        {!isAuthenticated && (
          <div className="mt-auto border-t border-border px-6 py-4 space-y-1">
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-0 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogInIcon className="size-4" />
              Sign in
            </Link>
            <Link
              href="/sign-up"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-0 py-2.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <UserPlusIcon className="size-4" />
              Create account
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
