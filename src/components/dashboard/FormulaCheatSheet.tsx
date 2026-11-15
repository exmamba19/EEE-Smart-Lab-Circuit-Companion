"use client";

import { Check, Copy, Search, Sigma, X } from "lucide-react";
import { useMemo, useState } from "react";
import { FORMULA_CATEGORIES, FORMULAS, type FormulaCategory } from "@/data/formulas";
import { cn } from "@/utils/cn";

export default function FormulaCheatSheet() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FormulaCategory | "All">("All");
  const [copied, setCopied] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return FORMULAS.filter((f) => {
      if (category !== "All" && f.category !== category) return false;
      if (!terms.length) return true;
      const hay = `${f.name} ${f.expression} ${f.variables} ${f.category} ${f.note ?? ""}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }, [query, category]);

  const copy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied((c) => (c === id ? null : c)), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section className="card" aria-labelledby="cheatsheet-title">
      <div className="card-header flex-wrap">
        <h2 id="cheatsheet-title" className="card-title flex items-center gap-2">
          <Sigma className="h-4 w-4 text-cyan-600" /> Formula cheat sheet
        </h2>
        <span className="text-xs text-slate-500">
          {filtered.length} of {FORMULAS.length} formulas
        </span>
      </div>

      <div className="space-y-3 border-b border-slate-200 p-4 dark:border-slate-800">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search formulas — e.g. resonance, 555, power factor, diode"
            className="input pl-9 font-sans"
            aria-label="Search formulas"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["All", ...FORMULA_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={cn(
                "chip",
                category === c
                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"
                  : "border-slate-200 text-slate-500 hover:border-slate-400 dark:border-slate-700 dark:text-slate-400",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="p-8 text-center text-sm text-slate-500">No formulas match “{query}”.</p>
      ) : (
        <ul className="grid gap-px bg-slate-200 sm:grid-cols-2 xl:grid-cols-3 dark:bg-slate-800">
          {filtered.map((f) => (
            <li key={f.id} className="group bg-white p-4 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{f.name}</p>
                  <p className="text-[11px] text-slate-400">{f.category}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copy(f.id, f.expression)}
                  className="rounded p-1 text-slate-400 opacity-60 transition group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  aria-label={`Copy ${f.name}`}
                >
                  {copied === f.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <p className="mt-2 rounded-md bg-slate-50 px-2.5 py-2 font-mono text-sm break-words text-cyan-800 dark:bg-slate-950 dark:text-cyan-300">
                {f.expression}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{f.variables}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
