"use client";

import { Cog, Gauge, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import SIInput from "@/components/ui/SIInput";
import ResultTile from "@/components/ui/ResultTile";
import {
  pfCorrection,
  solveInductionMotor,
  solveThreePhase,
  solveTransformer,
  transformerEfficiency,
  type Connection,
} from "@/utils/power";
import { formatResistance, formatSI, parseSI, toSig } from "@/utils/units";
import { cn } from "@/utils/cn";

type Tab = "three-phase" | "machines";

export default function PowerMachines() {
  const [tab, setTab] = useState<Tab>("three-phase");
  return (
    <div className="space-y-6">
      <div className="seg" role="tablist" aria-label="Calculator">
        {(
          [
            ["three-phase", "3-Phase Power"],
            ["machines", "Transformer & Motor"],
          ] as [Tab, string][]
        ).map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={cn("seg-btn", tab === id && "seg-btn-active")}>
            {label}
          </button>
        ))}
      </div>
      {tab === "three-phase" ? <ThreePhaseCalculator /> : <MachinesCalculator />}
    </div>
  );
}

/* =============================== 3-phase power =============================== */

const fmtP = (w: number, unit: string) => formatSI(w, unit, 4);

function ThreePhaseCalculator() {
  const [connection, setConnection] = useState<Connection>("star");
  const [known, setKnown] = useState<"current" | "power">("current");
  const [vl, setVl] = useState("400");
  const [il, setIl] = useState("25");
  const [pIn, setPIn] = useState("15k");
  const [pf, setPf] = useState("0.8");
  const [lagging, setLagging] = useState(true);
  const [freq, setFreq] = useState("50");
  const [targetPf, setTargetPf] = useState("0.95");

  const V = parseSI(vl);
  const PF = parseSI(pf);
  const f = parseSI(freq);
  const result = useMemo(
    () =>
      solveThreePhase({
        connection,
        vLine: V,
        pf: PF,
        lagging,
        ...(known === "current" ? { iLine: parseSI(il) } : { P: parseSI(pIn) }),
      }),
    [connection, V, PF, lagging, known, il, pIn],
  );
  const pf2 = parseSI(targetPf);
  const correction = useMemo(
    () => (result && lagging ? pfCorrection(result.P, result.pf, pf2, result.vLine, f) : null),
    [result, lagging, pf2, f],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <section className="card h-fit">
        <div className="card-header flex-wrap">
          <h2 className="card-title flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" /> Balanced 3-phase load
          </h2>
        </div>
        <div className="space-y-3 p-4">
          <div>
            <span className="label">Connection</span>
            <div className="seg w-full">
              {(["star", "delta"] as Connection[]).map((c) => (
                <button key={c} type="button" onClick={() => setConnection(c)} className={cn("seg-btn flex-1", connection === c && "seg-btn-active")} aria-pressed={connection === c}>
                  {c === "star" ? "Star (Y)" : "Delta (Δ)"}
                </button>
              ))}
            </div>
          </div>
          <SIInput label="Line voltage V_L" unit="V" value={vl} onChange={setVl} allowNegative={false} hint="Line-to-line RMS, e.g. 400, 415, 11k" />
          <div>
            <span className="label">Known quantity</span>
            <div className="seg w-full">
              <button type="button" onClick={() => setKnown("current")} className={cn("seg-btn flex-1", known === "current" && "seg-btn-active")}>Line current</button>
              <button type="button" onClick={() => setKnown("power")} className={cn("seg-btn flex-1", known === "power" && "seg-btn-active")}>Active power</button>
            </div>
          </div>
          {known === "current" ? (
            <SIInput label="Line current I_L" unit="A" value={il} onChange={setIl} allowNegative={false} />
          ) : (
            <SIInput label="Active power P" unit="W" value={pIn} onChange={setPIn} allowNegative={false} hint="e.g. 15k = 15 kW" />
          )}
          <div className="grid grid-cols-2 gap-3">
            <SIInput label="Power factor" unit="" value={pf} onChange={setPf} allowNegative={false} hint="0 < pf ≤ 1" />
            <div>
              <span className="label">PF type</span>
              <div className="seg w-full">
                <button type="button" onClick={() => setLagging(true)} className={cn("seg-btn flex-1 px-2", lagging && "seg-btn-active")}>Lag</button>
                <button type="button" onClick={() => setLagging(false)} className={cn("seg-btn flex-1 px-2", !lagging && "seg-btn-active")}>Lead</button>
              </div>
            </div>
          </div>
          <SIInput label="Frequency" unit="Hz" value={freq} onChange={setFreq} allowNegative={false} />
        </div>
        <div className="border-t border-slate-200 p-4 font-mono text-xs leading-6 text-slate-500 dark:border-slate-800 dark:text-slate-400">
          {connection === "star" ? (
            <>V_L = √3·V_ph, I_L = I_ph</>
          ) : (
            <>V_L = V_ph, I_L = √3·I_ph</>
          )}
          <br />S = √3·V_L·I_L, P = S·cos φ, Q = S·sin φ
        </div>
      </section>

      <div className="space-y-6">
        {!result ? (
          <div className="card p-6 text-center text-sm text-slate-500">Enter a valid line voltage, current/power and power factor (0–1).</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <ResultTile label="Active power P" value={fmtP(result.P, "W")} highlight />
              <ResultTile label="Reactive power Q" value={fmtP(result.Q, "VAR")} sub={lagging ? "inductive (lagging)" : "capacitive (leading)"} highlight />
              <ResultTile label="Apparent power S" value={fmtP(result.S, "VA")} highlight />
              <ResultTile label="Line V / I" value={`${formatSI(result.vLine, "V", 4)}`} sub={formatSI(result.iLine, "A", 4)} />
              <ResultTile label="Phase V / I" value={`${formatSI(result.vPhase, "V", 4)}`} sub={formatSI(result.iPhase, "A", 4)} />
              <ResultTile label="Power angle φ" value={`${toSig(result.phiDeg, 4)}°`} sub={`Z_ph = ${formatResistance(result.zPhase)}`} />
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Power triangle</h3>
                  <span className="font-mono text-xs text-slate-500">pf {toSig(result.pf, 3)}{correction ? ` → ${toSig(pf2, 3)}` : ""}</span>
                </div>
                <div className="p-4">
                  <PowerTriangle P={result.P} Q={result.Q} Qnew={correction ? result.Q - correction.Qc : undefined} />
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Power-factor correction</h3>
                </div>
                <div className="space-y-3 p-4">
                  {!lagging ? (
                    <p className="text-sm text-slate-500">The load is already leading — capacitive correction is not applicable (use a reactor instead).</p>
                  ) : (
                    <>
                      <SIInput label="Target power factor" unit="" value={targetPf} onChange={setTargetPf} allowNegative={false} hint={`Must be above the present ${toSig(result.pf, 3)}`} />
                      {correction ? (
                        <div className="grid grid-cols-2 gap-3">
                          <ResultTile label="Capacitor kVAR" value={fmtP(correction.Qc, "VAR")} highlight />
                          <ResultTile label="New line current" value={formatSI(correction.iLineNew, "A", 4)} sub={`was ${formatSI(result.iLine, "A", 4)}`} />
                          <ResultTile label="C per phase (Δ bank)" value={formatSI(correction.cDelta, "F", 4)} sub="each capacitor across V_L" />
                          <ResultTile label="C per phase (Y bank)" value={formatSI(correction.cStar, "F", 4)} sub="each capacitor across V_ph" />
                        </div>
                      ) : (
                        <p className="text-sm text-amber-600 dark:text-amber-400">Enter a target power factor higher than {toSig(result.pf, 3)} and ≤ 1.</p>
                      )}
                      <p className="font-mono text-[11px] text-slate-400">Q_c = P·(tan φ₁ − tan φ₂), C_Δ = Q_c / (3·ω·V_L²)</p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PowerTriangle({ P, Q, Qnew }: { P: number; Q: number; Qnew?: number }) {
  const W = 380;
  const H = 230;
  const pad = 30;
  const labelRoom = 110; // space right of the Q arrow for its label
  const maxQ = Math.max(Math.abs(Q), Math.abs(Qnew ?? 0), 1e-12);
  const scale = Math.min((W - pad - labelRoom) / P, (H - 2 * pad) / maxQ);
  const ox = pad;
  const lagging = Q >= 0;
  const oy = lagging ? H - pad : pad;
  const px = ox + P * scale;
  const qy = (q: number) => oy - q * scale;
  const phi = (Math.atan2(Math.abs(Q), P) * 180) / Math.PI;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-md" role="img" aria-label="Power triangle">
      <defs>
        {[
          ["arrow-p", "#06b6d4"],
          ["arrow-q", "#8b5cf6"],
          ["arrow-s", "#f59e0b"],
        ].map(([id, color]) => (
          <marker key={id} id={id} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={color} />
          </marker>
        ))}
      </defs>
      {Qnew !== undefined && (
        <g className="text-emerald-500" stroke="currentColor" strokeWidth={2} strokeDasharray="5 4" fill="none">
          <line x1={ox} y1={oy} x2={px} y2={qy(Qnew)} />
          <line x1={px} y1={oy} x2={px} y2={qy(Qnew)} />
        </g>
      )}
      <g fill="none" strokeWidth={3}>
        <line x1={ox} y1={oy} x2={px} y2={oy} className="stroke-cyan-500" markerEnd="url(#arrow-p)" />
        <line x1={px} y1={oy} x2={px} y2={qy(Q)} className="stroke-violet-500" markerEnd="url(#arrow-q)" />
        <line x1={ox} y1={oy} x2={px} y2={qy(Q)} className="stroke-amber-500" markerEnd="url(#arrow-s)" />
      </g>
      <path
        d={`M${ox + 34},${oy} A34,34 0 0 ${lagging ? 0 : 1} ${ox + 34 * Math.cos((phi * Math.PI) / 180)},${oy - (lagging ? 1 : -1) * 34 * Math.sin((phi * Math.PI) / 180)}`}
        fill="none"
        stroke="#64748b"
        strokeWidth={1.5}
      />
      <g fontSize={12} fontWeight={600} className="font-mono">
        <text x={(ox + px) / 2} y={oy + (lagging ? 18 : -8)} textAnchor="middle" className="fill-cyan-600 dark:fill-cyan-400">P = {formatSI(P, "W", 3)}</text>
        <text x={px + 8} y={qy(Q) + (lagging ? 12 : -4)} className="fill-violet-600 dark:fill-violet-400">Q = {formatSI(Math.abs(Q), "VAR", 3)}</text>
        <text x={(ox + px) / 2 - 8} y={(oy + qy(Q)) / 2 - 8} textAnchor="end" className="fill-amber-600 dark:fill-amber-400">S = {formatSI(Math.hypot(P, Q), "VA", 3)}</text>
        <text x={ox + 40} y={oy - (lagging ? 6 : -16)} className="fill-slate-500">φ {toSig(phi, 3)}°</text>
        {Qnew !== undefined && (
          <text x={px + 8} y={lagging ? Math.max(qy(Qnew) + 4, qy(Q) + 30) : Math.min(qy(Qnew) + 4, qy(Q) - 22)} className="fill-emerald-600 dark:fill-emerald-400" fontSize={11}>
            Q′ = {formatSI(Math.abs(Qnew), "VAR", 3)}
          </text>
        )}
      </g>
    </svg>
  );
}

/* ========================== Transformer & induction motor ========================== */

function MachinesCalculator() {
  // Transformer ratio
  const [vp, setVp] = useState("230");
  const [np, setNp] = useState("1000");
  const [ns, setNs] = useState("50");
  const [is, setIs] = useState("2");
  // Efficiency
  const [rating, setRating] = useState("10k");
  const [load, setLoad] = useState("1");
  const [effPf, setEffPf] = useState("0.8");
  const [pi, setPi] = useState("150");
  const [pcu, setPcu] = useState("300");
  // Motor
  const [mf, setMf] = useState("50");
  const [poles, setPoles] = useState(4);
  const [nr, setNr] = useState("1440");
  const [pOut, setPOut] = useState("7.5k");

  const tr = useMemo(() => solveTransformer(parseSI(vp), parseSI(np), parseSI(ns), Number.isFinite(parseSI(is)) ? parseSI(is) : undefined), [vp, np, ns, is]);
  const eff = useMemo(
    () => transformerEfficiency(parseSI(rating), parseSI(load), parseSI(effPf), parseSI(pi), parseSI(pcu)),
    [rating, load, effPf, pi, pcu],
  );
  const motor = useMemo(() => {
    const n = parseSI(nr);
    const p = parseSI(pOut);
    return solveInductionMotor(parseSI(mf), poles, Number.isFinite(n) ? n : undefined, Number.isFinite(p) ? p : undefined);
  }, [mf, poles, nr, pOut]);

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {/* Transformer */}
      <section className="card">
        <div className="card-header">
          <h2 className="card-title flex items-center gap-2">
            <Gauge className="h-4 w-4 text-sky-500" /> Transformer
          </h2>
          {tr && <span className="chip border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300">{tr.type}</span>}
        </div>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <SIInput label="Primary voltage V_p" unit="V" value={vp} onChange={setVp} />
          <SIInput label="Secondary current I_s" unit="A" value={is} onChange={setIs} allowNegative={false} hint="Optional — for I_p and VA" />
          <SIInput label="Primary turns N_p" unit="" value={np} onChange={setNp} allowNegative={false} />
          <SIInput label="Secondary turns N_s" unit="" value={ns} onChange={setNs} allowNegative={false} />
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 pb-4 sm:grid-cols-4">
          <ResultTile label="Turns ratio a" value={tr ? `${toSig(tr.turnsRatio, 4)} : 1` : "—"} highlight />
          <ResultTile label="Secondary V_s" value={tr ? formatSI(tr.vSecondary, "V", 4) : "—"} highlight />
          <ResultTile label="Primary I_p" value={tr?.iPrimary !== undefined ? formatSI(tr.iPrimary, "A", 4) : "—"} />
          <ResultTile label="Load S" value={tr?.sLoad !== undefined ? formatSI(tr.sLoad, "VA", 4) : "—"} />
        </div>

        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <h3 className="label">Efficiency at load</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <SIInput label="Rating S" unit="VA" value={rating} onChange={setRating} allowNegative={false} hint="e.g. 10k = 10 kVA" />
            <SIInput label="Load fraction x" unit="" value={load} onChange={setLoad} allowNegative={false} hint="1 = full load, 0.5 = half load" />
            <SIInput label="Load power factor" unit="" value={effPf} onChange={setEffPf} allowNegative={false} />
            <SIInput label="Iron (core) loss P_i" unit="W" value={pi} onChange={setPi} allowNegative={false} hint="Constant, from open-circuit test" />
            <SIInput label="Full-load copper loss" unit="W" value={pcu} onChange={setPcu} allowNegative={false} hint="From short-circuit test" className="sm:col-span-2" />
          </div>
          <div className="mt-1 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ResultTile label="Efficiency η" value={eff ? `${toSig(eff.efficiency * 100, 4)} %` : "—"} highlight />
            <ResultTile label="Output" value={eff ? formatSI(eff.output, "W", 4) : "—"} />
            <ResultTile label="Total losses" value={eff ? formatSI(eff.totalLoss, "W", 4) : "—"} sub={eff ? `Cu ${formatSI(eff.copperLoss, "W", 3)}` : undefined} />
            <ResultTile
              label="Max η at"
              value={eff && Number.isFinite(eff.maxEffLoad) ? `${toSig(eff.maxEffLoad * 100, 3)} % load` : "—"}
              sub={eff ? `η_max = ${toSig(eff.maxEfficiency * 100, 4)} %` : undefined}
            />
          </div>
          <p className="mt-3 font-mono text-[11px] text-slate-400">η = x·S·pf / (x·S·pf + P_i + x²·P_cu) · max when x = √(P_i / P_cu)</p>
        </div>
      </section>

      {/* Induction motor */}
      <section className="card h-fit">
        <div className="card-header">
          <h2 className="card-title flex items-center gap-2">
            <Cog className="h-4 w-4 text-emerald-500" /> Induction motor
          </h2>
        </div>
        <div className="space-y-3 p-4">
          <SIInput label="Supply frequency f" unit="Hz" value={mf} onChange={setMf} allowNegative={false} />
          <div>
            <span className="label">Number of poles P</span>
            <div className="flex flex-wrap gap-1.5">
              {[2, 4, 6, 8, 10, 12].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPoles(p)}
                  aria-pressed={poles === p}
                  className={cn(
                    "min-w-11 rounded-lg border px-3 py-1.5 font-mono text-sm font-semibold transition",
                    poles === p ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <SIInput label="Rotor speed N_r" unit="rpm" value={nr} onChange={setNr} allowNegative={false} hint="Measured / nameplate speed" />
          <SIInput label="Shaft output power" unit="W" value={pOut} onChange={setPOut} allowNegative={false} hint="Optional — for torque, e.g. 7.5k" />
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 pb-4">
          <ResultTile label="Synchronous speed N_s" value={motor ? `${toSig(motor.syncSpeed, 5)} rpm` : "—"} sub="N_s = 120·f / P" highlight />
          <ResultTile
            label="Slip s"
            value={motor?.slip !== undefined ? `${toSig(motor.slip * 100, 4)} %` : "—"}
            sub="(N_s − N_r) / N_s"
            highlight
            tone={motor?.slip !== undefined && (motor.slip < 0 || motor.slip > 1) ? "warning" : "default"}
          />
          <ResultTile label="Rotor frequency f_r" value={motor?.rotorFrequency !== undefined ? formatSI(motor.rotorFrequency, "Hz", 4) : "—"} sub="f_r = s·f" />
          <ResultTile label="Shaft torque" value={motor?.torque !== undefined ? `${toSig(motor.torque, 4)} N·m` : "—"} sub="T = P / ω_r" />
        </div>
        {motor?.slip !== undefined && (motor.slip < 0 || motor.slip > 1) && (
          <p className="px-4 pb-4 text-xs text-amber-600 dark:text-amber-400">
            {motor.slip < 0 ? "Rotor faster than N_s → negative slip: the machine is generating." : "Slip > 100 % → rotor turning against the field (plugging / braking)."}
          </p>
        )}
        {motor && (
          <div className="border-t border-slate-200 p-4 dark:border-slate-800">
            <SpeedBar sync={motor.syncSpeed} rotor={parseSI(nr)} />
          </div>
        )}
      </section>
    </div>
  );
}

function SpeedBar({ sync, rotor }: { sync: number; rotor: number }) {
  const max = Math.max(sync, Number.isFinite(rotor) ? rotor : 0) * 1.1;
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / max) * 100))}%`;
  return (
    <div>
      <p className="label">Speed comparison</p>
      <div className="relative h-8 rounded-lg bg-slate-100 dark:bg-slate-800">
        {Number.isFinite(rotor) && <div className="absolute inset-y-0 left-0 rounded-lg bg-emerald-500/70" style={{ width: pct(rotor) }} />}
        <div className="absolute inset-y-[-4px] w-0.5 bg-amber-500" style={{ left: pct(sync) }} />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[11px] text-slate-500">
        <span>0 rpm</span>
        <span className="text-emerald-600 dark:text-emerald-400">N_r {Number.isFinite(rotor) ? toSig(rotor, 5) : "—"}</span>
        <span className="text-amber-600 dark:text-amber-400">N_s {toSig(sync, 5)}</span>
      </div>
    </div>
  );
}
