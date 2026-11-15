"use client";

import { Info, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import SIInput from "@/components/ui/SIInput";
import ResultTile from "@/components/ui/ResultTile";
import { solveOhmsLaw, type OhmKey } from "@/utils/electrical";
import { formatResistance, formatSI, formatSICompact, parseSI } from "@/utils/units";
import { cn } from "@/utils/cn";

const FIELDS: { key: OhmKey; label: string; unit: string; placeholder: string }[] = [
  { key: "V", label: "Voltage (V)", unit: "V", placeholder: "e.g. 12" },
  { key: "I", label: "Current (I)", unit: "A", placeholder: "e.g. 20m" },
  { key: "R", label: "Resistance (R)", unit: "Ω", placeholder: "e.g. 4.7k" },
  { key: "P", label: "Power (P)", unit: "W", placeholder: "e.g. 0.25" },
];

const UNIT: Record<OhmKey, string> = { V: "V", I: "A", R: "Ω", P: "W" };

const EMPTY: Record<OhmKey, string> = { V: "", I: "", R: "", P: "" };

const PRESETS: { label: string; values: Partial<Record<OhmKey, string>> }[] = [
  { label: "LED on 5 V (20 mA, 150 Ω)", values: { I: "20m", R: "150" } },
  { label: "12 V / 60 W lamp", values: { V: "12", P: "60" } },
  { label: "¼ W limit for 1 kΩ", values: { R: "1k", P: "0.25" } },
  { label: "Mains 230 V kettle 2 kW", values: { V: "230", P: "2k" } },
];

export default function OhmsLawCalculator() {
  const [inputs, setInputs] = useState<Record<OhmKey, string>>(EMPTY);
  /** The two most recently entered, valid fields (most recent first). */
  const [knowns, setKnowns] = useState<OhmKey[]>([]);

  const result = useMemo(() => {
    if (knowns.length !== 2) return null;
    const known: Partial<Record<OhmKey, number>> = {};
    knowns.forEach((k) => (known[k] = parseSI(inputs[k])));
    return solveOhmsLaw(known);
  }, [inputs, knowns]);

  const handleChange = (key: OhmKey, raw: string) => {
    const next = { ...inputs, [key]: raw };
    const valid = Number.isFinite(parseSI(raw));
    let nextKnowns = knowns.filter((k) => k !== key);
    if (valid) nextKnowns = [key, ...nextKnowns].slice(0, 2);
    // Clear text in fields that are no longer user-entered so they show computed values.
    (Object.keys(next) as OhmKey[]).forEach((k) => {
      if (k !== key && !nextKnowns.includes(k)) next[k] = "";
    });
    setInputs(next);
    setKnowns(nextKnowns);
  };

  const applyPreset = (values: Partial<Record<OhmKey, string>>) => {
    const keys = Object.keys(values) as OhmKey[];
    setInputs({ ...EMPTY, ...values });
    setKnowns(keys.slice(0, 2));
  };

  const reset = () => {
    setInputs(EMPTY);
    setKnowns([]);
  };

  const displayValue = (k: OhmKey): string => {
    if (knowns.includes(k) || inputs[k] !== "") return inputs[k];
    if (result) return formatSICompact(result[k], 5);
    return "";
  };

  const pretty = (k: OhmKey, v: number) => (k === "R" ? formatResistance(v) : formatSI(v, UNIT[k]));

  const tooFew = knowns.length < 2;
  const invalidPair = knowns.length === 2 && !result;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <section className="card">
        <div className="card-header">
          <h2 className="card-title">Enter any two values</h2>
          <button type="button" onClick={reset} className="btn btn-ghost px-2 py-1 text-xs">
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <SIInput
              key={f.key}
              label={f.label}
              unit={f.unit}
              placeholder={f.placeholder}
              value={displayValue(f.key)}
              computed={!!result && !knowns.includes(f.key)}
              onChange={(v) => handleChange(f.key, v)}
              hint={result && !knowns.includes(f.key) ? result.formula[f.key] : "SI prefixes: p n u m k M G"}
            />
          ))}
        </div>

        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          {tooFew && (
            <p className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Info className="h-4 w-4 shrink-0" />
              {knowns.length === 0
                ? "Type values into any two fields — the remaining two are solved in real time."
                : "One more value needed."}
            </p>
          )}
          {invalidPair && (
            <p className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <Info className="h-4 w-4 shrink-0" /> This combination has no valid solution (check for zeros or sign mismatches).
            </p>
          )}
          {result && (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {FIELDS.map((f) => (
                <ResultTile
                  key={f.key}
                  label={f.label}
                  value={pretty(f.key, result[f.key])}
                  sub={knowns.includes(f.key) ? "given" : result.formula[f.key]}
                  highlight={!knowns.includes(f.key)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
          <span className="mr-1 self-center text-xs font-medium text-slate-500">Examples:</span>
          {PRESETS.map((p) => (
            <button key={p.label} type="button" onClick={() => applyPreset(p.values)} className="btn btn-secondary px-2.5 py-1 text-xs">
              {p.label}
            </button>
          ))}
        </div>
      </section>

      <aside className="space-y-6">
        <OhmWheel active={knowns} />
        {result && result.P > 0 && (
          <div className="card p-4 text-sm">
            <h3 className="card-title mb-2">Resistor power rating</h3>
            <p className="text-slate-500 dark:text-slate-400">
              Dissipating <span className="font-mono text-slate-900 dark:text-slate-100">{formatSI(result.P, "W")}</span>. Choose a resistor rated at
              least <span className="font-mono font-semibold text-cyan-700 dark:text-cyan-300">{suggestRating(result.P)}</span> (2× safety margin).
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

const RATINGS = [0.125, 0.25, 0.5, 1, 2, 3, 5, 10, 25, 50, 100];
function suggestRating(p: number): string {
  const r = RATINGS.find((x) => x >= p * 2);
  if (!r) return `${formatSI(p * 2, "W")}+ (power resistor / heatsink)`;
  return r < 1 ? `${r === 0.125 ? "⅛" : r === 0.25 ? "¼" : "½"} W` : `${r} W`;
}

/** Classic Ohm's-law wheel with the two known quadrants highlighted. */
function OhmWheel({ active }: { active: OhmKey[] }) {
  const quads: { key: OhmKey; color: string; formulas: string[] }[] = [
    { key: "V", color: "#f59e0b", formulas: ["I·R", "P/I", "√(P·R)"] },
    { key: "I", color: "#06b6d4", formulas: ["V/R", "P/V", "√(P/R)"] },
    { key: "R", color: "#8b5cf6", formulas: ["V/I", "V²/P", "P/I²"] },
    { key: "P", color: "#ef4444", formulas: ["V·I", "I²·R", "V²/R"] },
  ];
  return (
    <div className="card p-4">
      <h3 className="card-title mb-3">Ohm&apos;s Law wheel</h3>
      <div className="grid grid-cols-2 gap-2">
        {quads.map((q) => (
          <div
            key={q.key}
            className={cn(
              "rounded-lg border p-3 transition",
              active.includes(q.key)
                ? "border-transparent"
                : "border-slate-200 dark:border-slate-800",
            )}
            style={active.includes(q.key) ? { boxShadow: `0 0 0 2px ${q.color}` } : undefined}
          >
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full font-mono text-sm font-bold text-white" style={{ background: q.color }}>
                {q.key}
              </span>
              <span className="text-xs text-slate-500">{active.includes(q.key) ? "known" : "="}</span>
            </div>
            <ul className="mt-2 space-y-0.5 font-mono text-xs text-slate-600 dark:text-slate-300">
              {q.formulas.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
