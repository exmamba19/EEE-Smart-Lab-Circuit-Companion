"use client";

import { Check, Copy, Hash, Palette } from "lucide-react";
import { useMemo, useState } from "react";
import ResultTile from "@/components/ui/ResultTile";
import {
  colorByName,
  DIGIT_COLORS,
  MULTIPLIER_COLORS,
  TOLERANCE_COLORS,
  type BandColor,
  type ColorName,
} from "@/data/resistorColors";
import { decodeBands, decodeSMD } from "@/utils/resistor";
import { formatResistance, formatSI } from "@/utils/units";

const multiplierLabel = (m: number) => (m >= 1 ? formatSI(m, "", 3, false) : String(m));
import { cn } from "@/utils/cn";

type BandCount = 4 | 5;

const DEFAULT_BANDS: Record<BandCount, ColorName[]> = {
  4: ["yellow", "violet", "red", "gold"], // 4.7 kΩ ±5%
  5: ["brown", "black", "black", "red", "brown"], // 10 kΩ ±1%
};

const SMD_EXAMPLES = ["103", "4R7", "1002", "472", "R47", "01C", "68X", "0"];

export default function ResistorDecoder() {
  return (
    <div className="space-y-6">
      <ColorCodeDecoder />
      <SmdDecoder />
    </div>
  );
}

/* --------------------------- Colour-band decoder --------------------------- */

function ColorCodeDecoder() {
  const [count, setCount] = useState<BandCount>(4);
  const [bands, setBands] = useState<ColorName[]>(DEFAULT_BANDS[4]);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => decodeBands(bands), [bands]);

  const switchCount = (c: BandCount) => {
    setCount(c);
    setBands(DEFAULT_BANDS[c]);
  };

  const setBand = (i: number, name: ColorName) => setBands((b) => b.map((x, j) => (j === i ? name : x)));

  const bandRoles: { title: string; options: BandColor[] }[] =
    count === 4
      ? [
          { title: "1st digit", options: DIGIT_COLORS },
          { title: "2nd digit", options: DIGIT_COLORS },
          { title: "Multiplier", options: MULTIPLIER_COLORS },
          { title: "Tolerance", options: TOLERANCE_COLORS },
        ]
      : [
          { title: "1st digit", options: DIGIT_COLORS },
          { title: "2nd digit", options: DIGIT_COLORS },
          { title: "3rd digit", options: DIGIT_COLORS },
          { title: "Multiplier", options: MULTIPLIER_COLORS },
          { title: "Tolerance", options: TOLERANCE_COLORS },
        ];

  const valueText = result ? `${formatResistance(result.ohms)} ±${result.tolerance}%` : "";

  const copy = async () => {
    if (!valueText) return;
    try {
      await navigator.clipboard.writeText(valueText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <section className="card">
      <div className="card-header flex-wrap">
        <h2 className="card-title flex items-center gap-2">
          <Palette className="h-4 w-4 text-rose-500" /> Colour-band decoder
        </h2>
        <div className="seg" role="tablist" aria-label="Number of bands">
          {([4, 5] as BandCount[]).map((c) => (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={count === c}
              onClick={() => switchCount(c)}
              className={cn("seg-btn", count === c && "seg-btn-active")}
            >
              {c}-band
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 p-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <ResistorSVG bands={bands} />

          <div className={cn("grid gap-3", count === 4 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-2 md:grid-cols-5")}>
            {bandRoles.map((role, i) => (
              <BandPicker
                key={`${count}-${i}`}
                title={`Band ${i + 1} · ${role.title}`}
                options={role.options}
                value={bands[i]}
                onChange={(n) => setBand(i, n)}
                kind={role.title === "Multiplier" ? "multiplier" : role.title === "Tolerance" ? "tolerance" : "digit"}
              />
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-cyan-300 bg-gradient-to-br from-cyan-50 to-white p-5 dark:border-cyan-500/30 dark:from-cyan-500/10 dark:to-slate-900">
            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">Resistance</p>
            <p className="mt-1 font-mono text-3xl font-bold tracking-tight text-cyan-800 dark:text-cyan-200">
              {result ? formatResistance(result.ohms) : "—"}
            </p>
            <p className="mt-1 font-mono text-sm text-slate-600 dark:text-slate-300">{result ? `±${result.tolerance}% tolerance` : "Invalid band combination"}</p>
            <button type="button" onClick={copy} disabled={!result} className="btn btn-secondary mt-4 w-full py-1.5 text-xs">
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy value"}
            </button>
          </div>
          {result && (
            <div className="grid grid-cols-2 gap-3">
              <ResultTile label="Minimum" value={formatResistance(result.min)} />
              <ResultTile label="Maximum" value={formatResistance(result.max)} />
              <ResultTile label="Exact (Ω)" value={result.ohms.toLocaleString("en-US", { maximumFractionDigits: 3 })} />
              <ResultTile label="Significant digits" value={result.digits} sub={`× ${multiplierLabel(colorByName(bands[count - 2]).multiplier ?? 1)}`} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function BandPicker({
  title,
  options,
  value,
  onChange,
  kind,
}: {
  title: string;
  options: BandColor[];
  value: ColorName;
  onChange: (n: ColorName) => void;
  kind: "digit" | "multiplier" | "tolerance";
}) {
  const describe = (c: BandColor) =>
    kind === "digit"
      ? String(c.digit)
      : kind === "multiplier"
        ? `×${multiplierLabel(c.multiplier ?? 1)}`
        : `±${c.tolerance}%`;

  return (
    <fieldset className="rounded-lg border border-slate-200 p-2 dark:border-slate-800">
      <legend className="px-1 text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">{title}</legend>
      <div className="grid max-h-72 grid-cols-1 gap-1 overflow-y-auto pr-0.5">
        {options.map((c) => {
          const selected = c.name === value;
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => onChange(c.name)}
              aria-pressed={selected}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1 text-left text-xs transition",
                selected
                  ? "bg-slate-900 text-white ring-2 ring-cyan-500 dark:bg-slate-100 dark:text-slate-900"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800",
              )}
            >
              <span
                className={cn(
                  "h-4 w-4 shrink-0 rounded-sm border",
                  c.name === "none" ? "border-dashed border-slate-400" : "border-black/20 dark:border-white/20",
                )}
                style={{ background: c.hex }}
              />
              <span className="flex-1">{c.label}</span>
              <span className="font-mono opacity-70">{describe(c)}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/** Live SVG drawing of a through-hole resistor with the selected bands. */
function ResistorSVG({ bands }: { bands: ColorName[] }) {
  const n = bands.length;
  // Band x-positions: digits/multiplier grouped left, tolerance separated on the right.
  const positions = n === 4 ? [170, 215, 260, 350] : [160, 197, 234, 271, 350];

  return (
    <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 p-4 dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
      <svg viewBox="0 0 520 140" className="mx-auto w-full max-w-2xl" role="img" aria-label={`Resistor with bands ${bands.join(", ")}`}>
        <defs>
          <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f3d9a4" />
            <stop offset="45%" stopColor="#e2bf7c" />
            <stop offset="100%" stopColor="#b88f4c" />
          </linearGradient>
          <linearGradient id="shine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id="lead" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e5e7eb" />
            <stop offset="50%" stopColor="#9ca3af" />
            <stop offset="100%" stopColor="#6b7280" />
          </linearGradient>
          <clipPath id="bodyClip">
            <path d="M120,40 C120,22 150,22 165,32 L355,32 C370,22 400,22 400,40 L400,100 C400,118 370,118 355,108 L165,108 C150,118 120,118 120,100 Z" />
          </clipPath>
        </defs>
        {/* Leads */}
        <rect x="10" y="66" width="115" height="8" rx="4" fill="url(#lead)" />
        <rect x="395" y="66" width="115" height="8" rx="4" fill="url(#lead)" />
        {/* Body */}
        <path
          d="M120,40 C120,22 150,22 165,32 L355,32 C370,22 400,22 400,40 L400,100 C400,118 370,118 355,108 L165,108 C150,118 120,118 120,100 Z"
          fill="url(#body)"
          stroke="#8a6a35"
          strokeWidth="1.5"
        />
        <g clipPath="url(#bodyClip)">
          {bands.map((b, i) => {
            const c = colorByName(b);
            if (c.name === "none") return null;
            return <rect key={i} x={positions[i] - 9} y={20} width={18} height={100} fill={c.hex} className="transition-[fill] duration-300" />;
          })}
          <rect x="110" y="20" width="300" height="100" fill="url(#shine)" />
        </g>
        {/* Band labels */}
        {bands.map((b, i) => (
          <text key={i} x={positions[i]} y={134} textAnchor="middle" fontSize="10" className="fill-slate-500 dark:fill-slate-400">
            {colorByName(b).label}
          </text>
        ))}
      </svg>
    </div>
  );
}

/* ------------------------------- SMD decoder ------------------------------ */

function SmdDecoder() {
  const [code, setCode] = useState("103");
  const result = useMemo(() => decodeSMD(code), [code]);
  const ok = !("error" in result);

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title flex items-center gap-2">
          <Hash className="h-4 w-4 text-rose-500" /> SMD resistor code decoder
        </h2>
        <span className="hidden text-xs text-slate-500 sm:inline">3-digit · 4-digit · R-notation · EIA-96</span>
      </div>
      <div className="grid gap-6 p-4 lg:grid-cols-[1fr_1fr]">
        <div>
          <label htmlFor="smd" className="label">Marking on the resistor</label>
          <div className="flex items-center gap-4">
            {/* SMD chip preview */}
            <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-sm border-x-[10px] border-x-slate-300 bg-slate-900 shadow-inner dark:border-x-slate-500">
              <span className="font-mono text-lg font-bold tracking-widest text-white">{code.trim().toUpperCase().slice(0, 5) || "—"}</span>
            </div>
            <input
              id="smd"
              value={code}
              onChange={(e) => setCode(e.target.value.slice(0, 6))}
              className="input text-lg tracking-widest uppercase"
              placeholder="103"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SMD_EXAMPLES.map((ex) => (
              <button key={ex} type="button" onClick={() => setCode(ex)} className="btn btn-secondary px-2.5 py-1 font-mono text-xs">
                {ex}
              </button>
            ))}
          </div>
          <ul className="mt-4 space-y-1 text-xs text-slate-500 dark:text-slate-400">
            <li><span className="font-mono text-slate-700 dark:text-slate-200">103</span> → 10 × 10³ = 10 kΩ (3-digit, ±5%)</li>
            <li><span className="font-mono text-slate-700 dark:text-slate-200">1002</span> → 100 × 10² = 10 kΩ (4-digit, ±1%)</li>
            <li><span className="font-mono text-slate-700 dark:text-slate-200">4R7</span> → 4.7 Ω (R = decimal point)</li>
            <li><span className="font-mono text-slate-700 dark:text-slate-200">01C</span> → 100 × 100 = 10 kΩ (EIA-96, ±1%)</li>
          </ul>
        </div>

        <div>
          {ok ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-cyan-300 bg-gradient-to-br from-cyan-50 to-white p-5 dark:border-cyan-500/30 dark:from-cyan-500/10 dark:to-slate-900">
                <p className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">Decoded resistance</p>
                <p className="mt-1 font-mono text-3xl font-bold tracking-tight text-cyan-800 dark:text-cyan-200">{formatResistance(result.ohms)}</p>
                <p className="mt-1 font-mono text-sm text-slate-600 dark:text-slate-300">{result.explanation}</p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <ResultTile label="Code type" value={<span className="text-sm">{result.type}</span>} />
                <ResultTile label="Typical tol." value={<span className="text-sm">{result.tolerance}</span>} />
                <ResultTile label="Exact (Ω)" value={<span className="text-sm">{result.ohms.toLocaleString("en-US", { maximumFractionDigits: 4 })}</span>} />
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-32 items-center justify-center rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              {result.error}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
