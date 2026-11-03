export type AxisBounds = { min?: number; max?: number };

function automaticDomain(values: number[], zero: boolean): [number, number] {
  let min = zero ? 0 : Infinity;
  let max = zero ? 0 : -Infinity;
  for (const value of values) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0, 1];
  if (min === max) {
    const padding = Math.abs(min) * 0.1 || 1;
    return [
      Number.isFinite(min - padding) ? min - padding : min,
      Number.isFinite(max + padding) ? max + padding : max,
    ];
  }
  if (zero) return [min, max];
  const padding = max / 20 - min / 20;
  return [
    Number.isFinite(min - padding) ? min - padding : min,
    Number.isFinite(max + padding) ? max + padding : max,
  ];
}

/** Outliers occupy fixed slots, never a second numeric scale. */
export function balanceAxis(
  values: number[],
  bounds: AxisBounds = {},
  zero = false,
) {
  const below =
    bounds.min !== undefined &&
    values.some((value) => bounds.min !== undefined && value < bounds.min);
  const above =
    bounds.max !== undefined &&
    values.some((value) => bounds.max !== undefined && value > bounds.max);
  const inRange = values.filter(
    (value) =>
      (bounds.min === undefined || value >= bounds.min) &&
      (bounds.max === undefined || value <= bounds.max),
  );
  const includeZero =
    zero &&
    (bounds.min === undefined || bounds.min <= 0) &&
    (bounds.max === undefined || bounds.max >= 0);
  const automatic = automaticDomain(inRange, includeZero);
  let min = bounds.min ?? automatic[0];
  let max = bounds.max ?? automatic[1];
  if (min >= max) {
    // One-sided bounds can leave no in-range values to infer the other end.
    if (bounds.min === undefined) {
      const span = Math.abs(max) * 0.1 || 1;
      min = Number.isFinite(max - span) ? max - span : max;
    }
    if (bounds.max === undefined) {
      const span = Math.abs(min) * 0.1 || 1;
      max = Number.isFinite(min + span) ? min + span : min;
    }
  }
  const start = below ? 0.12 : 0;
  const end = above ? 0.88 : 1;
  function position(value: number): number {
    if (below && value < min) return 0;
    if (above && value > max) return 1;
    // Divide before subtraction to avoid overflow for opposite finite extremes.
    const magnitude = Math.max(Math.abs(min), Math.abs(max), 1);
    const range = max / magnitude - min / magnitude;
    const ratio =
      range === 0 ? 0.5 : (value / magnitude - min / magnitude) / range;
    return start + Math.max(0, Math.min(1, ratio)) * (end - start);
  }
  const ticks = [0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio) => ({
    value: min * (1 - ratio) + max * ratio,
    position: start + ratio * (end - start),
  }));
  const breaks: {
    position: number;
    side: "below" | "above";
    bound: number;
    slot: number;
  }[] = [];
  if (below)
    breaks.push({ position: 0.06, side: "below", bound: min, slot: 0 });
  if (above)
    breaks.push({ position: 0.94, side: "above", bound: max, slot: 1 });
  return { min, max, position, ticks, breaks };
}
