/**
 * SI-prefix parsing and engineering-notation formatting helpers.
 */

const PREFIXES: { symbol: string; exp: number }[] = [
  { symbol: "p", exp: -12 },
  { symbol: "n", exp: -9 },
  { symbol: "µ", exp: -6 },
  { symbol: "m", exp: -3 },
  { symbol: "", exp: 0 },
  { symbol: "k", exp: 3 },
  { symbol: "M", exp: 6 },
  { symbol: "G", exp: 9 },
];

const PREFIX_MULTIPLIER: Record<string, number> = {
  p: 1e-12,
  n: 1e-9,
  u: 1e-6,
  µ: 1e-6,
  μ: 1e-6,
  m: 1e-3,
  k: 1e3,
  K: 1e3,
  M: 1e6,
  G: 1e9,
  R: 1,
  r: 1,
};

/**
 * Parse a human-friendly engineering value.
 * Accepts: "4.7k", "100n", "2.2 µF", "1e-3", "4k7" (=4.7k), "10M", "-5", "3.3V".
 * Returns NaN when the string cannot be parsed.
 */
export function parseSI(raw: string): number {
  if (raw == null) return NaN;
  let s = raw.trim().replace(/,/g, "").replace(/\s+/g, "");
  if (s === "") return NaN;

  // Strip common trailing unit symbols (V, A, W, Ω, ohm, F, H, Hz, s)
  s = s.replace(/(ohms?|Ω|Hz|V|A|W|F|H|s)$/i, "");

  // Plain number (incl. scientific notation)
  if (/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(s)) return Number(s);

  // Number followed by a prefix, optionally with trailing digits (4k7 style)
  const m = s.match(/^([+-]?)(\d*)(?:\.(\d+))?([pnuµμmkKMGRr])(\d*)$/);
  if (m) {
    const [, sign, intPart, fracPart, prefix, trailing] = m;
    if (fracPart !== undefined && trailing) return NaN; // "4.7k7" is ambiguous
    if (!intPart && !fracPart && !trailing) return NaN;
    const mantissa = trailing
      ? Number(`${intPart || "0"}.${trailing}`)
      : Number(`${intPart || "0"}${fracPart !== undefined ? "." + fracPart : ""}`);
    const mult = PREFIX_MULTIPLIER[prefix];
    return (sign === "-" ? -1 : 1) * mantissa * mult;
  }
  return NaN;
}

/** Round to N significant figures and drop trailing zeros. */
export function toSig(value: number, sig = 4): string {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";
  const n = Number(value.toPrecision(sig));
  return String(n);
}

/**
 * Format a number in engineering notation with an SI prefix.
 * formatSI(4700, "Ω") -> "4.7 kΩ"
 */
export function formatSI(value: number, unit = "", sig = 4, space = true): string {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return `0${space && unit ? " " : ""}${unit}`;
  const abs = Math.abs(value);
  let chosen = PREFIXES[0];
  for (const p of PREFIXES) {
    if (abs >= Math.pow(10, p.exp) * 0.9999999) chosen = p;
  }
  let scaled = value / Math.pow(10, chosen.exp);
  // Handle rounding that pushes e.g. 999.99 -> 1000
  if (Math.abs(Number(scaled.toPrecision(sig))) >= 1000) {
    const idx = PREFIXES.indexOf(chosen);
    if (idx < PREFIXES.length - 1) {
      chosen = PREFIXES[idx + 1];
      scaled = value / Math.pow(10, chosen.exp);
    }
  }
  const sep = space && (chosen.symbol || unit) ? " " : "";
  return `${toSig(scaled, sig)}${sep}${chosen.symbol}${unit}`;
}

/** Compact SI string suitable to round-trip back into an input, e.g. "4.7k". */
export function formatSICompact(value: number, sig = 4): string {
  if (!Number.isFinite(value)) return "";
  return formatSI(value, "", sig, false).replace("µ", "u");
}

/** Resistance with Ω / kΩ / MΩ / GΩ auto-formatting. */
export function formatResistance(ohms: number, sig = 4): string {
  if (!Number.isFinite(ohms)) return "—";
  if (ohms < 1 && ohms > 0) return `${toSig(ohms * 1000, sig)} mΩ`;
  return formatSI(ohms, "Ω", sig);
}
