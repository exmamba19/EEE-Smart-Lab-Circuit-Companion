import {
  colorByName,
  EIA96_MULTIPLIERS,
  EIA96_VALUES,
  type ColorName,
} from "@/data/resistorColors";

export interface BandDecodeResult {
  ohms: number;
  tolerance: number;
  min: number;
  max: number;
  digits: string;
}

/** Fix floating point noise such as 4.7000000000001 → 4.7. */
const clean = (x: number) => Number(x.toPrecision(12));

/**
 * Decode a 4-band (d d × tol) or 5-band (d d d × tol) resistor.
 */
export function decodeBands(bands: ColorName[]): BandDecodeResult | null {
  if (bands.length !== 4 && bands.length !== 5) return null;
  const digitCount = bands.length - 2;
  const digitBands = bands.slice(0, digitCount).map(colorByName);
  const mult = colorByName(bands[digitCount]).multiplier;
  const tol = colorByName(bands[digitCount + 1]).tolerance;
  if (digitBands.some((b) => b.digit === undefined) || mult === undefined || tol === undefined) {
    return null;
  }
  const digits = digitBands.map((b) => b.digit).join("");
  const ohms = clean(Number(digits) * mult);
  return {
    ohms,
    tolerance: tol,
    min: clean(ohms * (1 - tol / 100)),
    max: clean(ohms * (1 + tol / 100)),
    digits,
  };
}

export type SmdCodeType = "3-digit" | "4-digit" | "R-notation" | "EIA-96" | "Jumper";

export interface SmdDecodeResult {
  ohms: number;
  type: SmdCodeType;
  explanation: string;
  /** Typical tolerance implied by the code family. */
  tolerance: string;
}

/**
 * Decode an SMD resistor marking.
 * Supports: 3-digit (103), 4-digit (1002), R-notation (4R7, R47, 10R0) and EIA-96 (01C).
 */
export function decodeSMD(input: string): SmdDecodeResult | { error: string } {
  const code = input.trim().toUpperCase().replace(/\s+/g, "");
  if (!code) return { error: "Enter an SMD code" };

  if (/^0+$/.test(code)) {
    return { ohms: 0, type: "Jumper", explanation: "All zeros = 0 Ω jumper / zero-ohm link", tolerance: "—" };
  }

  // R-notation: R marks the decimal point (4R7 = 4.7 Ω, R010 = 0.01 Ω)
  if (/^\d*R\d*$/.test(code) && code.length >= 2 && code.length <= 5 && code !== "R") {
    const ohms = clean(Number(code.replace("R", ".")));
    if (Number.isFinite(ohms)) {
      return {
        ohms,
        type: "R-notation",
        explanation: `"R" marks the decimal point → ${ohms} Ω`,
        tolerance: code.replace("R", "").length >= 3 ? "±1%" : "±5%",
      };
    }
  }

  // EIA-96: two digits (01–96) + multiplier letter
  const eia = code.match(/^(\d{2})([ZYRXSABHCDEF])$/);
  if (eia) {
    const idx = Number(eia[1]);
    if (idx < 1 || idx > 96) return { error: "EIA-96 index must be between 01 and 96" };
    const base = EIA96_VALUES[idx - 1];
    const mult = EIA96_MULTIPLIERS[eia[2]];
    return {
      ohms: clean(base * mult),
      type: "EIA-96",
      explanation: `Code ${eia[1]} → ${base}, letter ${eia[2]} → ×${mult}`,
      tolerance: "±1%",
    };
  }

  // 3-digit: two significant digits + multiplier exponent
  if (/^\d{3}$/.test(code)) {
    const sig = Number(code.slice(0, 2));
    const exp = Number(code[2]);
    return {
      ohms: clean(sig * 10 ** exp),
      type: "3-digit",
      explanation: `${code.slice(0, 2)} × 10^${exp}`,
      tolerance: "±5%",
    };
  }

  // 4-digit: three significant digits + multiplier exponent
  if (/^\d{4}$/.test(code)) {
    const sig = Number(code.slice(0, 3));
    const exp = Number(code[3]);
    return {
      ohms: clean(sig * 10 ** exp),
      type: "4-digit",
      explanation: `${code.slice(0, 3)} × 10^${exp}`,
      tolerance: "±1%",
    };
  }

  return { error: "Unrecognised code. Try formats like 103, 4R7, 1002 or 01C." };
}
