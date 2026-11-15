"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import SIInput from "@/components/ui/SIInput";
import ResultTile from "@/components/ui/ResultTile";
import ChartCard, { TOOLTIP_STYLE } from "@/components/ui/ChartCard";
import {
  analyzeRLC,
  lowPassGainDb,
  rcCharge,
  rcCutoff,
  rcTimeConstant,
  rlCutoff,
  rlTimeConstant,
} from "@/utils/electrical";
import { formatResistance, formatSI, parseSI, toSig } from "@/utils/units";
import { cn } from "@/utils/cn";

type Mode = "RC" | "RL" | "RLC";

const MODES: { id: Mode; label: string }[] = [
  { id: "RC", label: "RC circuit" },
  { id: "RL", label: "RL circuit" },
  { id: "RLC", label: "Series RLC" },
];

const positive = (s: string) => {
  const v = parseSI(s);
  return v > 0 ? v : NaN;
};

export default function RCRLCCalculator() {
  const [mode, setMode] = useState<Mode>("RC");
  const [rStr, setR] = useState("10k");
  const [cStr, setC] = useState("100n");
  const [lStr, setL] = useState("10m");
  const [vsStr, setVs] = useState("5");

  const R = positive(rStr);
  const C = positive(cStr);
  const L = positive(lStr);
  const Vs = parseSI(vsStr);

  const first = useMemo(() => {
    if (mode === "RC" && R > 0 && C > 0) return { tau: rcTimeConstant(R, C), fc: rcCutoff(R, C) };
    if (mode === "RL" && R > 0 && L > 0) return { tau: rlTimeConstant(R, L), fc: rlCutoff(R, L) };
    return null;
  }, [mode, R, C, L]);

  const rlc = useMemo(() => (mode === "RLC" ? analyzeRLC(R, L, C) : null), [mode, R, L, C]);

  const transient = useMemo(() => {
    if (!first || !Number.isFinite(Vs)) return [];
    const pts = [];
    for (let i = 0; i <= 100; i++) {
      const t = (i / 100) * 5 * first.tau;
      pts.push({ t, tn: i / 20, v: rcCharge(Vs, t, first.tau) });
    }
    return pts;
  }, [first, Vs]);

  const bode = useMemo(() => {
    if (!first) return [];
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const f = first.fc * Math.pow(10, -2 + (i / 80) * 4);
      pts.push({ logf: Math.log10(f), f, lp: lowPassGainDb(f, first.fc), hp: lowPassGainDb(first.fc, f) });
    }
    return pts;
  }, [first]);

  const rlcStep = useMemo(() => {
    if (!rlc || !Number.isFinite(Vs) || !(C > 0) || !(L > 0)) return [];
    // Capacitor voltage of a series RLC driven by a step Vs.
    const { alpha, omega0 } = rlc;
    const period = (2 * Math.PI) / omega0;
    let tEnd: number;
    if (rlc.damping === "Underdamped") tEnd = Math.min(Math.max(5 / alpha, 3 * period), 40 * period);
    else if (rlc.damping === "Critically damped") tEnd = 8 / alpha;
    else tEnd = 6 / (alpha - Math.sqrt(alpha ** 2 - omega0 ** 2));
    const pts = [];
    for (let i = 0; i <= 300; i++) {
      const t = (i / 300) * tEnd;
      let v: number;
      if (rlc.damping === "Underdamped") {
        const wd = Math.sqrt(omega0 ** 2 - alpha ** 2);
        v = Vs * (1 - Math.exp(-alpha * t) * (Math.cos(wd * t) + (alpha / wd) * Math.sin(wd * t)));
      } else if (rlc.damping === "Critically damped") {
        v = Vs * (1 - Math.exp(-alpha * t) * (1 + alpha * t));
      } else {
        const s = Math.sqrt(alpha ** 2 - omega0 ** 2);
        const s1 = -alpha + s;
        const s2 = -alpha - s;
        v = Vs * (1 - (s2 * Math.exp(s1 * t) - s1 * Math.exp(s2 * t)) / (s2 - s1));
      }
      pts.push({ t, v });
    }
    return pts;
  }, [rlc, Vs, C, L]);

  return (
    <div className="space-y-6">
      <div className="seg" role="tablist" aria-label="Circuit type">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            type="button"
            onClick={() => {
              setMode(m.id);
              // Swap the untouched default R for one that gives an interesting (underdamped) RLC demo.
              if (m.id === "RLC" && rStr === "10k") setR("47");
              if (m.id !== "RLC" && rStr === "47") setR("10k");
            }}
            className={cn("seg-btn", mode === m.id && "seg-btn-active")}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <section className="card h-fit">
          <div className="card-header">
            <h2 className="card-title">Component values</h2>
          </div>
          <div className="space-y-2 p-4">
            <SIInput label="Resistance R" unit="Ω" value={rStr} onChange={setR} allowNegative={false} hint={Number.isFinite(R) ? formatResistance(R) : "e.g. 10k"} />
            {mode !== "RL" && (
              <SIInput label="Capacitance C" unit="F" value={cStr} onChange={setC} allowNegative={false} hint={Number.isFinite(C) ? formatSI(C, "F") : "e.g. 100n"} />
            )}
            {mode !== "RC" && (
              <SIInput label="Inductance L" unit="H" value={lStr} onChange={setL} allowNegative={false} hint={Number.isFinite(L) ? formatSI(L, "H") : "e.g. 10m"} />
            )}
            <SIInput label="Step / source voltage Vs" unit="V" value={vsStr} onChange={setVs} hint="Used for the transient plot" />
          </div>
          <div className="border-t border-slate-200 p-4 font-mono text-xs leading-6 text-slate-500 dark:border-slate-800 dark:text-slate-400">
            {mode === "RC" && (
              <>
                τ = R·C<br />f<sub>c</sub> = 1 / (2π·R·C)<br />v<sub>C</sub>(t) = Vs·(1 − e<sup>−t/τ</sup>)
              </>
            )}
            {mode === "RL" && (
              <>
                τ = L / R<br />f<sub>c</sub> = R / (2π·L)<br />i<sub>L</sub>(t) = (Vs/R)·(1 − e<sup>−t/τ</sup>)
              </>
            )}
            {mode === "RLC" && (
              <>
                f<sub>r</sub> = 1 / (2π·√(L·C))<br />Q = (1/R)·√(L/C)<br />ζ = (R/2)·√(C/L), BW = f<sub>r</sub>/Q
              </>
            )}
          </div>
        </section>

        <div className="space-y-6">
          {mode !== "RLC" && (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <ResultTile label="Time constant τ" value={first ? formatSI(first.tau, "s") : "—"} highlight />
                <ResultTile label="Cutoff fc (−3 dB)" value={first ? formatSI(first.fc, "Hz") : "—"} highlight />
                <ResultTile label="Settling (5τ)" value={first ? formatSI(5 * first.tau, "s") : "—"} sub="≈ 99.3% of final" />
                <ResultTile label="ωc" value={first ? formatSI(2 * Math.PI * first.fc, "rad/s") : "—"} />
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <ChartCard
                  title={mode === "RC" ? "Step response — capacitor voltage" : "Step response — normalised current (×Vs/R)"}
                  subtitle="Markers at 1τ (63.2%) … 5τ (99.3%)"
                >
                  {transient.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={transient} margin={{ top: 8, right: 16, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                        <XAxis
                          dataKey="tn"
                          type="number"
                          domain={[0, 5]}
                          ticks={[0, 1, 2, 3, 4, 5]}
                          tickFormatter={(v: number) => `${v}τ`}
                          tick={{ fontSize: 11 }}
                          stroke="#94a3b8"
                          label={{ value: `t  (τ = ${first ? formatSI(first.tau, "s") : ""})`, position: "insideBottom", offset: -10, fontSize: 11, fill: "#94a3b8" }}
                        />
                        <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" tickFormatter={(v: number) => toSig(v, 3)} width={44} />
                        <Tooltip
                          formatter={(v) => [formatSI(Number(v), mode === "RC" ? "V" : "V·(1/R)"), mode === "RC" ? "v_C" : "i_L·R"]}
                          labelFormatter={(l) => `t = ${toSig(Number(l), 3)}τ = ${first ? formatSI(Number(l) * first.tau, "s") : ""}`}
                          contentStyle={TOOLTIP_STYLE}
                        />
                        {[1, 2, 3, 4, 5].map((n) => (
                          <ReferenceLine key={n} x={n} stroke="#06b6d4" strokeOpacity={0.35} strokeDasharray="4 4" />
                        ))}
                        <ReferenceLine y={Vs * 0.632} stroke="#f59e0b" strokeDasharray="4 4" strokeOpacity={0.6} />
                        <Line type="monotone" dataKey="v" stroke="#06b6d4" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>

                <ChartCard title="Frequency response (first-order)" subtitle="Low-pass across C / R, high-pass across the other element">
                  {bode.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={bode} margin={{ top: 8, right: 16, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                        <XAxis
                          dataKey="logf"
                          type="number"
                          domain={["dataMin", "dataMax"]}
                          tickCount={5}
                          tickFormatter={(v: number) => formatSI(Math.pow(10, v), "Hz", 2)}
                          tick={{ fontSize: 11 }}
                          stroke="#94a3b8"
                          label={{ value: "Frequency (log)", position: "insideBottom", offset: -10, fontSize: 11, fill: "#94a3b8" }}
                        />
                        <YAxis domain={[-40, 3]} ticks={[0, -10, -20, -30, -40]} allowDataOverflow tick={{ fontSize: 11 }} stroke="#94a3b8" width={52} tickFormatter={(v: number) => `${v} dB`} />
                        <Tooltip
                          formatter={(v, name) => [`${toSig(Number(v), 3)} dB`, name === "lp" ? "Low-pass" : "High-pass"]}
                          labelFormatter={(l) => formatSI(Math.pow(10, Number(l)), "Hz")}
                          contentStyle={TOOLTIP_STYLE}
                        />
                        <ReferenceLine y={-3} stroke="#f59e0b" strokeDasharray="4 4" />
                        {first && <ReferenceLine x={Math.log10(first.fc)} stroke="#f59e0b" strokeDasharray="4 4" />}
                        <Line type="monotone" dataKey="lp" stroke="#06b6d4" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                        <Line type="monotone" dataKey="hp" stroke="#8b5cf6" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </ChartCard>
              </div>
            </>
          )}

          {mode === "RLC" && (
            <>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <ResultTile label="Resonant freq. fr" value={rlc ? formatSI(rlc.fr, "Hz") : "—"} highlight />
                <ResultTile label="Q factor (series)" value={rlc ? toSig(rlc.qSeries, 4) : "—"} highlight sub={rlc ? `Parallel Q = ${toSig(rlc.qParallel, 3)}` : undefined} />
                <ResultTile label="Bandwidth" value={rlc ? formatSI(rlc.bandwidthSeries, "Hz") : "—"} sub="−3 dB, series" />
                <ResultTile
                  label="Damping ratio ζ"
                  value={rlc ? toSig(rlc.zeta, 4) : "—"}
                  sub={rlc?.damping}
                  tone={rlc && rlc.damping === "Underdamped" && rlc.zeta < 0.2 ? "warning" : "default"}
                />
                <ResultTile label="ω₀" value={rlc ? formatSI(rlc.omega0, "rad/s") : "—"} />
                <ResultTile label="XL = XC at fr" value={rlc ? formatResistance(rlc.reactanceAtResonance) : "—"} />
                <ResultTile label="Neper freq. α" value={rlc ? formatSI(rlc.alpha, "Np/s") : "—"} sub="R / 2L" />
                <ResultTile label="Envelope τ" value={rlc ? formatSI(1 / rlc.alpha, "s") : "—"} sub="2L / R" />
              </div>
              <ChartCard title={`Step response — capacitor voltage (${rlc?.damping ?? "—"})`} subtitle="Series RLC driven by a voltage step Vs">
                {rlcStep.length > 0 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rlcStep} margin={{ top: 8, right: 16, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                      <XAxis
                        dataKey="t"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        tickFormatter={(v: number) => formatSI(v, "s", 2)}
                        tick={{ fontSize: 11 }}
                        stroke="#94a3b8"
                        label={{ value: "Time", position: "insideBottom", offset: -10, fontSize: 11, fill: "#94a3b8" }}
                      />
                      <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" width={44} tickFormatter={(v: number) => toSig(v, 3)} />
                      <Tooltip formatter={(v) => [formatSI(Number(v), "V"), "v_C"]} labelFormatter={(l) => `t = ${formatSI(Number(l), "s")}`} contentStyle={TOOLTIP_STYLE} />
                      <ReferenceLine y={Vs} stroke="#f59e0b" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="v" stroke="#8b5cf6" strokeWidth={2.5} dot={false} isAnimationActive={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </ChartCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
