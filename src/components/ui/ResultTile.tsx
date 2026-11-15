import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface ResultTileProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  highlight?: boolean;
  tone?: "default" | "warning";
}

export default function ResultTile({ label, value, sub, highlight, tone = "default" }: ResultTileProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        tone === "warning"
          ? "border-amber-400/50 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10"
          : highlight
            ? "border-cyan-300 bg-cyan-50 dark:border-cyan-500/30 dark:bg-cyan-500/10"
            : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/50",
      )}
    >
      <p className="text-[11px] font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold tabular-nums break-all">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
    </div>
  );
}
