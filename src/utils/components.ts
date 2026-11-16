/**
 * Passive-component code decoders and small-circuit designers
 * (ceramic capacitor codes, inductor colour bands, 555 timer, LED resistor, voltage divider).
 */

import { colorByName, type ColorName } from "@/data/resistorColors";

const clean = (x: number) => Number(x.toPrecision(12));

/* ------------------------- Ceramic capacitor codes ------------------------ */

/** EIA tolerance letters used on ceramic / film capacitors. */
export const CAP_TOLERANCE: Record<string, string> = {
  B: "±0.1 pF",
  C: "±0.25 pF",
  D: "±0.5 pF",
  F: "±1%",
  G: "±2%",
  J: "±5%",
  K: "±10%",
  M: "±20%",
  Z: "+80% / −20%",
};

export interface CapDecode {
  pF: number;
  explanation: string;
  tolerance?: string;
}

/**
 * Decode a capacitor marking (value in pF):
 * - 3 digits: two significant digits + multiplier (0–7 → ×10ⁿ, 8 → ×0.01, 9 → ×0.1), e.g. 104 = 100 nF, 106 = 10 µF
 * - 1–2 digits: value in pF directly, e.g. 47 = 47 pF
 * - R notation: R is the decimal point in pF, e.g. 4R7 = 4.7 pF
 * - optional tolerance letter suffix, e.g. 104K
 */
export function decodeCapacitorCode(input: string): CapDecode | { error: string } {
  let code = input.trim().toUpperCase().replace(/\s+/g, "");
  if (!code) return { error: "Enter a capacitor code" };

  let tolerance: string | undefined;
  const tolMatch = code.match(/^(.+?)([BCDFGJKMZ])$/);
  if (tolMatch && !/^\d*R\d*$/.test(code)) {
    code = tolMatch[1];
    tolerance = CAP_TOLERANCE[tolMatch[2]];
  }

  if (/^\d*R\d+$|^\d+R$/.test(code)) {
    const pF = clean(Number(code.replace("R", ".")));
    return { pF, explanation: `R = decimal point → ${pF} pF`, tolerance };
  }
  if (/^\d{1,2}$/.test(code)) {
    return { pF: Number(code), explanation: `Two digits or fewer = value in pF → ${Number(code)} pF`, tolerance };
  }
  if (/^\d{3}$/.test(code)) {
    const sig = Number(code.slice(0, 2));
    const m = Number(code[2]);
    // 0–7 are powers of ten (106 = 10 µF, 107 = 100 µF on tantalum/MLCC); 8 and 9 mean ×0.01 and ×0.1.
    const mult = m === 8 ? 0.01 : m === 9 ? 0.1 : 10 ** m;
    return {
      pF: clean(sig * mult),
      explanation: `${code.slice(0, 2)} × ${m <= 7 ? `10^${m}` : mult} pF`,
      tolerance,
    };
  }
  return { error: "Unrecognised code. Try 104, 223K, 471, 4R7 or 47." };
}

/** Encode a capacitance (pF) as the standard 3-digit / R code. */
export function encodeCapacitorCode(pF: number): string | null {
  if (!(pF > 0) || !Number.isFinite(pF)) return null;
  if (pF < 10) {
    const s = String(Number(pF.toPrecision(2)));
    return s.includes(".") ? s.replace(".", "R") : `${s}R0`;
  }
  const exp = Math.floor(Math.log10(pF)) - 1;
  let sig = Math.round(pF / 10 ** exp);
  let e = exp;
  if (sig >= 100) {
    sig = Math.round(sig / 10);
    e += 1;
  }
  if (e > 7) return null;
  return `${sig}${e}`;
}

/** Format a pF value in pF, nF and µF. */
export function capacitanceUnits(pF: number) {
  return { pF, nF: pF / 1e3, uF: pF / 1e6 };
}

/* --------------------------- Inductor colour code ------------------------- */

/** Inductor tolerance bands (MIL-STD). */
export const INDUCTOR_TOLERANCE: Partial<Record<ColorName, number>> = {
  black: 20,
  brown: 1,
  red: 2,
  orange: 3,
  yellow: 4,
  gold: 5,
  silver: 10,
  none: 20,
};

/** 4-band inductor: digit, digit, multiplier, tolerance — value in µH. */
export function decodeInductorBands(bands: ColorName[]): { uH: number; tolerance: number } | null {
  if (bands.length !== 4) return null;
  const d1 = colorByName(bands[0]).digit;
  const d2 = colorByName(bands[1]).digit;
  const mult = colorByName(bands[2]).multiplier;
  const tol = INDUCTOR_TOLERANCE[bands[3]];
  if (d1 === undefined || d2 === undefined || mult === undefined || tol === undefined) return null;
  return { uH: clean((d1 * 10 + d2) * mult), tolerance: tol };
}

/* ------------------------------- 555 timer -------------------------------- */

export interface AstableResult {
  tHigh: number;
  tLow: number;
  period: number;
  frequency: number;
  duty: number;
}

/**
 * Astable 555. With `diode` (diode across R2) the capacitor charges through R1 only,
 * allowing duty cycles below 50 %.
 */
export function astable555(R1: number, R2: number, C: number, diode = false): AstableResult | null {
  if (!(R1 > 0 && R2 > 0 && C > 0)) return null;
  const ln2 = Math.LN2;
  const tHigh = ln2 * (diode ? R1 : R1 + R2) * C;
  const tLow = ln2 * R2 * C;
  const period = tHigh + tLow;
  return { tHigh, tLow, period, frequency: 1 / period, duty: tHigh / period };
}

/** Monostable 555 pulse width: t = 1.1·R·C (= ln 3 · RC). */
export function monostable555(R: number, C: number): number | null {
  if (!(R > 0 && C > 0)) return null;
  return Math.log(3) * R * C;
}

/** Design R1/R2 for a target frequency and duty cycle (standard circuit needs duty > 50 %). */
export function design555(frequency: number, duty: number, C: number): { R1: number; R2: number; diode: boolean } | null {
  if (!(frequency > 0 && C > 0 && duty > 0 && duty < 1)) return null;
  const T = 1 / frequency;
  const tHigh = duty * T;
  const tLow = (1 - duty) * T;
  const R2 = tLow / (Math.LN2 * C);
  if (duty > 0.5) {
    const R1 = tHigh / (Math.LN2 * C) - R2;
    return { R1, R2, diode: false };
  }
  // ≤ 50 %: diode across R2, charge through R1 only.
  return { R1: tHigh / (Math.LN2 * C), R2, diode: true };
}

/* --------------------------- LED series resistor -------------------------- */

export interface LedResult {
  resistor: number;
  resistorPower: number;
  ledPower: number;
  totalCurrent: number;
  totalPower: number;
  efficiency: number;
}

/**
 * Series resistor for `nSeries` LEDs per string, `strings` identical strings in parallel
 * (each with its own resistor).
 */
export function ledResistor(vs: number, vf: number, iF: number, nSeries = 1, strings = 1): LedResult | { error: string } {
  if (!(vs > 0 && vf > 0 && iF > 0 && nSeries >= 1 && strings >= 1)) return { error: "Enter positive supply, forward voltage and current." };
  const vDrop = vs - nSeries * vf;
  if (vDrop <= 0) {
    return { error: `Supply (${vs} V) must exceed the total LED forward voltage (${clean(nSeries * vf)} V). Use fewer LEDs per string.` };
  }
  const resistor = vDrop / iF;
  const resistorPower = iF * iF * resistor;
  const ledPower = nSeries * vf * iF;
  const totalCurrent = iF * strings;
  const totalPower = vs * totalCurrent;
  return { resistor, resistorPower, ledPower, totalCurrent, totalPower, efficiency: (nSeries * vf) / vs };
}

/* ----------------------------- Voltage divider ---------------------------- */

export interface DividerResult {
  vOut: number;
  vOutLoaded?: number;
  current: number;
  pR1: number;
  pR2: number;
  ratio: number;
}

export function voltageDivider(vin: number, R1: number, R2: number, RL?: number): DividerResult | null {
  if (!Number.isFinite(vin) || !(R1 >= 0 && R2 > 0) || R1 + R2 === 0) return null;
  const vOut = (vin * R2) / (R1 + R2);
  const current = vin / (R1 + R2);
  const r: DividerResult = { vOut, current, pR1: current * current * R1, pR2: current * current * R2, ratio: R2 / (R1 + R2) };
  if (RL !== undefined && RL > 0) {
    const r2l = (R2 * RL) / (R2 + RL);
    r.vOutLoaded = (vin * r2l) / (R1 + r2l);
  }
  return r;
}

/** R2 needed for a target output given Vin and R1: R2 = R1·Vout / (Vin − Vout). */
export function solveDividerR2(vin: number, vout: number, R1: number): number | null {
  if (!(vin > 0 && R1 > 0 && vout > 0 && vout < vin)) return null;
  return (R1 * vout) / (vin - vout);
}
