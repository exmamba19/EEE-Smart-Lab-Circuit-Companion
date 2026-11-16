/* ------------------------------ Logic gates ----------------------------- */

export type GateType = "AND" | "OR" | "NOT" | "NAND" | "NOR" | "XOR" | "XNOR";

export const GATES: { type: GateType; expression: (vars: string[]) => string; description: string }[] = [
  { type: "AND", expression: (v) => v.join(" · "), description: "Output is 1 only when every input is 1." },
  { type: "OR", expression: (v) => v.join(" + "), description: "Output is 1 when at least one input is 1." },
  { type: "NOT", expression: (v) => `${v[0]}′`, description: "Inverter: output is the opposite of the input." },
  { type: "NAND", expression: (v) => `(${v.join(" · ")})′`, description: "Inverted AND — 0 only when every input is 1. Universal gate." },
  { type: "NOR", expression: (v) => `(${v.join(" + ")})′`, description: "Inverted OR — 1 only when every input is 0. Universal gate." },
  { type: "XOR", expression: (v) => v.join(" ⊕ "), description: "Exclusive OR — 1 when an odd number of inputs are 1." },
  { type: "XNOR", expression: (v) => `(${v.join(" ⊕ ")})′`, description: "Equivalence — 1 when an even number of inputs are 1." },
];

export function evaluateGate(type: GateType, inputs: boolean[]): boolean {
  const ones = inputs.filter(Boolean).length;
  switch (type) {
    case "AND":
      return ones === inputs.length;
    case "OR":
      return ones > 0;
    case "NOT":
      return !inputs[0];
    case "NAND":
      return ones !== inputs.length;
    case "NOR":
      return ones === 0;
    case "XOR":
      return ones % 2 === 1;
    case "XNOR":
      return ones % 2 === 0;
  }
}

/** All input combinations in binary counting order (A is the MSB). */
export function truthTableRows(inputCount: number): boolean[][] {
  const rows: boolean[][] = [];
  for (let n = 0; n < 1 << inputCount; n++) {
    rows.push(Array.from({ length: inputCount }, (_, i) => ((n >> (inputCount - 1 - i)) & 1) === 1));
  }
  return rows;
}

/* ---------------------------- Number systems ---------------------------- */

export type BaseField = "dec" | "bin" | "oct" | "hex" | "tc8" | "tc16";

const PATTERNS: Record<"dec" | "bin" | "oct" | "hex", RegExp> = {
  dec: /^-?\d+$/,
  bin: /^-?[01]+$/,
  oct: /^-?[0-7]+$/,
  hex: /^-?[0-9a-f]+$/i,
};

const PREFIX: Record<"bin" | "oct" | "hex", string> = { bin: "0b", oct: "0o", hex: "0x" };

/** Normalise user input: drop spaces, underscores and 0b/0o/0x prefixes. */
const clean = (raw: string, field: BaseField) => {
  let s = raw.trim().replace(/[\s_]/g, "");
  if (field === "bin") s = s.replace(/^(-?)0b/i, "$1");
  if (field === "oct") s = s.replace(/^(-?)0o/i, "$1");
  if (field === "hex") s = s.replace(/^(-?)0x/i, "$1");
  return s;
};

/** Parse a field into a signed BigInt, or null if invalid. */
export function parseBase(raw: string, field: BaseField): bigint | null {
  const s = clean(raw, field);
  if (!s) return null;
  if (field === "tc8" || field === "tc16") {
    const bits = field === "tc8" ? 8 : 16;
    if (!/^[01]+$/.test(s) || s.length > bits) return null;
    const u = BigInt("0b" + s);
    // Shorter input is zero-extended (so "1111" in 8-bit is +15, not −1).
    const signBit = 1n << BigInt(bits - 1);
    return u >= signBit ? u - (1n << BigInt(bits)) : u;
  }
  if (!PATTERNS[field].test(s)) return null;
  const negative = s.startsWith("-");
  const digits = negative ? s.slice(1) : s;
  const magnitude = field === "dec" ? BigInt(digits) : BigInt(PREFIX[field] + digits);
  return negative ? -magnitude : magnitude;
}

/** Format a signed BigInt in the given base (sign-magnitude for bin/oct/hex). */
export function formatBase(value: bigint, field: "dec" | "bin" | "oct" | "hex"): string {
  const radix = { dec: 10, bin: 2, oct: 8, hex: 16 }[field];
  const neg = value < 0n;
  const body = (neg ? -value : value).toString(radix);
  return (neg ? "-" : "") + (field === "hex" ? body.toUpperCase() : body);
}

/** Two's-complement bit pattern, or null when the value does not fit in `bits`. */
export function toTwosComplement(value: bigint, bits: 8 | 16): string | null {
  const min = -(1n << BigInt(bits - 1));
  const max = (1n << BigInt(bits - 1)) - 1n;
  if (value < min || value > max) return null;
  const u = value < 0n ? value + (1n << BigInt(bits)) : value;
  return u.toString(2).padStart(bits, "0");
}

/** Insert a separator every `size` characters from the right (e.g. nibble grouping). */
export function groupDigits(s: string, size = 4, sep = " "): string {
  const neg = s.startsWith("-");
  const body = neg ? s.slice(1) : s;
  const out: string[] = [];
  for (let i = body.length; i > 0; i -= size) out.unshift(body.slice(Math.max(0, i - size), i));
  return (neg ? "-" : "") + out.join(sep);
}
