"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircuitBoard, X } from "lucide-react";
import { TOOL_GROUPS, TOOLS } from "@/data/tools";
import { cn } from "@/utils/cn";

interface SidebarProps {
  onNavigate?: () => void;
  onClose?: () => void;
}

export default function Sidebar({ onNavigate, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between gap-2 border-b border-slate-200 px-4 dark:border-slate-800">
        <Link href="/" onClick={onNavigate} className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-sky-700 text-white shadow-sm">
            <CircuitBoard className="h-5 w-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold tracking-tight">EEE Smart Lab</span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">Circuit Companion</span>
          </span>
        </Link>
        {onClose && (
          <button type="button" onClick={onClose} className="btn btn-ghost p-2 lg:hidden" aria-label="Close menu">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Tools">
        {TOOL_GROUPS.map((group) => (
          <div key={group}>
            <p className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase dark:text-slate-500">
              {group}
            </p>
            <ul className="space-y-1">
              {TOOLS.filter((t) => t.group === group).map((tool) => {
                const active = tool.href === "/" ? pathname === "/" : pathname.startsWith(tool.href);
                const Icon = tool.icon;
                return (
                  <li key={tool.id}>
                    <Link
                      href={tool.href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                        active
                          ? "bg-cyan-50 text-cyan-800 ring-1 ring-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-200 dark:ring-cyan-500/20"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100",
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0",
                          active ? "text-cyan-600 dark:text-cyan-300" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200",
                        )}
                      />
                      {tool.short}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4 text-[11px] leading-relaxed text-slate-400 dark:border-slate-800 dark:text-slate-500">
        Values are typical datasheet figures. Always verify against the manufacturer datasheet.
      </div>
    </div>
  );
}
