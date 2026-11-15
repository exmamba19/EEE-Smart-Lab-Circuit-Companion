"use client";

import { useId } from "react";
import { parseSI } from "@/utils/units";
import { cn } from "@/utils/cn";

interface SIInputProps {
  label: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  /** Visually mark the field as a computed (derived) value. */
  computed?: boolean;
  /** Allow negative values (default true). */
  allowNegative?: boolean;
  className?: string;
}

/**
 * Text input that understands SI prefixes (4.7k, 100n, 2M2, 1e-3 …).
 */
export default function SIInput({
  label,
  unit,
  value,
  onChange,
  placeholder,
  hint,
  computed,
  allowNegative = true,
  className,
}: SIInputProps) {
  const id = useId();
  const parsed = parseSI(value);
  const invalid = value.trim() !== "" && (!Number.isFinite(parsed) || (!allowNegative && parsed < 0));

  return (
    <div className={className}>
      <label htmlFor={id} className="label flex items-center justify-between">
        <span>{label}</span>
        {computed && (
          <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-700 normal-case dark:text-cyan-300">
            calculated
          </span>
        )}
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={invalid}
          className={cn(
            "input pr-12",
            computed && "border-cyan-400/60 bg-cyan-50/60 text-cyan-900 dark:border-cyan-500/40 dark:bg-cyan-500/5 dark:text-cyan-100",
            invalid && "border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500/60",
          )}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center font-mono text-xs text-slate-400">
          {unit}
        </span>
      </div>
      <p className={cn("mt-1 min-h-4 text-[11px]", invalid ? "text-red-500" : "text-slate-400 dark:text-slate-500")}>
        {invalid ? "Invalid value — use e.g. 4.7k, 100n, 2M2" : hint}
      </p>
    </div>
  );
}
