"use client";

import { Binary, Check, Copy, ToggleLeft } from "lucide-react";
import { useMemo, useState } from "react";
import {
  evaluateGate,
  formatBase,
  GATES,
  groupDigits,
  parseBase,
  toTwosComplement,
  truthTableRows,
  type BaseField,
  type GateType,
} from "@/utils/digital";
import { cn } from "@/utils/cn";

export default function DigitalLogic() {
  return (
    <div className="space-y-6">
      <GateSimulator />
      <BaseConverter />
    </div>
  );
}

/* ============================ Logic gate simulator ============================ */

const INPUT_NAMES = ["A", "B", "C"];
const HIGH = "#22c55e";
const LOW = "#94a3b8";

function GateSimulator() {
  const [gate, setGate] = useState<GateType>("AND");
  const [inputCount, setInputCount] = useState(2);
  const [inputs, setInputs] = useState<boolean[]>([false, false, false]);

  const n = gate === "NOT" ? 1 : inputCount;
  const active = inputs.slice(0, n);
  const output = evaluateGate(gate, active);
  const rows = useMemo(() => truthTableRows(n), [n]);
  const activeRow = active.reduce((acc, b) => acc * 2 + (b ? 1 : 0), 0);
  const info = GATES.find((g) => g.type === gate)!;
  const names = INPUT_NAMES.slice(0, n);

  const toggle = (i: number) => setInputs((cur) => cur.map((v, j) => (j === i ? !v : v)));
  const setRow = (row: boolean[]) => setInputs((cur) => cur.map((v, j) => (j < row.length ? row[j] : v)));

  return (
    <section className="card">
      <div className="card-header flex-wrap">
        <h2 className="card-title flex items-center gap-2">
          <ToggleLeft className="h-4 w-4 text-indigo-500" /> Logic gate simulator
        </h2>
        {gate !== "NOT" && (
          <div className="seg" role="radiogroup" aria-label="Number of inputs">
            {[2, 3].map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={inputCount === c}
                onClick={() => setInputCount(c)}
                className={cn("seg-btn px-2.5 py-1 text-xs", inputCount === c && "seg-btn-active")}
              >
                {c} inputs
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" role="tablist" aria-label="Gate type">
          {GATES.map((g) => (
            <button
              key={g.type}
              type="button"
              role="tab"
              aria-selected={gate === g.type}
              onClick={() => setGate(g.type)}
              className={cn(
                "shrink-0 rounded-lg border px-3 py-1.5 font-mono text-sm font-semibold transition",
                gate === g.type
                  ? "border-indigo-500 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
                  : "border-slate-200 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300",
              )}
            >
              {g.type}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 sm:p-4 dark:border-slate-800 dark:bg-slate-950/50">
              <GateDiagram gate={gate} inputs={active} output={output} onToggle={toggle} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {names.map((name, i) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => toggle(i)}
                  aria-pressed={active[i]}
                  className={cn(
                    "flex min-w-24 flex-1 items-center justify-between gap-2 rounded-lg border px-3 py-2 font-mono text-sm font-semibold transition sm:flex-none",
                    active[i]
                      ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-300"
                      : "border-slate-300 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300",
                  )}
                >
                  <span>Input {name}</span>
                  <span className="text-base">{active[i] ? 1 : 0}</span>
                </button>
              ))}
              <div
                className={cn(
                  "flex min-w-24 flex-1 items-center justify-between gap-2 rounded-lg px-3 py-2 font-mono text-sm font-bold sm:ml-auto sm:flex-none",
                  output ? "bg-green-500 text-white shadow-[0_0_16px_rgba(34,197,94,0.55)]" : "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                )}
                role="status"
                aria-label={`Output ${output ? 1 : 0}`}
              >
                <span>Output Y</span>
                <span className="text-base">{output ? 1 : 0}</span>
              </div>
            </div>
            <div className="mt-4 rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
              <p className="font-mono text-base">
                Y = <span className="text-indigo-700 dark:text-indigo-300">{info.expression(names)}</span>
              </p>
              <p className="mt-1 text-slate-500 dark:text-slate-400">{info.description}</p>
            </div>
          </div>

          <div>
            <h3 className="label">Truth table — tap a row to set inputs</h3>
            <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-center font-mono text-sm">
                <thead className="bg-slate-100 text-xs text-slate-500 dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    {names.map((nm) => (
                      <th key={nm} className="px-2 py-2 font-semibold">{nm}</th>
                    ))}
                    <th className="border-l border-slate-200 px-2 py-2 font-semibold dark:border-slate-800">Y</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const y = evaluateGate(gate, row);
                    const isActive = idx === activeRow;
                    return (
                      <tr
                        key={idx}
                        onClick={() => setRow(row)}
                        className={cn(
                          "cursor-pointer border-t border-slate-100 transition dark:border-slate-800",
                          isActive ? "bg-indigo-500/15 font-bold text-indigo-800 dark:text-indigo-200" : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                        )}
                        aria-current={isActive ? "true" : undefined}
                      >
                        {row.map((b, i) => (
                          <td key={i} className="px-2 py-1.5">{b ? 1 : 0}</td>
                        ))}
                        <td className={cn("border-l border-slate-200 px-2 py-1.5 dark:border-slate-800", y && "text-green-600 dark:text-green-400")}>{y ? 1 : 0}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** ANSI/IEEE distinctive-shape gate symbol with clickable input switches and an output LED. */
function GateDiagram({ gate, inputs, output, onToggle }: { gate: GateType; inputs: boolean[]; output: boolean; onToggle: (i: number) => void }) {
  const n = inputs.length;
  const ys = n === 1 ? [100] : n === 2 ? [70, 130] : [60, 100, 140];
  const family = gate === "NOT" ? "not" : gate === "AND" || gate === "NAND" ? "and" : "or";
  const bubble = gate === "NAND" || gate === "NOR" || gate === "XNOR" || gate === "NOT";
  const bodyEnd = family === "not" ? 210 : 230;
  const outX = bubble ? bodyEnd + 16 : bodyEnd;
  const wireEnd = family === "and" ? 122 : family === "not" ? 132 : 140;

  return (
    <svg viewBox="0 0 400 200" className="mx-auto block w-full max-w-xl" role="img" aria-label={`${gate} gate, output ${output ? 1 : 0}`}>
      {/* Input wires */}
      {ys.map((y, i) => (
        <line key={`w${i}`} x1={70} y1={y} x2={wireEnd} y2={y} stroke={inputs[i] ? HIGH : LOW} strokeWidth={4} strokeLinecap="round" />
      ))}
      {/* Output wire */}
      <line x1={outX} y1={100} x2={330} y2={100} stroke={output ? HIGH : LOW} strokeWidth={4} strokeLinecap="round" />

      {/* Gate body */}
      <g className="fill-white stroke-slate-700 dark:fill-slate-900 dark:stroke-slate-200" strokeWidth={3.5} strokeLinejoin="round">
        {family === "and" && <path d="M120,40 H170 A60,60 0 0 1 170,160 H120 Z" />}
        {family === "or" && <path d="M112,40 Q150,100 112,160 Q190,160 230,100 Q190,40 112,40 Z" />}
        {family === "not" && <path d="M130,50 L130,150 L210,100 Z" />}
        {(gate === "XOR" || gate === "XNOR") && <path d="M98,40 Q136,100 98,160" fill="none" />}
        {bubble && <circle cx={bodyEnd + 8} cy={100} r={8} />}
      </g>
      <text x={family === "not" ? 158 : 168} y={106} textAnchor="middle" fontSize={15} fontWeight={700} className="fill-slate-500 font-mono dark:fill-slate-400">
        {gate}
      </text>

      {/* Input switches */}
      {ys.map((y, i) => (
        <g
          key={`s${i}`}
          onClick={() => onToggle(i)}
          className="cursor-pointer"
          role="switch"
          aria-checked={inputs[i]}
          aria-label={`Input ${INPUT_NAMES[i]}`}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle(i);
            }
          }}
        >
          <rect x={22} y={y - 15} width={50} height={30} rx={15} fill={inputs[i] ? HIGH : "#cbd5e1"} stroke={inputs[i] ? "#15803d" : "#94a3b8"} strokeWidth={1.5} />
          <circle cx={inputs[i] ? 57 : 37} cy={y} r={11} fill="#fff" />
          <text x={inputs[i] ? 37 : 57} y={y + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill={inputs[i] ? "#fff" : "#475569"} className="font-mono">
            {inputs[i] ? 1 : 0}
          </text>
          <text x={10} y={y + 5} textAnchor="middle" fontSize={13} fontWeight={700} className="fill-slate-600 font-mono dark:fill-slate-300">
            {INPUT_NAMES[i]}
          </text>
        </g>
      ))}

      {/* Output LED */}
      {output && <circle cx={352} cy={100} r={30} fill={HIGH} opacity={0.25} />}
      <circle cx={352} cy={100} r={20} fill={output ? HIGH : "#475569"} stroke={output ? "#15803d" : "#334155"} strokeWidth={3} />
      <circle cx={345} cy={93} r={5} fill="#fff" opacity={output ? 0.7 : 0.2} />
      <text x={352} y={142} textAnchor="middle" fontSize={13} fontWeight={700} className="fill-slate-600 font-mono dark:fill-slate-300">
        Y = {output ? 1 : 0}
      </text>
    </svg>
  );
}

/* =============================== Base converter =============================== */

const FIELDS: { key: BaseField; label: string; prefix: string; placeholder: string; hint: string }[] = [
  { key: "dec", label: "Decimal", prefix: "10", placeholder: "e.g. 202 or -56", hint: "Signed integer" },
  { key: "bin", label: "Binary", prefix: "2", placeholder: "e.g. 11001010", hint: "Sign-magnitude for negatives" },
  { key: "oct", label: "Octal", prefix: "8", placeholder: "e.g. 312", hint: "Digits 0–7" },
  { key: "hex", label: "Hexadecimal", prefix: "16", placeholder: "e.g. CA", hint: "Digits 0–9, A–F" },
  { key: "tc8", label: "8-bit two's complement", prefix: "2c", placeholder: "8 bits", hint: "Range −128 … 127" },
  { key: "tc16", label: "16-bit two's complement", prefix: "2c", placeholder: "16 bits", hint: "Range −32 768 … 32 767" },
];

function BaseConverter() {
  const [active, setActive] = useState<BaseField>("dec");
  const [raw, setRaw] = useState("202");
  const [copied, setCopied] = useState<BaseField | null>(null);

  const value = useMemo(() => parseBase(raw, active), [raw, active]);
  const invalid = raw.trim() !== "" && value === null;

  const display = (field: BaseField): string => {
    if (field === active) return raw;
    if (value === null) return "";
    if (field === "tc8" || field === "tc16") return toTwosComplement(value, field === "tc8" ? 8 : 16) ?? "";
    return formatBase(value, field);
  };

  const tc16 = value !== null ? toTwosComplement(value, 16) : null;
  const tc8 = value !== null ? toTwosComplement(value, 8) : null;
  const bitView = tc16 ?? null;

  const flipBit = (index: number) => {
    // Toggle a bit in the 16-bit two's complement pattern.
    const base = bitView ?? "0".repeat(16);
    const next = base.slice(0, index) + (base[index] === "1" ? "0" : "1") + base.slice(index + 1);
    setActive("tc16");
    setRaw(next);
  };

  const copy = async (field: BaseField) => {
    const text = display(field);
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied((c) => (c === field ? null : c)), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };

  const ascii = value !== null && value >= 32n && value <= 126n ? String.fromCharCode(Number(value)) : null;

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title flex items-center gap-2">
          <Binary className="h-4 w-4 text-indigo-500" /> Number base converter
        </h2>
        <span className="hidden text-xs text-slate-500 sm:inline">Edit any field — the rest update instantly</span>
      </div>

      <div className="grid gap-x-4 gap-y-3 p-4 sm:grid-cols-2">
        {FIELDS.map((f) => {
          const isActive = f.key === active;
          const outOfRange = !isActive && value !== null && (f.key === "tc8" ? tc8 === null : f.key === "tc16" ? tc16 === null : false);
          const shown = display(f.key);
          return (
            <div key={f.key}>
              <label htmlFor={`base-${f.key}`} className="label flex items-center justify-between">
                <span>{f.label}</span>
                <span className="font-mono text-[10px] text-slate-400 normal-case">base {f.prefix}</span>
              </label>
              <div className="relative">
                <input
                  id={`base-${f.key}`}
                  value={shown}
                  placeholder={outOfRange ? "out of range" : f.placeholder}
                  onChange={(e) => {
                    setActive(f.key);
                    setRaw(e.target.value);
                  }}
                  onFocus={() => {
                    if (!isActive && value !== null && shown) {
                      setActive(f.key);
                      setRaw(shown);
                    }
                  }}
                  inputMode={f.key === "hex" ? "text" : "numeric"}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={isActive && invalid}
                  className={cn(
                    "input pr-10 uppercase",
                    isActive && "border-indigo-400 ring-2 ring-indigo-500/15",
                    isActive && invalid && "border-red-400",
                  )}
                />
                <button
                  type="button"
                  onClick={() => copy(f.key)}
                  className="absolute inset-y-0 right-1 my-auto h-8 rounded p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  aria-label={`Copy ${f.label}`}
                >
                  {copied === f.key ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <p className={cn("mt-1 text-[11px]", isActive && invalid ? "text-red-500" : "text-slate-400")}>
                {isActive && invalid ? `Invalid ${f.label.toLowerCase()} value` : outOfRange ? "Value does not fit in this width" : f.hint}
              </p>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="label mb-0">16-bit pattern — tap a bit to flip it</h3>
          <span className="font-mono text-xs text-slate-500">
            {value !== null ? `${value.toString()}${ascii ? ` · ASCII '${ascii}'` : ""}` : "—"}
          </span>
        </div>
        <div className="mt-2 grid grid-cols-8 gap-1 sm:grid-cols-16">
          {(bitView ?? "0".repeat(16)).split("").map((b, i) => (
            <button
              key={i}
              type="button"
              onClick={() => flipBit(i)}
              disabled={value !== null && tc16 === null}
              className={cn(
                "flex flex-col items-center rounded-md border py-1 font-mono transition disabled:opacity-40",
                i === 0 && "border-amber-400/70",
                b === "1"
                  ? "border-indigo-500 bg-indigo-500 text-white"
                  : "border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900",
                i % 4 === 0 && i !== 0 && "sm:ml-1",
              )}
              aria-label={`Bit ${15 - i}: ${b}`}
            >
              <span className="text-sm font-bold">{b}</span>
              <span className="text-[9px] opacity-70">{15 - i}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-slate-400">
          Bit 15 (amber) is the sign bit. Binary grouped: <span className="font-mono">{value !== null ? groupDigits(formatBase(value, "bin")) : "—"}</span>
        </p>
      </div>
    </section>
  );
}
