export type FormulaCategory =
  | "DC Circuits"
  | "AC Circuits"
  | "Filters & Transients"
  | "Amplifiers"
  | "Semiconductors"
  | "Power & Machines"
  | "Digital & Signals";

export interface Formula {
  id: string;
  name: string;
  category: FormulaCategory;
  expression: string;
  /** Variable legend. */
  variables: string;
  note?: string;
}

export const FORMULA_CATEGORIES: FormulaCategory[] = [
  "DC Circuits",
  "AC Circuits",
  "Filters & Transients",
  "Amplifiers",
  "Semiconductors",
  "Power & Machines",
  "Digital & Signals",
];

export const FORMULAS: Formula[] = [
  // DC Circuits
  { id: "ohm", name: "Ohm's Law", category: "DC Circuits", expression: "V = I · R", variables: "V voltage (V), I current (A), R resistance (Ω)" },
  { id: "power", name: "Electrical Power", category: "DC Circuits", expression: "P = V · I = I² · R = V² / R", variables: "P power (W)" },
  { id: "series-r", name: "Resistors in Series", category: "DC Circuits", expression: "R_eq = R₁ + R₂ + … + Rₙ", variables: "R_eq equivalent resistance" },
  { id: "parallel-r", name: "Resistors in Parallel", category: "DC Circuits", expression: "1/R_eq = 1/R₁ + 1/R₂ + … + 1/Rₙ", variables: "Two resistors: R_eq = R₁R₂ / (R₁ + R₂)" },
  { id: "divider", name: "Voltage Divider", category: "DC Circuits", expression: "V_out = V_in · R₂ / (R₁ + R₂)", variables: "R₂ is the bottom (output-side) resistor" },
  { id: "current-divider", name: "Current Divider", category: "DC Circuits", expression: "I₁ = I_T · R₂ / (R₁ + R₂)", variables: "I_T total current into the parallel pair" },
  { id: "kvl", name: "Kirchhoff's Voltage Law", category: "DC Circuits", expression: "Σ V = 0 (around any closed loop)", variables: "Sum of rises equals sum of drops" },
  { id: "kcl", name: "Kirchhoff's Current Law", category: "DC Circuits", expression: "Σ I_in = Σ I_out (at any node)", variables: "Charge is conserved at a node" },
  { id: "resistivity", name: "Resistance of a Conductor", category: "DC Circuits", expression: "R = ρ · L / A", variables: "ρ resistivity (Ω·m), L length (m), A area (m²)" },
  { id: "temp-r", name: "Temperature Coefficient", category: "DC Circuits", expression: "R_T = R₀ · [1 + α(T − T₀)]", variables: "α temperature coefficient (1/°C)" },
  { id: "thevenin", name: "Thevenin / Norton Equivalent", category: "DC Circuits", expression: "V_th = I_N · R_th,  R_th = V_oc / I_sc", variables: "V_oc open-circuit voltage, I_sc short-circuit current" },
  { id: "max-power", name: "Maximum Power Transfer", category: "DC Circuits", expression: "R_L = R_th,  P_max = V_th² / (4 R_th)", variables: "Load matched to source resistance" },

  // AC Circuits
  { id: "xl", name: "Inductive Reactance", category: "AC Circuits", expression: "X_L = 2π f L", variables: "f frequency (Hz), L inductance (H)" },
  { id: "xc", name: "Capacitive Reactance", category: "AC Circuits", expression: "X_C = 1 / (2π f C)", variables: "C capacitance (F)" },
  { id: "impedance", name: "Series RLC Impedance", category: "AC Circuits", expression: "Z = √(R² + (X_L − X_C)²)", variables: "Phase: φ = arctan((X_L − X_C) / R)" },
  { id: "rms", name: "RMS of a Sine Wave", category: "AC Circuits", expression: "V_rms = V_peak / √2 ≈ 0.707 · V_peak", variables: "V_pp = 2 · V_peak" },
  { id: "avg", name: "Average of Rectified Sine", category: "AC Circuits", expression: "V_avg = 2 V_peak / π ≈ 0.637 · V_peak", variables: "Full-wave rectified average" },
  { id: "ac-power", name: "AC Power Triangle", category: "AC Circuits", expression: "S = V_rms · I_rms,  P = S cos φ,  Q = S sin φ", variables: "S apparent (VA), P real (W), Q reactive (VAR)" },
  { id: "pf", name: "Power Factor", category: "AC Circuits", expression: "PF = cos φ = P / S", variables: "φ angle between voltage and current" },
  { id: "three-phase", name: "Three-Phase Power", category: "AC Circuits", expression: "P = √3 · V_L · I_L · cos φ", variables: "V_L line voltage, I_L line current" },
  { id: "star-delta", name: "Star (Y) Line/Phase Relation", category: "AC Circuits", expression: "V_L = √3 · V_ph,  I_L = I_ph", variables: "Delta: V_L = V_ph, I_L = √3 · I_ph" },

  // Filters & Transients
  { id: "tau-rc", name: "RC Time Constant", category: "Filters & Transients", expression: "τ = R · C", variables: "≈ 63.2% charged after 1τ, ≈ 99.3% after 5τ" },
  { id: "tau-rl", name: "RL Time Constant", category: "Filters & Transients", expression: "τ = L / R", variables: "L inductance (H)" },
  { id: "fc-rc", name: "RC Cutoff Frequency", category: "Filters & Transients", expression: "f_c = 1 / (2π R C)", variables: "−3 dB point of a first-order RC filter" },
  { id: "fr", name: "LC Resonant Frequency", category: "Filters & Transients", expression: "f_r = 1 / (2π √(L C))", variables: "X_L = X_C at resonance" },
  { id: "q-series", name: "Series RLC Q-Factor", category: "Filters & Transients", expression: "Q = (1/R) · √(L / C) = f_r / BW", variables: "BW bandwidth (Hz)" },
  { id: "rc-charge", name: "Capacitor Charging", category: "Filters & Transients", expression: "v_C(t) = V_s · (1 − e^(−t/τ))", variables: "Discharge: v_C(t) = V₀ · e^(−t/τ)" },
  { id: "cap-energy", name: "Energy Stored", category: "Filters & Transients", expression: "E_C = ½ C V²,  E_L = ½ L I²", variables: "E energy (J)" },
  { id: "series-c", name: "Capacitors in Series / Parallel", category: "Filters & Transients", expression: "1/C_s = Σ 1/Cᵢ,  C_p = Σ Cᵢ", variables: "Inductors combine like resistors" },
  { id: "db", name: "Decibel Gain", category: "Filters & Transients", expression: "G_dB = 20 log₁₀(V_out / V_in) = 10 log₁₀(P_out / P_in)", variables: "−3 dB ≈ 0.707 voltage ratio" },

  // Amplifiers
  { id: "inv", name: "Inverting Amplifier", category: "Amplifiers", expression: "A_v = −R_f / R_in", variables: "V_out = A_v · V_in" },
  { id: "noninv", name: "Non-Inverting Amplifier", category: "Amplifiers", expression: "A_v = 1 + R_f / R_g", variables: "R_g from inverting input to ground" },
  { id: "summing", name: "Summing Amplifier", category: "Amplifiers", expression: "V_out = −R_f · (V₁/R₁ + V₂/R₂ + …)", variables: "Inverting summer" },
  { id: "diff", name: "Difference Amplifier", category: "Amplifiers", expression: "V_out = (R_f / R_in) · (V₂ − V₁)", variables: "With matched resistor ratios" },
  { id: "integrator", name: "Op-Amp Integrator", category: "Amplifiers", expression: "V_out = −(1 / RC) ∫ V_in dt", variables: "Differentiator: V_out = −RC · dV_in/dt" },
  { id: "gbw", name: "Gain-Bandwidth Product", category: "Amplifiers", expression: "GBW = A_v · f_−3dB", variables: "LM741 GBW ≈ 1 MHz" },
  { id: "slew", name: "Slew-Rate Limit", category: "Amplifiers", expression: "f_max = SR / (2π V_peak)", variables: "LM741 SR ≈ 0.5 V/µs" },
  { id: "cmrr", name: "CMRR", category: "Amplifiers", expression: "CMRR(dB) = 20 log₁₀(A_d / A_cm)", variables: "A_d differential gain, A_cm common-mode gain" },

  // Semiconductors
  { id: "diode", name: "Shockley Diode Equation", category: "Semiconductors", expression: "I_D = I_S · (e^(V_D / (n V_T)) − 1)", variables: "V_T = kT/q ≈ 25.85 mV @ 300 K" },
  { id: "rd", name: "Diode Dynamic Resistance", category: "Semiconductors", expression: "r_d = ΔV / ΔI ≈ n V_T / I_D", variables: "Small-signal resistance at the Q-point" },
  { id: "led", name: "LED Series Resistor", category: "Semiconductors", expression: "R = (V_s − V_f) / I_f", variables: "V_f forward voltage, I_f forward current" },
  { id: "bjt-beta", name: "BJT Current Gain", category: "Semiconductors", expression: "I_C = β · I_B,  I_E = I_C + I_B", variables: "α = β / (β + 1)" },
  { id: "mosfet-sat", name: "MOSFET Saturation Current", category: "Semiconductors", expression: "I_D = ½ k_n (V_GS − V_th)²", variables: "Valid for V_DS ≥ V_GS − V_th" },
  { id: "zener", name: "Zener Regulator Resistor", category: "Semiconductors", expression: "R_s = (V_in − V_Z) / (I_Z + I_L)", variables: "I_Z min zener current, I_L load current" },
  { id: "ripple", name: "Rectifier Ripple Voltage", category: "Semiconductors", expression: "V_r ≈ I_L / (f · C)", variables: "f = 2·f_line for full-wave" },

  // Power & Machines
  { id: "efficiency", name: "Efficiency", category: "Power & Machines", expression: "η = P_out / P_in × 100%", variables: "Losses = P_in − P_out" },
  { id: "transformer", name: "Ideal Transformer", category: "Power & Machines", expression: "V_p / V_s = N_p / N_s = I_s / I_p", variables: "N number of turns" },
  { id: "sync-speed", name: "Synchronous Speed", category: "Power & Machines", expression: "N_s = 120 f / P", variables: "N_s in rpm, P number of poles" },
  { id: "slip", name: "Induction Motor Slip", category: "Power & Machines", expression: "s = (N_s − N_r) / N_s", variables: "N_r rotor speed" },
  { id: "torque", name: "Mechanical Power & Torque", category: "Power & Machines", expression: "P = T · ω = 2π N T / 60", variables: "T torque (N·m), N speed (rpm)" },
  { id: "dc-emf", name: "DC Machine Back-EMF", category: "Power & Machines", expression: "E_b = V − I_a R_a", variables: "I_a armature current, R_a armature resistance" },
  { id: "energy", name: "Electrical Energy", category: "Power & Machines", expression: "E = P · t  (kWh = kW × h)", variables: "1 kWh = 3.6 MJ" },

  // Digital & Signals
  { id: "555-astable", name: "555 Astable Frequency", category: "Digital & Signals", expression: "f = 1.44 / ((R₁ + 2R₂) · C)", variables: "Duty = (R₁ + R₂) / (R₁ + 2R₂)" },
  { id: "555-mono", name: "555 Monostable Pulse Width", category: "Digital & Signals", expression: "t = 1.1 · R · C", variables: "Triggered by falling edge on pin 2" },
  { id: "nyquist", name: "Nyquist Sampling", category: "Digital & Signals", expression: "f_s ≥ 2 · f_max", variables: "f_s sampling frequency" },
  { id: "adc", name: "ADC Resolution", category: "Digital & Signals", expression: "LSB = V_ref / 2ⁿ,  code = ⌊V_in / LSB⌋", variables: "n number of bits (Uno: 10, ESP32: 12)" },
  { id: "pwm", name: "PWM Average Voltage", category: "Digital & Signals", expression: "V_avg = D · V_high", variables: "D duty cycle (0–1)" },
  { id: "snr", name: "Ideal ADC SNR", category: "Digital & Signals", expression: "SNR = 6.02 n + 1.76 dB", variables: "n number of bits" },
  { id: "period", name: "Period & Frequency", category: "Digital & Signals", expression: "T = 1 / f,  ω = 2π f", variables: "ω angular frequency (rad/s)" },
];
