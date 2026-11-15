"use client";

import { ArrowUpDown, Download, FlaskConical, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Scatter,
  ComposedChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import ChartCard, { TOOLTIP_STYLE } from "@/components/ui/ChartCard";
import ResultTile from "@/components/ui/ResultTile";
import { linearFit } from "@/utils/electrical";
import { downloadCSV, toCSV } from "@/utils/csv";
import { formatResistance, formatSI, parseSI, toSig } from "@/utils/units";
import { cn } from "@/utils/cn";

type CurrentUnit = "A" | "mA" | "µA";
const UNIT_SCALE: Record<CurrentUnit, number> = { A: 1, mA: 1e-3, µA: 1e-6 };

interface Row {
  id: string;
  v: string;
  i: string;
}

interface Point {
  id: string;
  index: number;
  v: number;
  /** Current in amperes. */
  iA: number;
  /** Current in display unit. */
  i: number;
}

const STORAGE_KEY = "eee-lab-plotter-v1";

let idCounter = 0;
const newId = () => `r${Date.now().toString(36)}${(idCounter++).toString(36)}`;

const SAMPLES: { label: string; unit: CurrentUnit; data: [number, number][] }[] = [
  {
    label: "Si diode (1N4148)",
    unit: "mA",
    data: [
      [0, 0], [0.2, 0.0001], [0.4, 0.002], [0.5, 0.03], [0.55, 0.1], [0.6, 0.35],
      [0.62, 0.6], [0.65, 1.3], [0.68, 2.8], [0.7, 4.6], [0.72, 7.2], [0.75, 13],
    ],
  },
  {
    label: "Red LED",
    unit: "mA",
    data: [[0, 0], [1.0, 0], [1.5, 0.01], [1.6, 0.1], [1.7, 0.8], [1.75, 2], [1.8, 4.5], [1.85, 8], [1.9, 12], [2.0, 20]],
  },
  {
    label: "1 kΩ resistor",
    unit: "mA",
    data: [[0, 0], [1, 1.01], [2, 1.99], [3, 3.02], [4, 3.98], [5, 5.01], [6, 6.0], [8, 7.97], [10, 10.02]],
  },
];

const toRows = (data: [number, number][]): Row[] => data.map(([v, i]) => ({ id: newId(), v: String(v), i: String(i) }));

export default function LabPlotter() {
  const [rows, setRows] = useState<Row[]>(() => toRows(SAMPLES[0].data));
  const [unit, setUnit] = useState<CurrentUnit>("mA");
  const [title, setTitle] = useState("Experiment 1 — Diode forward characteristic");
  const [newV, setNewV] = useState("");
  const [newI, setNewI] = useState("");
  const [pointA, setPointA] = useState<string>("");
  const [pointB, setPointB] = useState<string>("");
  const [loaded, setLoaded] = useState(false);
  const vInputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Restore from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { rows?: Row[]; unit?: CurrentUnit; title?: string };
        if (Array.isArray(saved.rows)) setRows(saved.rows.map((r) => ({ id: newId(), v: String(r.v ?? ""), i: String(r.i ?? "") })));
        if (saved.unit && saved.unit in UNIT_SCALE) setUnit(saved.unit);
        if (typeof saved.title === "string") setTitle(saved.title);
      }
    } catch {
      /* ignore corrupt / unavailable storage */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ rows: rows.map(({ v, i }) => ({ v, i })), unit, title }));
    } catch {
      /* storage full / unavailable */
    }
  }, [rows, unit, title, loaded]);

  /** Valid points sorted by voltage. */
  const points: Point[] = useMemo(() => {
    const scale = UNIT_SCALE[unit];
    return rows
      .map((r) => ({ id: r.id, v: parseSI(r.v), i: parseSI(r.i) }))
      .filter((p) => Number.isFinite(p.v) && Number.isFinite(p.i))
      .sort((a, b) => a.v - b.v)
      .map((p, index) => ({ id: p.id, index: index + 1, v: p.v, i: p.i, iA: p.i * scale }));
  }, [rows, unit]);

  /** Dynamic (incremental) resistance between consecutive sorted points. */
  const dynamic = useMemo(
    () =>
      points.slice(1).map((p, k) => {
        const prev = points[k];
        const dV = p.v - prev.v;
        const dI = p.iA - prev.iA;
        return { id: p.id, vMid: (p.v + prev.v) / 2, dV, dI, rd: dI === 0 ? Infinity : dV / dI };
      }),
    [points],
  );
  const rdById = useMemo(() => new Map(dynamic.map((d) => [d.id, d])), [dynamic]);

  const fit = useMemo(() => linearFit(points.map((p) => p.iA), points.map((p) => p.v)), [points]);

  // Default the A/B selectors to the last two points.
  const a = points.find((p) => p.id === pointA) ?? points[points.length - 2];
  const b = points.find((p) => p.id === pointB) ?? points[points.length - 1];
  const abRd = a && b && b.iA !== a.iA ? (b.v - a.v) / (b.iA - a.iA) : NaN;

  const rdChart = dynamic.filter((d) => Number.isFinite(d.rd) && d.rd > 0).map((d) => ({ v: d.vMid, rd: d.rd }));

  const invalidCount = rows.filter((r) => (r.v.trim() || r.i.trim()) && !(Number.isFinite(parseSI(r.v)) && Number.isFinite(parseSI(r.i)))).length;

  /* ------------------------------- Actions ------------------------------- */

  const addRow = (e: FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(parseSI(newV)) || !Number.isFinite(parseSI(newI))) return;
    setRows((r) => [...r, { id: newId(), v: newV.trim(), i: newI.trim() }]);
    setNewV("");
    setNewI("");
    vInputRef.current?.focus();
  };

  const updateRow = (id: string, field: "v" | "i", value: string) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));

  const deleteRow = (id: string) => setRows((rs) => rs.filter((r) => r.id !== id));

  const sortRows = () =>
    setRows((rs) => [...rs].sort((x, y) => (parseSI(x.v) || 0) - (parseSI(y.v) || 0)));

  const loadSample = (idx: number) => {
    const s = SAMPLES[idx];
    setRows(toRows(s.data));
    setUnit(s.unit);
    setTitle(`${s.label} — V-I characteristic`);
    setPointA("");
    setPointB("");
  };

  const clearAll = () => {
    setRows([]);
    setPointA("");
    setPointB("");
  };

  const exportCSV = () => {
    const header = ["Index", "Voltage (V)", "Current (A)", `Current (${unit})`, "dV (V)", "dI (A)", "Dynamic resistance dV/dI (Ohm)"];
    const body = points.map((p) => {
      const d = rdById.get(p.id);
      const r = (x: number) => Number(x.toPrecision(10));
      return [p.index, r(p.v), r(p.iA), r(p.i), d ? r(d.dV) : "", d ? r(d.dI) : "", d ? (Number.isFinite(d.rd) ? r(d.rd) : "inf") : ""];
    });
    const meta = `# ${title}\r\n# Exported ${new Date().toISOString()} from EEE Smart Lab & Circuit Companion\r\n`;
    const safe = title.replace(/[^\w\-]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 60) || "vi_data";
    downloadCSV(`${safe}.csv`, meta + toCSV(header, body));
  };

  const importCSV = async (file: File) => {
    const text = await file.text();
    const parsed: Row[] = [];
    for (const line of text.split(/\r?\n/)) {
      if (!line.trim() || line.startsWith("#")) continue;
      const cells = line.split(/[,;\t]/).map((c) => c.trim().replace(/^"|"$/g, ""));
      const nums = cells.map((c) => parseSI(c)).filter((n) => Number.isFinite(n));
      // Accept "V,I" or "Index,V,I,…" (our own export format).
      if (cells.length >= 3 && nums.length >= 3 && Number.isInteger(nums[0])) parsed.push({ id: newId(), v: cells[1], i: String(Number(cells[2]) / UNIT_SCALE[unit]) });
      else if (nums.length >= 2) parsed.push({ id: newId(), v: cells[0], i: cells[1] });
    }
    if (parsed.length) setRows(parsed);
  };

  /* -------------------------------- Render ------------------------------- */

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input max-w-md flex-1 font-sans font-semibold"
          aria-label="Experiment title"
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportCSV} disabled={!points.length} className="btn btn-primary">
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <button type="button" onClick={() => fileRef.current?.click()} className="btn btn-secondary">
            <Upload className="h-4 w-4" /> Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importCSV(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="flex items-center gap-1 font-medium text-slate-500">
          <FlaskConical className="h-3.5 w-3.5" /> Sample data:
        </span>
        {SAMPLES.map((s, i) => (
          <button key={s.label} type="button" onClick={() => loadSample(i)} className="btn btn-secondary px-2.5 py-1 text-xs">
            {s.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <ResultTile label="Data points" value={points.length} sub={invalidCount ? `${invalidCount} invalid row(s) ignored` : "valid readings"} tone={invalidCount ? "warning" : "default"} />
        <ResultTile
          label="Linear fit R (slope V/I)"
          value={fit ? formatResistance(fit.slope) : "—"}
          sub={fit ? `R² = ${toSig(fit.r2, 4)}${fit.r2 < 0.98 ? " · non-linear device" : " · ohmic"}` : "need ≥ 2 points"}
          highlight
        />
        <ResultTile
          label={a && b ? `ΔV/ΔI  (P${a.index} → P${b.index})` : "ΔV/ΔI"}
          value={Number.isFinite(abRd) ? formatResistance(abRd) : "—"}
          sub={a && b ? `ΔV = ${formatSI(b.v - a.v, "V")}, ΔI = ${formatSI(b.iA - a.iA, "A")}` : "select two points"}
          highlight
        />
        <ResultTile
          label="Last-segment r_d"
          value={dynamic.length ? (Number.isFinite(dynamic[dynamic.length - 1].rd) ? formatResistance(dynamic[dynamic.length - 1].rd) : "∞") : "—"}
          sub="between the two highest-V points"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_440px]">
        <div className="space-y-6">
          <ChartCard
            title="V-I characteristic"
            subtitle={`Current (${unit}) vs voltage (V) — points sorted by voltage`}
            heightClass="h-80"
            actions={
              <div className="seg">
                {(Object.keys(UNIT_SCALE) as CurrentUnit[]).map((u) => (
                  <button key={u} type="button" onClick={() => setUnit(u)} className={cn("seg-btn px-2 py-1 text-xs", unit === u && "seg-btn-active")}>
                    {u}
                  </button>
                ))}
              </div>
            }
          >
            {points.length === 0 ? (
              <EmptyChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={points} margin={{ top: 10, right: 20, bottom: 24, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                  <XAxis
                    dataKey="v"
                    type="number"
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                    tickFormatter={(v: number) => toSig(v, 3)}
                    label={{ value: "Voltage (V)", position: "insideBottom", offset: -12, fontSize: 11, fill: "#94a3b8" }}
                  />
                  <YAxis
                    dataKey="i"
                    type="number"
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                    width={52}
                    tickFormatter={(v: number) => toSig(v, 3)}
                    label={{ value: `I (${unit})`, angle: -90, position: "insideLeft", offset: 12, fontSize: 11, fill: "#94a3b8" }}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelFormatter={(l) => `V = ${formatSI(Number(l), "V")}`}
                    formatter={(val) => [`${toSig(Number(val), 5)} ${unit}`, "Current"]}
                  />
                  <Line type="monotone" dataKey="i" stroke="#0ea5e9" strokeWidth={2.5} dot={false} activeDot={false} isAnimationActive={false} />
                  <Scatter dataKey="i" fill="#0ea5e9" isAnimationActive={false} />
                  {a && <ReferenceDot x={a.v} y={a.i} r={7} fill="none" stroke="#f59e0b" strokeWidth={2.5} />}
                  {b && <ReferenceDot x={b.v} y={b.i} r={7} fill="none" stroke="#f59e0b" strokeWidth={2.5} />}
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          <ChartCard title="Dynamic resistance r_d = ΔV / ΔI" subtitle="Per segment, plotted at segment mid-voltage (log scale)" heightClass="h-64">
            {rdChart.length < 1 ? (
              <EmptyChart text="Need at least two points with increasing current." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={rdChart} margin={{ top: 10, right: 20, bottom: 24, left: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                  <XAxis
                    dataKey="v"
                    type="number"
                    domain={["auto", "auto"]}
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                    tickFormatter={(v: number) => toSig(v, 3)}
                    label={{ value: "Voltage (V)", position: "insideBottom", offset: -12, fontSize: 11, fill: "#94a3b8" }}
                  />
                  <YAxis
                    scale="log"
                    domain={["auto", "auto"]}
                    allowDataOverflow
                    tick={{ fontSize: 11 }}
                    stroke="#94a3b8"
                    width={60}
                    tickFormatter={(v: number) => formatResistance(v, 2)}
                  />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE}
                    labelFormatter={(l) => `V ≈ ${formatSI(Number(l), "V")}`}
                    formatter={(val) => [formatResistance(Number(val)), "r_d"]}
                  />
                  <Line type="monotone" dataKey="rd" stroke="#8b5cf6" strokeWidth={2} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Data table */}
        <section className="card h-fit">
          <div className="card-header">
            <h2 className="card-title">Readings</h2>
            <div className="flex gap-1">
              <button type="button" onClick={sortRows} className="btn btn-ghost px-2 py-1 text-xs" title="Sort rows by voltage">
                <ArrowUpDown className="h-3.5 w-3.5" /> Sort
              </button>
              <button type="button" onClick={clearAll} className="btn btn-ghost px-2 py-1 text-xs text-red-600 dark:text-red-400" title="Remove all rows">
                <RotateCcw className="h-3.5 w-3.5" /> Clear
              </button>
            </div>
          </div>

          <form onSubmit={addRow} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
            <div>
              <label className="label" htmlFor="newV">Voltage (V)</label>
              <input id="newV" ref={vInputRef} value={newV} onChange={(e) => setNewV(e.target.value)} className="input" placeholder="0.65" inputMode="decimal" />
            </div>
            <div>
              <label className="label" htmlFor="newI">Current ({unit})</label>
              <input id="newI" value={newI} onChange={(e) => setNewI(e.target.value)} className="input" placeholder="1.3" inputMode="decimal" />
            </div>
            <button type="submit" className="btn btn-primary h-[38px]" disabled={!Number.isFinite(parseSI(newV)) || !Number.isFinite(parseSI(newI))}>
              <Plus className="h-4 w-4" /> <span className="sr-only sm:not-sr-only">Add</span>
            </button>
          </form>

          {(points.length >= 2) && (
            <div className="grid grid-cols-2 gap-2 border-b border-slate-200 p-3 text-xs dark:border-slate-800">
              <label className="flex flex-col gap-1">
                <span className="label mb-0">ΔV/ΔI from point</span>
                <select className="input py-1.5" value={a?.id ?? ""} onChange={(e) => setPointA(e.target.value)}>
                  {points.map((p) => (
                    <option key={p.id} value={p.id}>P{p.index} · {toSig(p.v, 4)} V</option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="label mb-0">to point</span>
                <select className="input py-1.5" value={b?.id ?? ""} onChange={(e) => setPointB(e.target.value)}>
                  {points.map((p) => (
                    <option key={p.id} value={p.id}>P{p.index} · {toSig(p.v, 4)} V</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <div className="max-h-[560px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] tracking-wide text-slate-500 uppercase dark:bg-slate-950 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">#</th>
                  <th className="px-2 py-2 text-left font-medium">V (V)</th>
                  <th className="px-2 py-2 text-left font-medium">I ({unit})</th>
                  <th className="px-2 py-2 text-right font-medium">r_d (Ω)</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-xs text-slate-500">
                      No readings yet — add a V/I pair above or load sample data.
                    </td>
                  </tr>
                )}
                {rows.map((r, idx) => {
                  const vBad = r.v.trim() !== "" && !Number.isFinite(parseSI(r.v));
                  const iBad = r.i.trim() !== "" && !Number.isFinite(parseSI(r.i));
                  const d = rdById.get(r.id);
                  return (
                    <tr key={r.id} className="group">
                      <td className="px-3 py-1 font-mono text-xs text-slate-400">{idx + 1}</td>
                      <td className="px-1 py-1">
                        <input
                          value={r.v}
                          onChange={(e) => updateRow(r.id, "v", e.target.value)}
                          className={cn("input px-2 py-1 text-xs", vBad && "border-red-400")}
                          aria-label={`Voltage row ${idx + 1}`}
                          inputMode="decimal"
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          value={r.i}
                          onChange={(e) => updateRow(r.id, "i", e.target.value)}
                          className={cn("input px-2 py-1 text-xs", iBad && "border-red-400")}
                          aria-label={`Current row ${idx + 1}`}
                          inputMode="decimal"
                        />
                      </td>
                      <td className="px-2 py-1 text-right font-mono text-[11px] whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {d ? (Number.isFinite(d.rd) ? formatResistance(d.rd, 3) : "∞") : "—"}
                      </td>
                      <td className="pr-2">
                        <button
                          type="button"
                          onClick={() => deleteRow(r.id)}
                          className="rounded p-1 text-slate-400 opacity-60 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                          aria-label={`Delete row ${idx + 1}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t border-slate-200 px-3 py-2 text-[11px] text-slate-400 dark:border-slate-800">
            r_d is computed against the previous point in voltage order. Data is saved in this browser automatically.
          </p>
        </section>
      </div>
    </div>
  );
}

function EmptyChart({ text = "Add readings to plot the curve." }: { text?: string }) {
  return <div className="flex h-full items-center justify-center text-sm text-slate-400">{text}</div>;
}
