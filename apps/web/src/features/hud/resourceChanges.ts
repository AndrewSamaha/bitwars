export const RESOURCE_TREND_WINDOW = 10;

export type ResourceTrend = {
  changes: number[];
  average: number;
};

export function resourceChanges(
  previous: Record<string, number>,
  current: Record<string, number>,
) {
  return Object.fromEntries(
    Object.entries(current).map(([key, value]) => [
      key,
      value - (previous[key] ?? value),
    ]),
  );
}

export function addResourceChange(
  changes: number[],
  change: number,
  window = RESOURCE_TREND_WINDOW,
): ResourceTrend {
  const next = [...changes, change].slice(-Math.max(1, window));
  return {
    changes: next,
    average: next.reduce((total, value) => total + value, 0) / next.length,
  };
}
