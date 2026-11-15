"use client";

import { AlertTriangle, BookOpen, Filter, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  ALL_PIN_FUNCTIONS,
  DEVICES,
  FUNCTION_STYLES,
  PIN_FILL,
  type Device,
  type Pin,
  type PinFunction,
} from "@/data/pinouts";
import { cn } from "@/utils/cn";

function pinMatches(pin: Pin, query: string, fns: PinFunction[]): boolean {
  if (fns.length && !fns.some((f) => pin.functions.includes(f))) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = [pin.number, pin.name, ...(pin.alt ?? []), ...pin.functions, pin.description, pin.voltage, pin.notes ?? ""]
    .join(" ")
    .toLowerCase();
  return q.split(/\s+/).every((term) => hay.includes(term));
}

export default function PinoutReference() {
  const [deviceId, setDeviceId] = useState(DEVICES[0].id);
  const [query, setQuery] = useState("");
  const [fns, setFns] = useState<PinFunction[]>([]);
  const [selectedPin, setSelectedPin] = useState<string | null>(null);

  const device = DEVICES.find((d) => d.id === deviceId) ?? DEVICES[0];

  const available = useMemo(
    () => ALL_PIN_FUNCTIONS.filter((f) => device.pins.some((p) => p.functions.includes(f))),
    [device],
  );

  const matches = useMemo(() => new Set(device.pins.filter((p) => pinMatches(p, query, fns)).map((p) => p.id)), [device, query, fns]);

  /** Match counts across all devices — handy when searching e.g. "PWM". */
  const crossCounts = useMemo(
    () => Object.fromEntries(DEVICES.map((d) => [d.id, d.pins.filter((p) => pinMatches(p, query, fns)).length])),
    [query, fns],
  );

  const filtering = query.trim() !== "" || fns.length > 0;
  const toggleFn = (f: PinFunction) => setFns((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]));
  const selected = device.pins.find((p) => p.id === selectedPin) ?? null;

  const switchDevice = (id: string) => {
    setDeviceId(id);
    setSelectedPin(null);
    // Drop filters that don't exist on the new device.
    const d = DEVICES.find((x) => x.id === id);
    if (d) setFns((cur) => cur.filter((f) => d.pins.some((p) => p.functions.includes(f))));
  };

  return (
    <div className="space-y-6">
      {/* Device selector */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {DEVICES.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => switchDevice(d.id)}
            aria-pressed={d.id === deviceId}
            className={cn(
              "card relative p-3 text-left transition hover:border-cyan-400",
              d.id === deviceId && "border-cyan-500 ring-2 ring-cyan-500/30 dark:border-cyan-500",
            )}
          >
            <p className="text-sm font-semibold">{d.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{d.category}</p>
            <p className="mt-1 font-mono text-[11px] text-slate-400">{d.pins.length} pins · {d.package}</p>
            {filtering && (
              <span
                className={cn(
                  "absolute top-2 right-2 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
                  crossCounts[d.id] ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300" : "bg-slate-500/10 text-slate-400",
                )}
              >
                {crossCounts[d.id]} match
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="card space-y-3 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${device.name} pins — e.g. "SDA", "GPIO25", "reset", "ADC1"`}
            className="input pl-9 font-sans"
            aria-label="Search pins"
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600" aria-label="Clear search">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 text-xs font-medium text-slate-500">
            <Filter className="h-3.5 w-3.5" /> Function:
          </span>
          {available.map((f) => {
            const on = fns.includes(f);
            return (
              <button
                key={f}
                type="button"
                onClick={() => toggleFn(f)}
                aria-pressed={on}
                className={cn(
                  "chip",
                  on ? cn(FUNCTION_STYLES[f], "ring-2 ring-current/30") : "border-slate-200 text-slate-500 hover:border-slate-400 dark:border-slate-700 dark:text-slate-400",
                )}
              >
                {f}
              </button>
            );
          })}
          {filtering && (
            <button
              type="button"
              onClick={() => {
                setFns([]);
                setQuery("");
              }}
              className="ml-auto text-xs font-medium text-cyan-700 hover:underline dark:text-cyan-400"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_1fr]">
        {/* Diagram + device info */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">{device.fullName}</h2>
              <span className="font-mono text-xs text-slate-500">{device.package}</span>
            </div>
            <div className="p-4">
              {device.layout.style === "dip" ? (
                <DipDiagram device={device} matches={matches} filtering={filtering} selected={selectedPin} onSelect={setSelectedPin} />
              ) : (
                <BoardDiagram device={device} matches={matches} filtering={filtering} selected={selectedPin} onSelect={setSelectedPin} />
              )}
              <Legend />
            </div>
          </div>

          {selected && <PinDetail pin={selected} onClose={() => setSelectedPin(null)} />}

          <div className="card p-4">
            <h3 className="card-title mb-2">Overview</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">{device.description}</p>
            <dl className="mt-4 divide-y divide-slate-200 text-sm dark:divide-slate-800">
              {device.specs.map((s) => (
                <div key={s.label} className="flex justify-between gap-4 py-1.5">
                  <dt className="text-slate-500 dark:text-slate-400">{s.label}</dt>
                  <dd className="text-right font-mono text-xs text-slate-800 dark:text-slate-200">{s.value}</dd>
                </div>
              ))}
            </dl>
            <ul className="mt-4 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {device.notes.map((n) => (
                <li key={n} className="flex gap-2">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  {n}
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-400">
              <BookOpen className="h-3.5 w-3.5" /> Reference: {device.datasheetHint}
            </p>
          </div>
        </div>

        {/* Pin table */}
        <div className="card overflow-hidden">
          <div className="card-header">
            <h2 className="card-title">Pin table</h2>
            <span className="text-xs text-slate-500">
              {matches.size} / {device.pins.length} pins
            </span>
          </div>
          {matches.size === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">No pins match the current search / filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] tracking-wide text-slate-500 uppercase dark:bg-slate-950/60 dark:text-slate-400">
                  <tr>
                    <th className="px-4 py-2 font-medium">Pin</th>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Functions</th>
                    <th className="px-4 py-2 font-medium">Description</th>
                    <th className="px-4 py-2 font-medium">Voltage / rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {device.pins
                    .filter((p) => matches.has(p.id))
                    .map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedPin(p.id === selectedPin ? null : p.id)}
                        className={cn(
                          "cursor-pointer align-top transition hover:bg-slate-50 dark:hover:bg-slate-800/50",
                          p.id === selectedPin && "bg-cyan-50 dark:bg-cyan-500/10",
                        )}
                      >
                        <td className="px-4 py-3 font-mono text-xs font-semibold whitespace-nowrap">
                          <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: PIN_FILL[p.direction] }} />
                          {p.number}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs font-semibold">{p.name}</p>
                          {p.alt && <p className="mt-0.5 font-mono text-[10px] text-slate-400">{p.alt.join(" · ")}</p>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex max-w-48 flex-wrap gap-1">
                            {p.functions.map((f) => (
                              <span key={f} className={cn("chip px-1.5 py-0 text-[10px]", FUNCTION_STYLES[f])}>
                                {f}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 dark:text-slate-300">
                          {p.description}
                          {p.notes && <p className="mt-1 text-amber-600 dark:text-amber-400">⚠ {p.notes}</p>}
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">{p.voltage}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Diagrams -------------------------------- */

interface DiagramProps {
  device: Device;
  matches: Set<string>;
  filtering: boolean;
  selected: string | null;
  onSelect: (id: string | null) => void;
}

function DipDiagram({ device, matches, filtering, selected, onSelect }: DiagramProps) {
  const { left, right } = device.layout;
  const rows = Math.max(left.length, right.length);
  const pitch = 44;
  const top = 24;
  const bodyX = 130;
  const bodyW = 140;
  const H = top * 2 + rows * pitch;
  const byId = (id: string) => device.pins.find((p) => p.id === id);

  const renderPin = (id: string, idx: number, side: "L" | "R") => {
    const pin = byId(id);
    if (!pin) return null;
    const y = top + idx * pitch + pitch / 2;
    const dim = filtering && !matches.has(id);
    const isSel = selected === id;
    const x = side === "L" ? bodyX - 34 : bodyX + bodyW;
    return (
      <g
        key={id}
        onClick={() => onSelect(isSel ? null : id)}
        className="cursor-pointer"
        opacity={dim ? 0.2 : 1}
        role="button"
        aria-label={`Pin ${pin.number} ${pin.name}`}
      >
        <rect x={x} y={y - 9} width={34} height={18} rx={2} fill="#cbd5e1" stroke={isSel ? "#06b6d4" : "#94a3b8"} strokeWidth={isSel ? 3 : 1} />
        <text x={x + 17} y={y + 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="#0f172a" className="font-mono">
          {pin.number}
        </text>
        <circle cx={side === "L" ? x - 12 : x + 46} cy={y} r={5} fill={PIN_FILL[pin.direction]} />
        <text
          x={side === "L" ? x - 22 : x + 56}
          y={y + 4}
          textAnchor={side === "L" ? "end" : "start"}
          fontSize={12}
          fontWeight={600}
          className={cn("font-mono", isSel ? "fill-cyan-600 dark:fill-cyan-400" : "fill-slate-700 dark:fill-slate-200")}
        >
          {pin.name}
        </text>
      </g>
    );
  };

  return (
    <svg viewBox={`0 0 400 ${H}`} className="mx-auto w-full max-w-sm" role="img" aria-label={`${device.name} DIP pinout`}>
      <rect x={bodyX} y={top - 8} width={bodyW} height={rows * pitch + 16} rx={6} className="fill-slate-800 dark:fill-slate-700" />
      <path d={`M${bodyX + bodyW / 2 - 14},${top - 8} a14,14 0 0,0 28,0`} className="fill-slate-50 dark:fill-slate-900" />
      <circle cx={bodyX + 16} cy={top + 14} r={5} className="fill-slate-600 dark:fill-slate-500" />
      <text x={bodyX + bodyW / 2} y={top + (rows * pitch) / 2 + 4} textAnchor="middle" fontSize={16} fontWeight={700} fill="#e2e8f0" className="font-mono">
        {device.name}
      </text>
      {left.map((id, i) => renderPin(id, i, "L"))}
      {right.map((id, i) => renderPin(id, i, "R"))}
    </svg>
  );
}

function BoardDiagram({ device, matches, filtering, selected, onSelect }: DiagramProps) {
  const { left, right, leftLabel, rightLabel } = device.layout;
  const byId = (id: string) => device.pins.find((p) => p.id === id);

  const column = (ids: string[], align: "left" | "right") => (
    <ul className="space-y-1">
      {ids.map((id) => {
        const pin = byId(id);
        if (!pin) return null;
        const dim = filtering && !matches.has(id);
        const isSel = selected === id;
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => onSelect(isSel ? null : id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md border px-2 py-1 text-xs transition",
                align === "right" && "flex-row-reverse text-right",
                isSel
                  ? "border-cyan-500 bg-cyan-50 ring-2 ring-cyan-500/30 dark:bg-cyan-500/10"
                  : "border-slate-200 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900",
                dim && "opacity-25",
              )}
            >
              <span className="h-3 w-3 shrink-0 rounded-full border-2 border-amber-400" style={{ background: PIN_FILL[pin.direction] }} />
              <span className="font-mono font-semibold">{pin.number}</span>
              {pin.name !== pin.number && <span className="truncate font-mono text-[10px] text-slate-400">{pin.name}</span>}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
      <div>
        <p className="mb-2 text-center text-[10px] font-semibold tracking-wide text-slate-400 uppercase">{leftLabel}</p>
        {column(left, "left")}
      </div>
      <div className="flex w-16 flex-col items-center justify-center rounded-lg bg-gradient-to-b from-teal-700 to-teal-900 px-1 py-4 text-center text-white sm:w-20 dark:from-teal-800 dark:to-teal-950">
        <span className="rounded bg-slate-900 px-1.5 py-3 font-mono text-[9px] leading-tight font-bold shadow">
          {device.id === "arduino-uno" ? "ATmega 328P" : "ESP32 WROOM"}
        </span>
        <span className="mt-3 text-[9px] opacity-75 [writing-mode:vertical-rl]">{device.name}</span>
      </div>
      <div>
        <p className="mb-2 text-center text-[10px] font-semibold tracking-wide text-slate-400 uppercase">{rightLabel}</p>
        {column(right, "right")}
      </div>
    </div>
  );
}

function Legend() {
  const items: { label: string; key: keyof typeof PIN_FILL }[] = [
    { label: "Power", key: "power" },
    { label: "Ground", key: "ground" },
    { label: "Input", key: "input" },
    { label: "Output", key: "output" },
    { label: "I/O", key: "bidirectional" },
    { label: "NC", key: "nc" },
  ];
  return (
    <div className="mt-4 flex flex-wrap justify-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
      {items.map((i) => (
        <span key={i.key} className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIN_FILL[i.key] }} /> {i.label}
        </span>
      ))}
    </div>
  );
}

function PinDetail({ pin, onClose }: { pin: Pin; onClose: () => void }) {
  return (
    <div className="card border-cyan-400/60 p-4 dark:border-cyan-500/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">Pin {pin.number}</p>
          <h3 className="font-mono text-lg font-bold">{pin.name}</h3>
          {pin.alt && <p className="font-mono text-[11px] text-slate-400">{pin.alt.join(" · ")}</p>}
        </div>
        <button type="button" onClick={onClose} className="btn btn-ghost p-1.5" aria-label="Close pin details">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {pin.functions.map((f) => (
          <span key={f} className={cn("chip", FUNCTION_STYLES[f])}>
            {f}
          </span>
        ))}
      </div>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{pin.description}</p>
      <p className="mt-2 font-mono text-xs text-slate-700 dark:text-slate-200">
        <span className="text-slate-400">Rating: </span>
        {pin.voltage}
      </p>
      {pin.notes && <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">⚠ {pin.notes}</p>}
    </div>
  );
}
