"use client";

import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { TOOLS } from "@/data/tools";
import { cn } from "@/utils/cn";
import PwaStatus from "./PwaStatus";
import Sidebar from "./Sidebar";
import ThemeToggle from "./ThemeToggle";

export default function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const current = TOOLS.find((t) => (t.href === "/" ? pathname === "/" : pathname.startsWith(t.href))) ?? {
    title: "EEE Smart Lab",
    description: "Circuit Companion",
  };

  // Close the drawer on Escape and lock body scroll while it is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white lg:block dark:border-slate-800 dark:bg-slate-900">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-sm transition-opacity lg:hidden",
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 lg:hidden dark:border-slate-800 dark:bg-slate-900",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-label="Navigation"
        aria-hidden={!drawerOpen}
        inert={!drawerOpen}
      >
        <Sidebar onNavigate={() => setDrawerOpen(false)} onClose={() => setDrawerOpen(false)} />
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 pt-[env(safe-area-inset-top)] box-content items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6 dark:border-slate-800 dark:bg-slate-950/80">
          <button
            type="button"
            className="btn btn-ghost -ml-2 p-2 lg:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            aria-expanded={drawerOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{current.title}</p>
            <p className="hidden truncate text-xs text-slate-500 sm:block dark:text-slate-400">{current.description}</p>
          </div>
          <PwaStatus />
          <ThemeToggle />
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
