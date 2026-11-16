import { CircuitBoard } from "lucide-react";
import FormulaCheatSheet from "@/components/dashboard/FormulaCheatSheet";
import ToolCards from "@/components/dashboard/ToolCards";
import { DEVICES } from "@/data/pinouts";
import { FORMULAS } from "@/data/formulas";
import { TOOLS } from "@/data/tools";

/**
 * Capacitor's Android WebView answers every extensionless path (e.g. `/tools/pinouts/` after a
 * WebView reload) with the root `index.html`. When that happens for a known route, load that
 * route's own exported file instead. Static web hosts never serve this page at another path,
 * so the script is a no-op on the web.
 */
const ROUTE_FIX_SCRIPT = `(function(){var r=${JSON.stringify(
  TOOLS.filter((t) => t.href !== "/").map((t) => t.href + "/"),
)};var p=location.pathname;if(p.charAt(p.length-1)!=="/")p+="/";if(r.indexOf(p)!==-1)location.replace(p+"index.html"+location.search+location.hash);})();`;

export default function DashboardPage() {
  const stats = [
    { label: "Tools", value: TOOLS.length - 1 },
    { label: "Formulas", value: FORMULAS.length },
    { label: "Pinout devices", value: DEVICES.length },
    { label: "Pins documented", value: DEVICES.reduce((n, d) => n + d.pins.length, 0) },
  ];

  return (
    <div className="space-y-8">
      <script dangerouslySetInnerHTML={{ __html: ROUTE_FIX_SCRIPT }} />
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950 p-6 text-white shadow-sm sm:p-8 dark:border-slate-800">
        <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]" aria-hidden="true">
          <defs>
            <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M32 0H0V32" fill="none" stroke="currentColor" strokeWidth="0.75" />
              <circle cx="0" cy="0" r="1.5" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
              <CircuitBoard className="h-3.5 w-3.5" /> For EEE students &amp; engineers
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">EEE Smart Lab &amp; Circuit Companion</h1>
            <p className="mt-2 text-sm text-slate-300 sm:text-base">
              Solve circuits, decode components, look up pinouts and analyse your lab readings — all in one fast,
              offline-friendly workspace.
            </p>
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:w-[440px]">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur">
                <dt className="text-[11px] text-slate-400">{s.label}</dt>
                <dd className="font-mono text-xl font-semibold">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <ToolCards />
      <FormulaCheatSheet />
    </div>
  );
}
