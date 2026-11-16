"use client";

import { AlertTriangle, Lightbulb, Radio, Timer } from "lucide-react";
import { useMemo, useState } from "react";
import SIInput from "@/components/ui/SIInput";
import ResultTile from "@/components/ui/ResultTile";
import { colorByName, DIGIT_COLORS, MULTIPLIER_COLORS, RESISTOR_COLORS, type ColorName } from "@/data/resistorColors";
import {
  astable555,
  capacitanceUnits,
  decodeCapacitorCode,
  decodeInductorBands,
  design555,
  encodeCapacitorCode,
  INDUCTOR_TOLERANCE,
  ledResistor,
  monostable555,
  solveDividerR2,
  voltageDivider,
} from "@/utils/components";
import { nextStandardUp, nearestStandard, type ESeries } from "@/utils/eseries";
import { formatResistance, formatSI, parseSI, toSig } from "@/utils/units";
import { cn } from "@/utils/cn";

type Tab = "codes" | "555" | "led";

const TABS: { id: Tab; label: string }[] = [
  { id: "codes", label: "C & L Codes" },
  { id: "555", label: "555 Timer" },
  { id: "led", label: "LED & Divider" },
];

export default function ComponentDecoders() {
  const [tab, setTab] = useState<Tab>("codes");
  return (
    <div className="space-y-6">
      <div className="-mx-1 overflow-x-auto px-1">
        <div className="seg" role="tablist" aria-label="Tool">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={cn("seg-btn whitespace-nowrap", tab === t.id && "seg-btn-active")}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      {tab === "codes" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <CapacitorDecoder />
          <InductorDecoder />
        </div>
      )}
      {tab === "555" && <Timer555 />}
      {tab === "led" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <LedCalculator />
          <DividerCalculator />
        </div>
      )}
    </div>
  );
}

/* ============================ Capacitor code decoder ============================ */

const CAP_EXAMPLES = ["104", "223K", "471", "102J", "4R7", "47", "105M", "109"];

function CapacitorDecoder() {
  const [code, setCode] = useState("104");
  const [value, setValue] = useState("4.7n");
  const result = useMemo(() => decodeCapacitorCode(code), [code]);
  const ok = !("error" in result);
  const units = ok ? capacitanceUnits(result.pF) : null;
  const farads = parseSI(value);
  const encoded = farads > 0 ? encodeCapacitorCode(farads * 1e12) : null;

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">Ceramic / film capacitor code</h2>
        <span className="text-xs text-slate-500">3-digit · R · tolerance letter</span>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Disc capacitor preview */}
          <svg viewBox="0 0 90 110" className="h-24 w-20 shrink-0" aria-hidden="true">
            <line x1={33} y1={70} x2={30} y2={108} stroke="#9ca3af" strokeWidth={3} />
            <line x1={57} y1={70} x2={60} y2={108} stroke="#9ca3af" strokeWidth={3} />
            <ellipse cx={45} cy={40} rx={38} ry={36} fill="#d97706" stroke="#92400e" strokeWidth={2} />
            <ellipse cx={36} cy={28} rx={14} ry={8} fill="#fff" opacity={0.25} />
            <text x={45} y={47} textAnchor="middle" fontSize={code.length > 4 ? 14 : 18} fontWeight={700} fill="#fff" className="font-mono">
              {code.trim().toUpperCase().slice(0, 5) || "?"}
            </text>
          </svg>
          <div className="flex-1">
            <label htmlFor="capcode" className="label">Printed code</label>
            <input id="capcode" value={code} onChange={(e) => setCode(e.target.value.slice(0, 6))} className="input text-lg tracking-widest uppercase" autoComplete="off" spellCheck={false} />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CAP_EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => setCode(ex)} className="btn btn-secondary px-2.5 py-1 font-mono text-xs">{ex}</button>
          ))}
        </div>

        {ok && units ? (
          <>
            <p className="mt-4 font-mono text-sm text-slate-500 dark:text-slate-400">{result.explanation}</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <ResultTile label="pF" value={toSig(units.pF, 6)} highlight />
              <ResultTile label="nF" value={toSig(units.nF, 6)} highlight />
              <ResultTile label="µF" value={toSig(units.uF, 6)} highlight />
            </div>
            <p className="mt-2 text-sm">
              <span className="text-slate-500">Value: </span>
              <span className="font-mono font-semibold">{formatSI(units.pF * 1e-12, "F")}</span>
              {result.tolerance && <span className="ml-2 chip border-amber-400/50 bg-amber-500/10 text-amber-700 dark:text-amber-300">{result.tolerance}</span>}
            </p>
          </>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-500 dark:border-slate-700">{"error" in result ? result.error : ""}</p>
        )}

        <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
          <h3 className="label">Reverse: value → code</h3>
          <div className="grid grid-cols-[1fr_auto] items-start gap-3">
            <SIInput label="Capacitance" unit="F" value={value} onChange={setValue} allowNegative={false} hint="e.g. 100n, 4.7n, 22p, 1u" />
            <div className="mt-5 min-w-20 rounded-lg bg-amber-600 px-3 py-2 text-center font-mono text-lg font-bold text-white">{encoded ?? "—"}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================ Inductor colour code ============================ */

const INDUCTOR_TOL_COLORS = RESISTOR_COLORS.filter((c) => INDUCTOR_TOLERANCE[c.name] !== undefined);
const INDUCTOR_MULT_COLORS = MULTIPLIER_COLORS.filter((c) => (c.multiplier ?? 0) <= 1e4);

function InductorDecoder() {
  const [bands, setBands] = useState<ColorName[]>(["brown", "black", "black", "silver"]); // 10 µH ±10%
  const result = decodeInductorBands(bands);
  const set = (i: number, c: ColorName) => setBands((b) => b.map((x, j) => (j === i ? c : x)));
  const roles = [
    { title: "1st digit", options: DIGIT_COLORS },
    { title: "2nd digit", options: DIGIT_COLORS },
    { title: "Multiplier", options: INDUCTOR_MULT_COLORS },
    { title: "Tolerance", options: INDUCTOR_TOL_COLORS },
  ];

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">Inductor colour code (4-band)</h2>
        <span className="text-xs text-slate-500">value in µH</span>
      </div>
      <div className="p-4">
        <BandedBody bands={bands} body="#7fb069" stroke="#4d7c3a" />
        <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Inductance</p>
          <p className="font-mono text-2xl font-bold text-emerald-800 dark:text-emerald-200">{result ? formatSI(result.uH * 1e-6, "H") : "—"}</p>
          <p className="font-mono text-sm text-slate-600 dark:text-slate-300">
            {result ? `${toSig(result.uH, 6)} µH ±${result.tolerance}% (${formatSI(result.uH * 1e-6 * (1 - result.tolerance / 100), "H", 3)} – ${formatSI(result.uH * 1e-6 * (1 + result.tolerance / 100), "H", 3)})` : "Invalid combination"}
          </p>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {roles.map((role, i) => (
            <label key={role.title} className="block">
              <span className="label">{role.title}</span>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 rounded-sm border border-black/20" style={{ background: colorByName(bands[i]).hex }} />
                <select value={bands[i]} onChange={(e) => set(i, e.target.value as ColorName)} className="input py-2 pl-8 font-sans">
                  {role.options.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.label}
                      {i < 2 ? ` (${c.digit})` : i === 2 ? ` (×${c.multiplier})` : ` (±${INDUCTOR_TOLERANCE[c.name]}%)`}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Compact axial component (inductor) drawing with colour bands. */
function BandedBody({ bands, body, stroke }: { bands: ColorName[]; body: string; stroke: string }) {
  const xs = [150, 190, 230, 300];
  return (
    <svg viewBox="0 0 440 110" className="w-full" role="img" aria-label={`Bands ${bands.join(", ")}`}>
      <rect x="10" y="51" width="420" height="7" rx="3.5" fill="#9ca3af" />
      <rect x="110" y="22" width="220" height="66" rx="33" fill={body} stroke={stroke} strokeWidth="2" />
      {bands.map((b, i) => {
        const c = colorByName(b);
        return c.name === "none" ? null : <rect key={i} x={xs[i] - 8} y={23} width={16} height={64} fill={c.hex} />;
      })}
      <rect x="110" y="22" width="220" height="24" rx="12" fill="#fff" opacity="0.18" />
    </svg>
  );
}

/* ================================ 555 timer ================================ */

function Timer555() {
  const [mode, setMode] = useState<"astable" | "monostable">("astable");
  const [r1, setR1] = useState("1k");
  const [r2, setR2] = useState("10k");
  const [c, setC] = useState("10u");
  const [diode, setDiode] = useState(false);
  const [rm, setRm] = useState("100k");
  const [cm, setCm] = useState("10u");
  const [vcc, setVcc] = useState("9");
  const [tf, setTf] = useState("1k");
  const [td, setTd] = useState("60");
  const [tc, setTc] = useState("10n");

  const astable = useMemo(() => astable555(parseSI(r1), parseSI(r2), parseSI(c), diode), [r1, r2, c, diode]);
  const mono = useMemo(() => monostable555(parseSI(rm), parseSI(cm)), [rm, cm]);
  const design = useMemo(() => design555(parseSI(tf), parseSI(td) / 100, parseSI(tc)), [tf, td, tc]);
  const V = parseSI(vcc);

  return (
    <div className="space-y-6">
      <div className="seg">
        {(["astable", "monostable"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m} className={cn("seg-btn capitalize", mode === m && "seg-btn-active")}>
            {m}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <section className="card h-fit">
          <div className="card-header">
            <h2 className="card-title flex items-center gap-2">
              <Timer className="h-4 w-4 text-violet-500" /> {mode === "astable" ? "Astable (oscillator)" : "Monostable (one-shot)"}
            </h2>
          </div>
          <div className="space-y-2 p-4">
            {mode === "astable" ? (
              <>
                <SIInput label="R1 (VCC → pin 7)" unit="Ω" value={r1} onChange={setR1} allowNegative={false} hint={formatResistance(parseSI(r1))} />
                <SIInput label="R2 (pin 7 → pins 6/2)" unit="Ω" value={r2} onChange={setR2} allowNegative={false} hint={formatResistance(parseSI(r2))} />
                <SIInput label="Timing capacitor C" unit="F" value={c} onChange={setC} allowNegative={false} hint={formatSI(parseSI(c), "F")} />
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={diode} onChange={(e) => setDiode(e.target.checked)} className="h-4 w-4 accent-violet-600" />
                  Diode across R2 (allows duty &lt; 50%)
                </label>
              </>
            ) : (
              <>
                <SIInput label="Timing resistor R" unit="Ω" value={rm} onChange={setRm} allowNegative={false} hint={formatResistance(parseSI(rm))} />
                <SIInput label="Timing capacitor C" unit="F" value={cm} onChange={setCm} allowNegative={false} hint={formatSI(parseSI(cm), "F")} />
              </>
            )}
            <SIInput label="Supply VCC" unit="V" value={vcc} onChange={setVcc} allowNegative={false} hint="NE555: 4.5–16 V" />
          </div>
          <div className="border-t border-slate-200 p-4 font-mono text-xs leading-6 text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {mode === "astable" ? (
              <>
                t_H = 0.693·({diode ? "R1" : "R1+R2"})·C<br />t_L = 0.693·R2·C<br />f = 1 / (t_H + t_L)
              </>
            ) : (
              <>t = 1.1·R·C (trigger: pin 2 &lt; ⅓ VCC)</>
            )}
          </div>
        </section>

        <div className="space-y-6">
          {mode === "astable" ? (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <ResultTile label="Frequency" value={astable ? formatSI(astable.frequency, "Hz") : "—"} highlight />
                <ResultTile label="Period T" value={astable ? formatSI(astable.period, "s") : "—"} highlight />
                <ResultTile label="Duty cycle" value={astable ? `${toSig(astable.duty * 100, 4)} %` : "—"} highlight />
                <ResultTile label="High time t_H" value={astable ? formatSI(astable.tHigh, "s") : "—"} />
                <ResultTile label="Low time t_L" value={astable ? formatSI(astable.tLow, "s") : "—"} />
              </div>
              {astable && <Waveform555 tHigh={astable.tHigh} tLow={astable.tLow} vcc={V} />}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <ResultTile label="Pulse width t" value={mono !== null ? formatSI(mono, "s") : "—"} highlight />
                <ResultTile label="Max retrigger rate" value={mono !== null ? formatSI(1 / mono, "Hz") : "—"} sub="1 / t" />
              </div>
              {mono !== null && <Waveform555 tHigh={mono} tLow={mono * 1.5} vcc={V} mono />}
            </>
          )}

          {mode === "astable" && (
            <section className="card">
              <div className="card-header">
                <h3 className="card-title">Design from target</h3>
                <span className="text-xs text-slate-500">pick C, get R1 &amp; R2</span>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-3">
                <SIInput label="Target frequency" unit="Hz" value={tf} onChange={setTf} allowNegative={false} />
                <SIInput label="Duty cycle" unit="%" value={td} onChange={setTd} allowNegative={false} hint="1–99 %" />
                <SIInput label="Chosen C" unit="F" value={tc} onChange={setTc} allowNegative={false} />
              </div>
              {design ? (
                <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-4">
                  <ResultTile label="R1 (exact)" value={formatResistance(design.R1)} highlight tone={design.R1 < 1000 ? "warning" : "default"} />
                  <ResultTile label="R2 (exact)" value={formatResistance(design.R2)} highlight />
                  <ResultTile label="R1 nearest E24" value={formatResistance(nearestStandard(design.R1))} />
                  <ResultTile label="R2 nearest E24" value={formatResistance(nearestStandard(design.R2))} />
                  <div className="col-span-2 flex flex-wrap items-center gap-2 text-xs text-slate-500 sm:col-span-4">
                    {design.diode && <span className="chip border-violet-400/50 bg-violet-500/10 text-violet-700 dark:text-violet-300">Duty ≤ 50% → add a diode across R2</span>}
                    {design.R1 < 1000 && <span className="chip border-amber-400/50 bg-amber-500/10 text-amber-700 dark:text-amber-300">R1 &lt; 1 kΩ loads pin 7 — pick a smaller C</span>}
                    <button
                      type="button"
                      className="btn btn-secondary px-2.5 py-1 text-xs"
                      onClick={() => {
                        setR1(String(Number(nearestStandard(design.R1).toPrecision(3))));
                        setR2(String(Number(nearestStandard(design.R2).toPrecision(3))));
                        setC(tc);
                        setDiode(design.diode);
                      }}
                    >
                      Use these values ↑
                    </button>
                  </div>
                </div>
              ) : (
                <p className="px-4 pb-4 text-sm text-slate-500">Enter a positive frequency, a duty cycle between 1 and 99 % and a capacitor value.</p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

/** Output square wave + capacitor voltage (⅓–⅔ VCC) for two cycles. */
function Waveform555({ tHigh, tLow, vcc, mono = false }: { tHigh: number; tLow: number; vcc: number; mono?: boolean }) {
  const W = 420;
  const H = 236;
  const left = 50;
  const right = 12;
  const cycles = mono ? 1 : 2;
  const T = tHigh + tLow;
  const total = T * cycles + (mono ? 0 : 0);
  const x = (t: number) => left + (t / total) * (W - left - right);
  const v = Number.isFinite(vcc) && vcc > 0 ? vcc : 1;
  // Output trace (top band) and capacitor trace (bottom band)
  const outY = (hi: boolean) => (hi ? 26 : 92);
  const capTop = 124;
  const capBottom = 214;
  const capY = (frac: number) => capBottom - frac * (capBottom - capTop);

  let out = "";
  let cap = "";
  if (mono) {
    const t0 = tLow * 0.25;
    out = `M${x(0)},${outY(false)} L${x(t0)},${outY(false)} L${x(t0)},${outY(true)} L${x(t0 + tHigh)},${outY(true)} L${x(t0 + tHigh)},${outY(false)} L${x(total)},${outY(false)}`;
    const pts: string[] = [`M${x(0)},${capY(0)}`, `L${x(t0)},${capY(0)}`];
    for (let i = 0; i <= 60; i++) {
      const t = (i / 60) * tHigh;
      pts.push(`L${x(t0 + t)},${capY(1 - Math.exp(-t / (tHigh / Math.log(3))))}`);
    }
    pts.push(`L${x(t0 + tHigh)},${capY(0)}`, `L${x(total)},${capY(0)}`);
    cap = pts.join(" ");
  } else {
    const tauH = tHigh / Math.LN2;
    const tauL = tLow / Math.LN2;
    const pts: string[] = [];
    const segs: string[] = [];
    for (let k = 0; k < cycles; k++) {
      const s = k * T;
      segs.push(`${k === 0 ? "M" : "L"}${x(s)},${outY(true)} L${x(s + tHigh)},${outY(true)} L${x(s + tHigh)},${outY(false)} L${x(s + T)},${outY(false)} L${x(s + T)},${outY(true)}`);
      for (let i = 0; i <= 40; i++) {
        const t = (i / 40) * tHigh;
        // charge from 1/3 toward VCC, reaching 2/3 at tHigh
        pts.push(`${pts.length ? "L" : "M"}${x(s + t)},${capY(1 - (2 / 3) * Math.exp(-t / tauH))}`);
      }
      for (let i = 0; i <= 40; i++) {
        const t = (i / 40) * tLow;
        pts.push(`L${x(s + tHigh + t)},${capY((2 / 3) * Math.exp(-t / tauL))}`);
      }
    }
    out = segs.join(" ");
    cap = pts.join(" ");
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Waveforms</h3>
        <span className="text-xs text-slate-500">pin 3 output · capacitor voltage</span>
      </div>
      <div className="p-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="555 timer output and capacitor waveforms">
          <g className="stroke-slate-300 dark:stroke-slate-700" strokeWidth={1}>
            <line x1={left} y1={outY(false)} x2={W - right} y2={outY(false)} strokeDasharray="3 3" />
            <line x1={left} y1={capY(1 / 3)} x2={W - right} y2={capY(1 / 3)} strokeDasharray="3 3" />
            <line x1={left} y1={capY(2 / 3)} x2={W - right} y2={capY(2 / 3)} strokeDasharray="3 3" />
            <line x1={left} y1={capBottom} x2={W - right} y2={capBottom} />
          </g>
          <path d={out} fill="none" stroke="#8b5cf6" strokeWidth={2.5} strokeLinejoin="round" />
          <path d={cap} fill="none" stroke="#06b6d4" strokeWidth={2.5} />
          <g fontSize={13} className="fill-slate-500 font-mono">
            <text x={left - 6} y={outY(true) + 4} textAnchor="end">{toSig(v - 1.7 > 0 ? v - 1.7 : v, 3)}V</text>
            <text x={left - 6} y={outY(false) + 4} textAnchor="end">0V</text>
            <text x={left - 6} y={capY(2 / 3) + 4} textAnchor="end">⅔V</text>
            <text x={left - 6} y={capY(1 / 3) + 4} textAnchor="end">⅓V</text>
            {!mono && (
              <>
                <text x={(x(0) + x(tHigh)) / 2} y={outY(true) - 6} textAnchor="middle" className="fill-violet-600 dark:fill-violet-400">t_H {formatSI(tHigh, "s", 3)}</text>
                <text x={(x(tHigh) + x(T)) / 2} y={outY(false) - 6} textAnchor="middle" className="fill-violet-600 dark:fill-violet-400">t_L {formatSI(tLow, "s", 3)}</text>
              </>
            )}
            {mono && (
              <text x={x(tLow * 0.25 + tHigh / 2)} y={outY(true) - 6} textAnchor="middle" className="fill-violet-600 dark:fill-violet-400">t = {formatSI(tHigh, "s", 3)}</text>
            )}
            <text x={W - right} y={capBottom + 18} textAnchor="end">V_C: ⅓ = {toSig(v / 3, 3)} V, ⅔ = {toSig((2 * v) / 3, 3)} V</text>
          </g>
        </svg>
      </div>
    </div>
  );
}

/* ============================== LED resistor ============================== */

const LED_PRESETS: { label: string; vf: string; color: string }[] = [
  { label: "Red", vf: "2.0", color: "#ef4444" },
  { label: "Yellow", vf: "2.1", color: "#eab308" },
  { label: "Green", vf: "2.2", color: "#22c55e" },
  { label: "Blue", vf: "3.2", color: "#3b82f6" },
  { label: "White", vf: "3.2", color: "#e2e8f0" },
  { label: "IR", vf: "1.3", color: "#7f1d1d" },
];

const POWER_RATINGS = [0.125, 0.25, 0.5, 1, 2, 3, 5];
const ratingLabel = (w: number) => (w === 0.125 ? "⅛ W" : w === 0.25 ? "¼ W" : w === 0.5 ? "½ W" : `${w} W`);

function LedCalculator() {
  const [vs, setVs] = useState("12");
  const [vf, setVf] = useState("2.0");
  const [ledColor, setLedColor] = useState("#ef4444");
  const [ifStr, setIf] = useState("20m");
  const [nSeries, setNSeries] = useState(3);
  const [strings, setStrings] = useState(1);
  const [series, setSeries] = useState<ESeries>("E24");

  const res = useMemo(() => ledResistor(parseSI(vs), parseSI(vf), parseSI(ifStr), nSeries, strings), [vs, vf, ifStr, nSeries, strings]);
  const ok = !("error" in res);
  const std = ok ? nextStandardUp(res.resistor, series) : NaN;
  const actualI = ok ? (parseSI(vs) - nSeries * parseSI(vf)) / std : NaN;
  const pStd = actualI * actualI * std;
  const rating = POWER_RATINGS.find((r) => r >= pStd * 2);

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" /> LED series resistor
        </h2>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          {LED_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setVf(p.vf);
                setLedColor(p.color);
              }}
              className={cn("chip gap-1.5", vf === p.vf && ledColor === p.color ? "border-slate-900 dark:border-white" : "border-slate-200 dark:border-slate-700")}
            >
              <span className="h-2.5 w-2.5 rounded-full border border-black/20" style={{ background: p.color }} /> {p.label} {p.vf} V
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SIInput label="Supply Vs" unit="V" value={vs} onChange={setVs} allowNegative={false} />
          <SIInput label="LED forward Vf" unit="V" value={vf} onChange={setVf} allowNegative={false} />
          <SIInput label="LED current If" unit="A" value={ifStr} onChange={setIf} allowNegative={false} hint="Typ. 5–20 mA" />
          <div>
            <span className="label">Standard series</span>
            <div className="seg w-full">
              {(["E12", "E24"] as ESeries[]).map((s) => (
                <button key={s} type="button" onClick={() => setSeries(s)} className={cn("seg-btn flex-1", series === s && "seg-btn-active")}>{s}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Stepper label="LEDs in series" value={nSeries} onChange={setNSeries} min={1} max={20} />
          <Stepper label="Parallel strings" value={strings} onChange={setStrings} min={1} max={50} />
        </div>
      </div>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        {ok ? (
          <>
            <LedStringDiagram n={nSeries} color={ledColor} strings={strings} r={formatResistance(std, 3)} />
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <ResultTile label="Exact resistor" value={formatResistance(res.resistor)} highlight />
              <ResultTile label={`Next ${series} up`} value={formatResistance(std)} sub={`I = ${formatSI(actualI, "A", 3)}`} highlight />
              <ResultTile label="Resistor power" value={formatSI(pStd, "W", 3)} sub={rating ? `use ≥ ${ratingLabel(rating)}` : "use a power resistor"} tone={pStd > 0.5 ? "warning" : "default"} />
              <ResultTile label="Power per LED" value={formatSI(parseSI(vf) * actualI, "W", 3)} />
              <ResultTile label="Total current" value={formatSI(actualI * strings, "A", 3)} sub={`${strings} string${strings > 1 ? "s" : ""}`} />
              <ResultTile label="Efficiency" value={`${toSig(res.efficiency * 100, 3)} %`} sub="LED power / total" />
            </div>
            <p className="mt-3 font-mono text-[11px] text-slate-400">R = (Vs − n·Vf) / If, P_R = If²·R — each parallel string needs its own resistor.</p>
          </>
        ) : (
          <p className="flex items-start gap-2 text-sm text-amber-600 dark:text-amber-400">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {res.error}
          </p>
        )}
      </div>
    </section>
  );
}

function Stepper({ label, value, onChange, min, max }: { label: string; value: number; onChange: (n: number) => void; min: number; max: number }) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-stretch overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700">
        <button type="button" onClick={() => onChange(Math.max(min, value - 1))} className="w-11 shrink-0 bg-slate-100 text-lg font-semibold dark:bg-slate-800" aria-label={`Decrease ${label}`}>−</button>
        <span className="flex flex-1 items-center justify-center bg-white py-2 font-mono text-sm font-semibold dark:bg-slate-950">{value}</span>
        <button type="button" onClick={() => onChange(Math.min(max, value + 1))} className="w-11 shrink-0 bg-slate-100 text-lg font-semibold dark:bg-slate-800" aria-label={`Increase ${label}`}>+</button>
      </div>
    </div>
  );
}

function LedStringDiagram({ n, color, strings, r }: { n: number; color: string; strings: number; r: string }) {
  const shown = Math.min(n, 6);
  const W = 120 + shown * 56 + (n > shown ? 30 : 0);
  return (
    <svg viewBox={`0 0 ${W} 80`} className="w-full max-w-lg" role="img" aria-label={`${n} LEDs in series with ${r} resistor`}>
      <g fill="none" className="stroke-slate-500" strokeWidth={2}>
        <line x1={4} y1={40} x2={20} y2={40} />
        <path d="M20,40 l5,-8 l8,16 l8,-16 l8,16 l8,-16 l5,8" className="stroke-cyan-500" />
        <line x1={62} y1={40} x2={W - 4} y2={40} />
      </g>
      <text x={41} y={20} textAnchor="middle" fontSize={11} className="fill-cyan-600 font-mono dark:fill-cyan-400">{r}</text>
      {Array.from({ length: shown }).map((_, i) => {
        const cx = 90 + i * 56;
        return (
          <g key={i}>
            <path d={`M${cx - 12},${28} L${cx - 12},${52} L${cx + 10},${40} Z`} fill={color} stroke="#334155" strokeWidth={1.5} />
            <line x1={cx + 10} y1={28} x2={cx + 10} y2={52} stroke="#334155" strokeWidth={2} />
            <path d={`M${cx + 2},${24} l8,-10 M${cx + 8},${26} l8,-10`} stroke={color} strokeWidth={1.5} />
          </g>
        );
      })}
      {n > shown && (
        <text x={90 + shown * 56 - 8} y={45} fontSize={14} className="fill-slate-500 font-mono">…×{n}</text>
      )}
      <text x={4} y={72} fontSize={10} className="fill-slate-400 font-mono">+Vs</text>
      <text x={W - 4} y={72} fontSize={10} textAnchor="end" className="fill-slate-400 font-mono">GND{strings > 1 ? ` · ×${strings} strings` : ""}</text>
    </svg>
  );
}

/* ============================= Voltage divider ============================= */

function DividerCalculator() {
  const [mode, setMode] = useState<"analyse" | "design">("analyse");
  const [vin, setVin] = useState("12");
  const [r1, setR1] = useState("10k");
  const [r2, setR2] = useState("4.7k");
  const [rl, setRl] = useState("");
  const [vout, setVout] = useState("3.3");

  const R2 = mode === "analyse" ? parseSI(r2) : solveDividerR2(parseSI(vin), parseSI(vout), parseSI(r1)) ?? NaN;
  const res = useMemo(() => voltageDivider(parseSI(vin), parseSI(r1), R2, rl.trim() ? parseSI(rl) : undefined), [vin, r1, R2, rl]);
  const std = mode === "design" && Number.isFinite(R2) ? nearestStandard(R2) : NaN;
  const stdVout = Number.isFinite(std) ? (parseSI(vin) * std) / (parseSI(r1) + std) : NaN;

  return (
    <section className="card h-fit">
      <div className="card-header flex-wrap">
        <h2 className="card-title flex items-center gap-2">
          <Radio className="h-4 w-4 text-sky-500" /> Voltage divider
        </h2>
        <div className="seg">
          <button type="button" onClick={() => setMode("analyse")} className={cn("seg-btn px-2.5 py-1 text-xs", mode === "analyse" && "seg-btn-active")}>Find Vout</button>
          <button type="button" onClick={() => setMode("design")} className={cn("seg-btn px-2.5 py-1 text-xs", mode === "design" && "seg-btn-active")}>Find R2</button>
        </div>
      </div>
      <div className="grid gap-4 p-4 sm:grid-cols-[1fr_150px]">
        <div className="grid grid-cols-2 gap-x-3">
          <SIInput label="Vin" unit="V" value={vin} onChange={setVin} />
          <SIInput label="R1 (top)" unit="Ω" value={r1} onChange={setR1} allowNegative={false} />
          {mode === "analyse" ? (
            <SIInput label="R2 (bottom)" unit="Ω" value={r2} onChange={setR2} allowNegative={false} />
          ) : (
            <SIInput label="Target Vout" unit="V" value={vout} onChange={setVout} allowNegative={false} />
          )}
          <SIInput label="Load RL" unit="Ω" value={rl} onChange={setRl} allowNegative={false} placeholder="optional" hint="Leave empty = no load" />
        </div>
        <DividerDiagram vin={formatSI(parseSI(vin), "V", 3)} r1={formatResistance(parseSI(r1), 3)} r2={formatResistance(R2, 3)} vout={res ? formatSI(res.vOutLoaded ?? res.vOut, "V", 3) : "—"} load={!!rl.trim()} />
      </div>
      <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-3">
        {mode === "design" && <ResultTile label="R2 (exact)" value={formatResistance(R2)} highlight />}
        {mode === "design" && <ResultTile label="R2 nearest E24" value={formatResistance(std)} sub={Number.isFinite(stdVout) ? `Vout = ${formatSI(stdVout, "V", 4)}` : undefined} />}
        <ResultTile label="Vout (no load)" value={res ? formatSI(res.vOut, "V", 4) : "—"} highlight={mode === "analyse"} sub={res ? `ratio ${toSig(res.ratio, 4)}` : undefined} />
        {res?.vOutLoaded !== undefined && (
          <ResultTile label="Vout (loaded)" value={formatSI(res.vOutLoaded, "V", 4)} tone={Math.abs(res.vOutLoaded - res.vOut) / res.vOut > 0.05 ? "warning" : "default"} sub={`${toSig(((res.vOutLoaded - res.vOut) / res.vOut) * 100, 3)} % change`} />
        )}
        <ResultTile label="Divider current" value={res ? formatSI(res.current, "A", 3) : "—"} />
        <ResultTile label="P(R1) / P(R2)" value={res ? formatSI(res.pR1, "W", 3) : "—"} sub={res ? formatSI(res.pR2, "W", 3) : undefined} />
      </div>
    </section>
  );
}

function DividerDiagram({ vin, r1, r2, vout, load }: { vin: string; r1: string; r2: string; vout: string; load: boolean }) {
  const zig = (x: number, y1: number, y2: number) => {
    const seg = (y2 - y1) / 6;
    let d = `M${x},${y1}`;
    for (let i = 0; i < 6; i++) d += ` L${x + (i % 2 === 0 ? -7 : 7)},${y1 + seg * (i + 0.5)}`;
    return d + ` L${x},${y2}`;
  };
  return (
    <svg viewBox="0 0 150 230" className="mx-auto w-36 sm:w-full" role="img" aria-label="Voltage divider schematic">
      <g fill="none" strokeWidth={2} className="stroke-slate-600 dark:stroke-slate-300">
        <line x1={50} y1={14} x2={50} y2={40} />
        <path d={zig(50, 40, 95)} className="stroke-cyan-500" />
        <line x1={50} y1={95} x2={50} y2={125} />
        <path d={zig(50, 125, 180)} className="stroke-violet-500" />
        <line x1={50} y1={180} x2={50} y2={205} />
        <line x1={36} y1={205} x2={64} y2={205} />
        <line x1={41} y1={211} x2={59} y2={211} />
        <line x1={46} y1={217} x2={54} y2={217} />
        <line x1={50} y1={110} x2={110} y2={110} />
        {load && (
          <>
            <line x1={110} y1={110} x2={110} y2={128} />
            <path d={zig(110, 128, 180)} className="stroke-amber-500" />
            <line x1={110} y1={180} x2={110} y2={195} />
            <line x1={50} y1={195} x2={110} y2={195} />
          </>
        )}
      </g>
      <circle cx={50} cy={110} r={3} className="fill-slate-600 dark:fill-slate-300" />
      <g fontSize={10} className="font-mono">
        <text x={50} y={10} textAnchor="middle" className="fill-slate-500">{vin}</text>
        <text x={62} y={70} className="fill-cyan-600 dark:fill-cyan-400">{r1}</text>
        <text x={62} y={158} className="fill-violet-600 dark:fill-violet-400">{r2}</text>
        <text x={112} y={104} textAnchor="middle" className="fill-emerald-600 font-semibold dark:fill-emerald-400">{vout}</text>
        {load && <text x={121} y={160} className="fill-amber-600 dark:fill-amber-400">RL</text>}
      </g>
    </svg>
  );
}
