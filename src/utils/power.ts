/**
 * Power-system and electrical-machine calculations (SI units throughout).
 */

export type Connection = "star" | "delta";

export interface ThreePhaseResult {
  vLine: number;
  vPhase: number;
  iLine: number;
  iPhase: number;
  /** Active power (W). */
  P: number;
  /** Reactive power (VAR), positive for lagging loads. */
  Q: number;
  /** Apparent power (VA). */
  S: number;
  pf: number;
  /** Phase angle φ in degrees (positive = lagging). */
  phiDeg: number;
  /** Per-phase load impedance magnitude (Ω). */
  zPhase: number;
}

/**
 * Balanced three-phase load. Supply either the line current or the active power.
 * Star: V_L = √3·V_ph, I_L = I_ph. Delta: V_L = V_ph, I_L = √3·I_ph.
 */
export function solveThreePhase(opts: {
  connection: Connection;
  vLine: number;
  pf: number;
  lagging: boolean;
  iLine?: number;
  P?: number;
}): ThreePhaseResult | null {
  const { connection, vLine, pf, lagging } = opts;
  if (!(vLine > 0) || !(pf > 0 && pf <= 1)) return null;
  let iLine: number;
  if (opts.iLine !== undefined) iLine = opts.iLine;
  else if (opts.P !== undefined) iLine = opts.P / (Math.sqrt(3) * vLine * pf);
  else return null;
  if (!(iLine > 0)) return null;

  const S = Math.sqrt(3) * vLine * iLine;
  const P = S * pf;
  const sinPhi = Math.sqrt(Math.max(0, 1 - pf * pf));
  const Q = S * sinPhi * (lagging ? 1 : -1);
  const vPhase = connection === "star" ? vLine / Math.sqrt(3) : vLine;
  const iPhase = connection === "star" ? iLine : iLine / Math.sqrt(3);
  return {
    vLine,
    vPhase,
    iLine,
    iPhase,
    P,
    Q,
    S,
    pf,
    phiDeg: ((Math.acos(pf) * 180) / Math.PI) * (lagging ? 1 : -1),
    zPhase: vPhase / iPhase,
  };
}

export interface PfCorrection {
  /** Required capacitive reactive power (VAR). */
  Qc: number;
  /** Capacitance per phase for a delta-connected bank (F). */
  cDelta: number;
  /** Capacitance per phase for a star-connected bank (F). */
  cStar: number;
  /** Line current after correction (A). */
  iLineNew: number;
  /** Apparent power after correction (VA). */
  sNew: number;
}

/** Capacitor bank needed to raise a lagging power factor from pf1 to pf2. */
export function pfCorrection(P: number, pf1: number, pf2: number, vLine: number, f: number): PfCorrection | null {
  if (!(P > 0 && vLine > 0 && f > 0) || !(pf1 > 0 && pf1 <= 1) || !(pf2 > 0 && pf2 <= 1) || pf2 <= pf1) return null;
  const tan1 = Math.tan(Math.acos(pf1));
  const tan2 = Math.tan(Math.acos(pf2));
  const Qc = P * (tan1 - tan2);
  const w = 2 * Math.PI * f;
  return {
    Qc,
    // Delta bank: each capacitor sees V_L and supplies Qc/3.
    cDelta: Qc / (3 * w * vLine * vLine),
    // Star bank: each capacitor sees V_L/√3 → 3·(V_L/√3)² = V_L².
    cStar: Qc / (w * vLine * vLine),
    iLineNew: P / (Math.sqrt(3) * vLine * pf2),
    sNew: P / pf2,
  };
}

/* ------------------------------ Transformer ----------------------------- */

export interface TransformerResult {
  turnsRatio: number;
  vSecondary: number;
  iPrimary?: number;
  sLoad?: number;
  type: "Step-down" | "Step-up" | "Isolation (1:1)";
}

export function solveTransformer(vp: number, np: number, ns: number, is?: number): TransformerResult | null {
  if (!(np > 0 && ns > 0) || !Number.isFinite(vp)) return null;
  const a = np / ns;
  const vs = vp / a;
  const r: TransformerResult = {
    turnsRatio: a,
    vSecondary: vs,
    type: Math.abs(a - 1) < 1e-9 ? "Isolation (1:1)" : a > 1 ? "Step-down" : "Step-up",
  };
  if (is !== undefined && is >= 0) {
    r.iPrimary = is / a;
    r.sLoad = vs * is;
  }
  return r;
}

export interface EfficiencyResult {
  output: number;
  copperLoss: number;
  totalLoss: number;
  input: number;
  efficiency: number;
  /** Load fraction (of rated) at which efficiency is maximum: x = √(Pi / Pcu,FL). */
  maxEffLoad: number;
  maxEfficiency: number;
}

/**
 * Transformer efficiency at a fraction `x` of rated load:
 * η = x·S·pf / (x·S·pf + P_i + x²·P_cu,FL)
 */
export function transformerEfficiency(sRated: number, x: number, pf: number, ironLoss: number, cuLossFL: number): EfficiencyResult | null {
  if (!(sRated > 0 && x > 0 && pf > 0 && pf <= 1 && ironLoss >= 0 && cuLossFL >= 0)) return null;
  const output = x * sRated * pf;
  const copperLoss = x * x * cuLossFL;
  const totalLoss = ironLoss + copperLoss;
  const input = output + totalLoss;
  const maxEffLoad = cuLossFL > 0 ? Math.sqrt(ironLoss / cuLossFL) : Infinity;
  const outMax = maxEffLoad * sRated * pf;
  const maxEfficiency = Number.isFinite(maxEffLoad) ? outMax / (outMax + 2 * ironLoss) : output / input;
  return { output, copperLoss, totalLoss, input, efficiency: output / input, maxEffLoad, maxEfficiency };
}

/* ---------------------------- Induction motor ---------------------------- */

export interface MotorResult {
  syncSpeed: number;
  slip?: number;
  rotorFrequency?: number;
  slipSpeed?: number;
  torque?: number;
}

/** N_s = 120·f / P, s = (N_s − N_r) / N_s, f_r = s·f, T = P_out / ω_r. */
export function solveInductionMotor(f: number, poles: number, nRotor?: number, pOut?: number): MotorResult | null {
  if (!(f > 0) || !(poles >= 2) || poles % 2 !== 0) return null;
  const syncSpeed = (120 * f) / poles;
  const r: MotorResult = { syncSpeed };
  if (nRotor !== undefined && nRotor >= 0) {
    r.slip = (syncSpeed - nRotor) / syncSpeed;
    r.rotorFrequency = r.slip * f;
    r.slipSpeed = syncSpeed - nRotor;
    if (pOut !== undefined && pOut > 0 && nRotor > 0) r.torque = pOut / ((2 * Math.PI * nRotor) / 60);
  }
  return r;
}
