export type ColorName =
  | "black"
  | "brown"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "violet"
  | "grey"
  | "white"
  | "gold"
  | "silver"
  | "none";

export interface BandColor {
  name: ColorName;
  label: string;
  hex: string;
  /** Text color that stays readable on top of `hex`. */
  text: string;
  digit?: number;
  multiplier?: number;
  /** Tolerance in percent. */
  tolerance?: number;
  /** Temperature coefficient (ppm/K) for 6-band resistors. */
  tempCo?: number;
}

export const RESISTOR_COLORS: BandColor[] = [
  { name: "black", label: "Black", hex: "#111111", text: "#fff", digit: 0, multiplier: 1, tempCo: 250 },
  { name: "brown", label: "Brown", hex: "#7b3f00", text: "#fff", digit: 1, multiplier: 10, tolerance: 1, tempCo: 100 },
  { name: "red", label: "Red", hex: "#d32f2f", text: "#fff", digit: 2, multiplier: 100, tolerance: 2, tempCo: 50 },
  { name: "orange", label: "Orange", hex: "#f57c00", text: "#000", digit: 3, multiplier: 1e3, tolerance: 0.05, tempCo: 15 },
  { name: "yellow", label: "Yellow", hex: "#fbc02d", text: "#000", digit: 4, multiplier: 1e4, tolerance: 0.02, tempCo: 25 },
  { name: "green", label: "Green", hex: "#2e7d32", text: "#fff", digit: 5, multiplier: 1e5, tolerance: 0.5, tempCo: 20 },
  { name: "blue", label: "Blue", hex: "#1565c0", text: "#fff", digit: 6, multiplier: 1e6, tolerance: 0.25, tempCo: 10 },
  { name: "violet", label: "Violet", hex: "#7b1fa2", text: "#fff", digit: 7, multiplier: 1e7, tolerance: 0.1, tempCo: 5 },
  { name: "grey", label: "Grey", hex: "#757575", text: "#fff", digit: 8, multiplier: 1e8, tolerance: 0.01, tempCo: 1 },
  { name: "white", label: "White", hex: "#f5f5f5", text: "#000", digit: 9, multiplier: 1e9 },
  { name: "gold", label: "Gold", hex: "#c9a227", text: "#000", multiplier: 0.1, tolerance: 5 },
  { name: "silver", label: "Silver", hex: "#a8a9ad", text: "#000", multiplier: 0.01, tolerance: 10 },
  { name: "none", label: "None", hex: "transparent", text: "inherit", tolerance: 20 },
];

export const colorByName = (name: ColorName): BandColor =>
  RESISTOR_COLORS.find((c) => c.name === name) ?? RESISTOR_COLORS[0];

export const DIGIT_COLORS = RESISTOR_COLORS.filter((c) => c.digit !== undefined);
export const MULTIPLIER_COLORS = RESISTOR_COLORS.filter((c) => c.multiplier !== undefined);
export const TOLERANCE_COLORS = RESISTOR_COLORS.filter((c) => c.tolerance !== undefined);

/** EIA-96 SMD code table: index 1..96 → 3 significant digits (E96 series). */
export const EIA96_VALUES: number[] = [
  100, 102, 105, 107, 110, 113, 115, 118, 121, 124, 127, 130, 133, 137, 140, 143, 147, 150, 154, 158,
  162, 165, 169, 174, 178, 182, 187, 191, 196, 200, 205, 210, 215, 221, 226, 232, 237, 243, 249, 255,
  261, 267, 274, 280, 287, 294, 301, 309, 316, 324, 332, 340, 348, 357, 365, 374, 383, 392, 402, 412,
  422, 432, 442, 453, 464, 475, 487, 499, 511, 523, 536, 549, 562, 576, 590, 604, 619, 634, 649, 665,
  681, 698, 715, 732, 750, 768, 787, 806, 825, 845, 866, 887, 909, 931, 953, 976,
];

/** EIA-96 multiplier letters. */
export const EIA96_MULTIPLIERS: Record<string, number> = {
  Z: 0.001,
  Y: 0.01,
  R: 0.01,
  X: 0.1,
  S: 0.1,
  A: 1,
  B: 10,
  H: 10,
  C: 100,
  D: 1000,
  E: 10000,
  F: 100000,
};
