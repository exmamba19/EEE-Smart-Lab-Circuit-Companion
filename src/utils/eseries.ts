/** IEC 60063 preferred-number series (one decade). */
export const E12 = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];
export const E24 = [
  1.0, 1.1, 1.2, 1.3, 1.5, 1.6, 1.8, 2.0, 2.2, 2.4, 2.7, 3.0, 3.3, 3.6, 3.9, 4.3, 4.7, 5.1, 5.6, 6.2, 6.8, 7.5, 8.2, 9.1,
];

export type ESeries = "E12" | "E24";
const SERIES: Record<ESeries, number[]> = { E12, E24 };

const clean = (x: number) => Number(x.toPrecision(6));

/** Smallest standard value ≥ `value` (used for current-limiting resistors so current never exceeds target). */
export function nextStandardUp(value: number, series: ESeries = "E24"): number {
  if (!(value > 0) || !Number.isFinite(value)) return NaN;
  const decade = Math.pow(10, Math.floor(Math.log10(value)));
  for (const d of [decade, decade * 10]) {
    for (const m of SERIES[series]) {
      const v = clean(m * d);
      if (v >= value * (1 - 1e-9)) return v;
    }
  }
  return NaN;
}

/** Closest standard value (log distance). */
export function nearestStandard(value: number, series: ESeries = "E24"): number {
  if (!(value > 0) || !Number.isFinite(value)) return NaN;
  const decade = Math.pow(10, Math.floor(Math.log10(value)));
  let best = NaN;
  let bestErr = Infinity;
  for (const d of [decade / 10, decade, decade * 10]) {
    for (const m of SERIES[series]) {
      const v = clean(m * d);
      const err = Math.abs(Math.log(v / value));
      if (err < bestErr) {
        bestErr = err;
        best = v;
      }
    }
  }
  return best;
}
