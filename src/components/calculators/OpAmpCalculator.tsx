"use client";

import { AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import SIInput from "@/components/ui/SIInput";
import ResultTile from "@/components/ui/ResultTile";
import { analyzeOpAmp, type OpAmpMode } from "@/utils/electrical";
import { formatResistance, formatSI, parseSI, toSig } from "@/utils/units";
import { cn } from "@/utils/cn";

const PRESETS: { label: string; mode: OpAmpMode; rin: string; rf: string; vin: string }[] = [
  { label: "Inverting ×−10", mode: "inverting", rin: "1k", rf: "10k", vin: "0.5" },
  { label: "Unity inverter", mode: "inverting", rin: "10k", rf: "10k", vin: "1" },
  { label: "Non-inv ×11", mode: "non-inverting", rin: "1k", rf: "10k", vin: "0.2" },
  { label: "Mic preamp ×101", mode: "non-inverting", rin: "1k", rf: "100k", vin: "10m" },
];

export default function OpAmpCalculator() {
  const [mode, setMode] = useState<OpAmpMode>("inverting");
  const [rin, setRin] = useState("1k");
  const [rf, setRf] = useState("10k");
  const [vin, setVin] = useState("0.5");
  const [vpos, setVpos] = useState("15");
  const [vneg, setVneg] = useState("-15");
  const [headroom, setHeadroom] = useState("1.5");

  const Rin = parseSI(rin);
  const Rf = parseSI(rf);
  const Vin = parseSI(vin);
  const Vp = parseSI(vpos);
  const Vn = parseSI(vneg);
  const hr = Math.max(0, parseSI(headroom) || 0);

  const result = useMemo(
    () => analyzeOpAmp(mode, Rin, Rf, Vin, Vp - hr, Vn + hr),
    [mode, Rin, Rf, Vin, Vp, Vn, hr],
  );

  const maxVin = result && result.gain !== 0 ? (result.gain > 0 ? (Vp - hr) / result.gain : (Vn + hr) / result.gain) : NaN;
  const minVin = result && result.gain !== 0 ? (result.gain > 0 ? (Vn + hr) / result.gain : (Vp - hr) / result.gain) : NaN;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="seg" role="tablist" aria-label="Amplifier configuration">
          {(["inverting", "non-inverting"] as OpAmpMode[]).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={cn("seg-btn capitalize", mode === m && "seg-btn-active")}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className="btn btn-secondary px-2.5 py-1 text-xs"
              onClick={() => {
                setMode(p.mode);
                setRin(p.rin);
                setRf(p.rf);
                setVin(p.vin);
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <section className="card h-fit">
          <div className="card-header">
            <h2 className="card-title">Circuit parameters</h2>
          </div>
          <div className="space-y-2 p-4">
            <SIInput
              label={mode === "inverting" ? "Input resistor Rin" : "Ground resistor Rg"}
              unit="Ω"
              value={rin}
              onChange={setRin}
              allowNegative={false}
              hint={Number.isFinite(Rin) ? formatResistance(Rin) : undefined}
            />
            <SIInput label="Feedback resistor Rf" unit="Ω" value={rf} onChange={setRf} allowNegative={false} hint={Number.isFinite(Rf) ? formatResistance(Rf) : undefined} />
            <SIInput label="Input voltage Vin" unit="V" value={vin} onChange={setVin} hint="DC or instantaneous value" />
            <div className="grid grid-cols-2 gap-3">
              <SIInput label="+V supply" unit="V" value={vpos} onChange={setVpos} />
              <SIInput label="−V supply" unit="V" value={vneg} onChange={setVneg} />
            </div>
            <SIInput label="Output headroom per rail" unit="V" value={headroom} onChange={setHeadroom} allowNegative={false} hint="LM741 ≈ 1.5–2 V, rail-to-rail ≈ 0.05 V" />
          </div>
        </section>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <ResultTile label="Voltage gain Av" value={result ? `${toSig(result.gain, 5)} V/V` : "—"} highlight />
            <ResultTile label="Gain (dB)" value={result ? `${toSig(result.gainDb, 4)} dB` : "—"} sub={result && result.gain < 0 ? "180° phase shift" : "0° phase shift"} />
            <ResultTile
              label="Output Vout"
              value={result ? formatSI(result.vout, "V") : "—"}
              highlight={!result?.saturated}
              tone={result?.saturated ? "warning" : "default"}
              sub={result?.saturated ? `Clipped (ideal ${formatSI(result.idealVout, "V")})` : "Within linear range"}
            />
            <ResultTile label="Input impedance" value={result ? (mode === "inverting" ? formatResistance(Rin) : "≫ 1 MΩ") : "—"} sub={result?.inputImpedance} />
          </div>

          {result?.saturated && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-400/50 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Output saturates at the supply rail. For linear operation keep Vin between{" "}
                <span className="font-mono">{formatSI(minVin, "V")}</span> and <span className="font-mono">{formatSI(maxVin, "V")}</span>, or reduce the gain.
              </p>
            </div>
          )}

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Schematic — {mode} amplifier</h3>
              <span className="font-mono text-xs text-slate-500">
                {mode === "inverting" ? "Av = −Rf / Rin" : "Av = 1 + Rf / Rg"}
              </span>
            </div>
            <div className="p-4">
              <OpAmpSchematic mode={mode} rin={formatResistance(Rin, 3)} rf={formatResistance(Rf, 3)} vin={formatSI(Vin, "V", 3)} vout={result ? formatSI(result.vout, "V", 3) : "—"} />
            </div>
          </div>

          <TransferPlot gain={result?.gain ?? NaN} vmax={Vp - hr} vmin={Vn + hr} vin={Vin} />
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Sub-components ---------------------------- */

function OpAmpSchematic({ mode, rin, rf, vin, vout }: { mode: OpAmpMode; rin: string; rf: string; vin: string; vout: string }) {
  const stroke = "currentColor";
  // Resistor zig-zag between (x1,y) and (x2,y)
  const resistorH = (x1: number, x2: number, y: number) => {
    const w = x2 - x1;
    const seg = w / 8;
    let d = `M${x1},${y}`;
    for (let i = 0; i < 8; i++) d += ` L${x1 + seg * (i + 0.5)},${y + (i % 2 === 0 ? -7 : 7)}`;
    d += ` L${x2},${y}`;
    return d;
  };
  const resistorV = (x: number, y1: number, y2: number) => {
    const h = y2 - y1;
    const seg = h / 8;
    let d = `M${x},${y1}`;
    for (let i = 0; i < 8; i++) d += ` L${x + (i % 2 === 0 ? -7 : 7)},${y1 + seg * (i + 0.5)}`;
    d += ` L${x},${y2}`;
    return d;
  };

  return (
    <svg viewBox="0 0 520 240" className="mx-auto w-full max-w-xl text-slate-700 dark:text-slate-300" role="img" aria-label={`${mode} op-amp schematic`}>
      <g fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round">
        {/* Op-amp triangle: inverting input at y=110, non-inverting at y=150, output at (370,130) */}
        <path d="M270,80 L270,180 L370,130 Z" className="fill-white dark:fill-slate-900" />
        <line x1={370} y1={130} x2={470} y2={130} />
        {/* Feedback path */}
        <line x1={230} y1={110} x2={270} y2={110} />
        <line x1={230} y1={110} x2={230} y2={50} />
        <line x1={230} y1={50} x2={290} y2={50} />
        <path d={resistorH(290, 360, 50)} className="stroke-violet-500" />
        <line x1={360} y1={50} x2={420} y2={50} />
        <line x1={420} y1={50} x2={420} y2={130} />
        <circle cx={420} cy={130} r={3} fill={stroke} />
        <circle cx={230} cy={110} r={3} fill={stroke} />

        {mode === "inverting" ? (
          <>
            <line x1={40} y1={110} x2={110} y2={110} />
            <path d={resistorH(110, 180, 110)} className="stroke-cyan-500" />
            <line x1={180} y1={110} x2={230} y2={110} />
            {/* + input to ground */}
            <line x1={270} y1={150} x2={240} y2={150} />
            <line x1={240} y1={150} x2={240} y2={200} />
            <line x1={226} y1={200} x2={254} y2={200} />
            <line x1={231} y1={206} x2={249} y2={206} />
            <line x1={236} y1={212} x2={244} y2={212} />
          </>
        ) : (
          <>
            {/* Vin to + input */}
            <line x1={40} y1={150} x2={270} y2={150} />
            {/* Rg from - node to ground */}
            <line x1={230} y1={110} x2={200} y2={110} />
            <line x1={200} y1={110} x2={200} y2={130} />
            <path d={resistorV(200, 130, 190)} className="stroke-cyan-500" />
            <line x1={200} y1={190} x2={200} y2={200} />
            <line x1={186} y1={200} x2={214} y2={200} />
            <line x1={191} y1={206} x2={209} y2={206} />
            <line x1={196} y1={212} x2={204} y2={212} />
          </>
        )}
        <circle cx={40} cy={mode === "inverting" ? 110 : 150} r={4} className="fill-cyan-500 stroke-cyan-500" />
        <circle cx={470} cy={130} r={4} className="fill-amber-500 stroke-amber-500" />
      </g>
      <g className="fill-current font-mono" fontSize={13}>
        <text x={278} y={115}>−</text>
        <text x={278} y={155}>+</text>
        <text x={325} y={36} textAnchor="middle" className="fill-violet-600 dark:fill-violet-400">Rf = {rf}</text>
        {mode === "inverting" ? (
          <text x={145} y={96} textAnchor="middle" className="fill-cyan-600 dark:fill-cyan-400">Rin = {rin}</text>
        ) : (
          <text x={190} y={165} textAnchor="end" className="fill-cyan-600 dark:fill-cyan-400">Rg = {rin}</text>
        )}
        <text x={40} y={mode === "inverting" ? 132 : 172} textAnchor="start">Vin = {vin}</text>
        <text x={470} y={116} textAnchor="end">Vout = {vout}</text>
      </g>
    </svg>
  );
}

function TransferPlot({ gain, vmax, vmin, vin }: { gain: number; vmax: number; vmin: number; vin: number }) {
  if (!Number.isFinite(gain) || !(vmax > vmin) || gain === 0) return null;
  // Show Vin range that covers both saturation knees with margin.
  const knee = Math.max(Math.abs(vmax / gain), Math.abs(vmin / gain));
  const span = Math.max(knee * 1.6, Math.abs(vin) * 1.2, 1e-6);
  const W = 520;
  const H = 220;
  const pad = 36;
  const x = (v: number) => pad + ((v + span) / (2 * span)) * (W - 2 * pad);
  const yRange = Math.max(Math.abs(vmax), Math.abs(vmin)) * 1.15;
  const y = (v: number) => H / 2 - (v / yRange) * (H / 2 - 16);
  const clip = (v: number) => Math.min(vmax, Math.max(vmin, v));
  const pts: string[] = [];
  for (let i = 0; i <= 200; i++) {
    const vi = -span + (i / 200) * 2 * span;
    pts.push(`${x(vi).toFixed(1)},${y(clip(gain * vi)).toFixed(1)}`);
  }
  const op = Number.isFinite(vin) ? { cx: x(vin), cy: y(clip(gain * vin)) } : null;

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Transfer characteristic (Vout vs Vin)</h3>
        <span className="text-xs text-slate-500">Saturation knees at Vin = {formatSI(vmax / gain, "V", 3)} / {formatSI(vmin / gain, "V", 3)}</span>
      </div>
      <div className="p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-slate-400" role="img" aria-label="Transfer characteristic">
          <line x1={pad} y1={H / 2} x2={W - pad} y2={H / 2} stroke="currentColor" strokeOpacity={0.5} />
          <line x1={W / 2} y1={8} x2={W / 2} y2={H - 8} stroke="currentColor" strokeOpacity={0.5} />
          <line x1={pad} y1={y(vmax)} x2={W - pad} y2={y(vmax)} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.6} />
          <line x1={pad} y1={y(vmin)} x2={W - pad} y2={y(vmin)} stroke="#ef4444" strokeDasharray="4 4" strokeOpacity={0.6} />
          <polyline points={pts.join(" ")} fill="none" stroke="#8b5cf6" strokeWidth={2.5} />
          {op && <circle cx={op.cx} cy={op.cy} r={5} fill="#f59e0b" stroke="white" strokeWidth={1.5} />}
          <text x={W - pad} y={H / 2 - 6} textAnchor="end" fontSize={11} fill="currentColor">Vin</text>
          <text x={W / 2 + 6} y={18} fontSize={11} fill="currentColor">Vout</text>
          <text x={pad} y={y(vmax) - 4} fontSize={10} fill="#ef4444">+Vsat {formatSI(vmax, "V", 3)}</text>
          <text x={pad} y={y(vmin) + 12} fontSize={10} fill="#ef4444">−Vsat {formatSI(vmin, "V", 3)}</text>
        </svg>
      </div>
    </div>
  );
}
