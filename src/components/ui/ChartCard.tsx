import type { CSSProperties, ReactNode } from "react";

/** Shared Recharts tooltip styling (readable in light & dark mode). */
export const TOOLTIP_STYLE: CSSProperties = {
  background: "rgba(15, 23, 42, 0.92)",
  border: "1px solid #334155",
  borderRadius: 8,
  color: "#e2e8f0",
  fontSize: 12,
};

interface ChartCardProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  heightClass?: string;
}

export default function ChartCard({ title, subtitle, actions, children, heightClass = "h-72" }: ChartCardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <div>
          <h3 className="card-title">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className={`${heightClass} p-2`}>{children}</div>
    </div>
  );
}
