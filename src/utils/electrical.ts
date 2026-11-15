/**
 * Core circuit-analysis math used by the calculators.
 * All inputs/outputs are base SI units (V, A, Ω, W, F, H, s, Hz).
 */

export type OhmKey = "V" | "I" | "R" | "P";

export interface OhmResult {
  V: number;
  I: number;
  R: number;
  P: number;
  formula: Partial<Record<OhmKey, string>>;
}

const finite = (...xs: number[]) => xs.every((x) => Number.isFinite(x));

/**
 * Solve Ohm's law + Joule's law from any two known quantities.
 * Returns null if the pair is invalid (e.g. division by zero or negative sqrt).
 */
export function solveOhmsLaw(known: Partial<Record<OhmKey, number>>): OhmResult | null {
  const keys = (Object.keys(known) as OhmKey[]).filter((k) => Number.isFinite(known[k]));
  if (keys.length !== 2) return null;
  const has = (a: OhmKey, b: OhmKey) => keys.includes(a) && keys.includes(b);
  const { V = NaN, I = NaN, R = NaN, P = NaN } = known;
  let r: OhmResult | null = null;

  if (has("V", "I")) {
    if (I === 0) return null;
    r = { V, I, R: V / I, P: V * I, formula: { R: "R = V / I", P: "P = V × I" } };
  } else if (has("V", "R")) {
    if (R === 0) return null;
    r = { V, R, I: V / R, P: (V * V) / R, formula: { I: "I = V / R", P: "P = V² / R" } };
  } else if (has("V", "P")) {
    if (V === 0 || P === 0) return null;
    r = { V, P, I: P / V, R: (V * V) / P, formula: { I: "I = P / V", R: "R = V² / P" } };
  } else if (has("I", "R")) {
    r = { I, R, V: I * R, P: I * I * R, formula: { V: "V = I × R", P: "P = I² × R" } };
  } else if (has("I", "P")) {
    if (I === 0) return null;
    r = { I, P, V: P / I, R: P / (I * I), formula: { V: "V = P / I", R: "R = P / I²" } };
  } else if (has("R", "P")) {
    if (R === 0 || P / R < 0 || P * R < 0) return null;
    r = { R, P, V: Math.sqrt(P * R), I: Math.sqrt(P / R), formula: { V: "V = √(P × R)", I: "I = √(P / R)" } };
  }
  if (!r || !finite(r.V, r.I, r.R, r.P)) return null;
  return r;
}

/* ---------------------------- RC / RL / RLC ---------------------------- */

export const rcTimeConstant = (R: number, C: number) => R * C;
export const rlTimeConstant = (R: number, L: number) => L / R;
export const rcCutoff = (R: number, C: number) => 1 / (2 * Math.PI * R * C);
export const rlCutoff = (R: number, L: number) => R / (2 * Math.PI * L);
export const resonantFrequency = (L: number, C: number) => 1 / (2 * Math.PI * Math.sqrt(L * C));

export type Damping = "Underdamped" | "Critically damped" | "Overdamped";

export interface RLCResult {
  fr: number;
  omega0: number;
  qSeries: number;
  qParallel: number;
  bandwidthSeries: number;
  zeta: number;
  damping: Damping;
  reactanceAtResonance: number;
  alpha: number;
}

/** Series RLC analysis (parallel Q also reported for reference). */
export function analyzeRLC(R: number, L: number, C: number): RLCResult | null {
  if (!(R > 0 && L > 0 && C > 0)) return null;
  const omega0 = 1 / Math.sqrt(L * C);
  const fr = omega0 / (2 * Math.PI);
  const qSeries = (1 / R) * Math.sqrt(L / C);
  const qParallel = R * Math.sqrt(C / L);
  const zeta = (R / 2) * Math.sqrt(C / L);
  const alpha = R / (2 * L);
  const eps = 1e-6;
  const damping: Damping =
    Math.abs(zeta - 1) < eps ? "Critically damped" : zeta < 1 ? "Underdamped" : "Overdamped";
  return {
    fr,
    omega0,
    qSeries,
    qParallel,
    bandwidthSeries: fr / qSeries,
    zeta,
    damping,
    reactanceAtResonance: omega0 * L,
    alpha,
  };
}

/** Capacitor charging voltage at time t: Vc = Vs·(1 − e^(−t/τ)). */
export const rcCharge = (Vs: number, t: number, tau: number) => Vs * (1 - Math.exp(-t / tau));
/** Capacitor discharging voltage at time t: Vc = V0·e^(−t/τ). */
export const rcDischarge = (V0: number, t: number, tau: number) => V0 * Math.exp(-t / tau);

/** First-order low-pass magnitude response in dB. */
export const lowPassGainDb = (f: number, fc: number) => -10 * Math.log10(1 + (f / fc) ** 2);

/* -------------------------------- Op-Amp ------------------------------- */

export type OpAmpMode = "inverting" | "non-inverting";

export interface OpAmpResult {
  gain: number;
  gainDb: number;
  idealVout: number;
  vout: number;
  saturated: boolean;
  inputImpedance: string;
}

export function analyzeOpAmp(
  mode: OpAmpMode,
  Rin: number,
  Rf: number,
  Vin: number,
  vPos: number,
  vNeg: number,
): OpAmpResult | null {
  if (!(Rin > 0 && Rf >= 0) || !Number.isFinite(Vin)) return null;
  const gain = mode === "inverting" ? -Rf / Rin : 1 + Rf / Rin;
  const idealVout = gain * Vin;
  let vout = idealVout;
  let saturated = false;
  if (Number.isFinite(vPos) && Number.isFinite(vNeg) && vPos > vNeg) {
    if (idealVout > vPos) {
      vout = vPos;
      saturated = true;
    } else if (idealVout < vNeg) {
      vout = vNeg;
      saturated = true;
    }
  }
  return {
    gain,
    gainDb: gain === 0 ? -Infinity : 20 * Math.log10(Math.abs(gain)),
    idealVout,
    vout,
    saturated,
    inputImpedance: mode === "inverting" ? "≈ Rin" : "Very high (≈ op-amp Zin)",
  };
}

/* ---------------------------- Data analysis ---------------------------- */

export interface LinearFit {
  slope: number;
  intercept: number;
  r2: number;
}

/** Least-squares linear regression y = slope·x + intercept. */
export function linearFit(xs: number[], ys: number[]): LinearFit | null {
  const n = xs.length;
  if (n < 2 || ys.length !== n) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxx = 0;
  let sxy = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - mx) ** 2;
    sxy += (xs[i] - mx) * (ys[i] - my);
    syy += (ys[i] - my) ** 2;
  }
  if (sxx === 0) return null;
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const r2 = syy === 0 ? 1 : (sxy * sxy) / (sxx * syy);
  return { slope, intercept, r2 };
}
