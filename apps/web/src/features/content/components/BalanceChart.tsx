"use client";
import type { BalanceConfig, evaluateBalance } from "@/lib/content/balance";

type Point = ReturnType<typeof evaluateBalance>["points"][number];
const label = (value: number) => {
  const rounded = Number(value.toPrecision(4));
  return Number.isFinite(rounded) ? rounded.toString() : value.toPrecision(4);
};
function domain(values: number[], zero = false): [number, number] {
  let min = zero ? 0 : Infinity;
  let max = zero ? 0 : -Infinity;
  for (const value of values) {
    min = Math.min(min, value);
    max = Math.max(max, value);
  }
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
// Divide before subtraction so opposite, very large finite coordinates still fit.
const fraction = (value: number, [min, max]: [number, number]) => {
  const magnitude = Math.max(Math.abs(min), Math.abs(max), 1);
  return (
    (value / magnitude - min / magnitude) / (max / magnitude - min / magnitude)
  );
};
export default function BalanceChart({
  config,
  points,
}: {
  config: BalanceConfig;
  points: Point[];
}) {
  if (!points.length)
    return (
      <output className="grid min-h-96 place-items-center text-slate-400">
        No eligible entities. See omission details below.
      </output>
    );
  const scatter = config.visualization_type === "scatter_plot";
  const width = scatter ? 900 : Math.max(900, points.length * 60 + 110);
  const height = 620;
  const left = 90;
  const right = width - 35;
  const top = 40;
  const bottom = scatter ? 540 : 440;
  const xd = domain(points.map((point) => point.values.x));
  const yd = domain(
    points.map((point) => (scatter ? point.values.y : point.values.value)),
    !scatter,
  );
  const x = (value: number) => left + fraction(value, xd) * (right - left);
  const y = (value: number) => bottom - fraction(value, yd) * (bottom - top);
  const yLabel = scatter
    ? (config.y.label ?? config.y.expression)
    : (config.value.label ?? config.value.expression);
  return (
    <div className="overflow-auto rounded-lg border border-slate-700 bg-slate-950/50">
      <svg
        role="img"
        aria-label={config.name ?? config.id}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ minWidth: scatter ? 640 : width }}
      >
        <title>{config.name ?? config.id}</title>
        {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio) => {
          const value = yd[0] * (1 - ratio) + yd[1] * ratio;
          const py = bottom - ratio * (bottom - top);
          return (
            <g key={ratio}>
              <line x1={left} x2={right} y1={py} y2={py} stroke="#334155" />
              <text
                x={left - 10}
                y={py + 4}
                textAnchor="end"
                fill="#94a3b8"
                fontSize="12"
              >
                {label(value)}
              </text>
            </g>
          );
        })}
        <line x1={left} x2={left} y1={top} y2={bottom} stroke="#94a3b8" />
        <text
          transform={`translate(20 ${(top + bottom) / 2}) rotate(-90)`}
          textAnchor="middle"
          fill="#cbd5e1"
          fontSize="14"
        >
          {yLabel}
        </text>
        {scatter ? (
          <>
            <line
              x1={left}
              x2={right}
              y1={bottom}
              y2={bottom}
              stroke="#94a3b8"
            />
            {[0, 0.2, 0.4, 0.6, 0.8, 1].map((ratio) => {
              return (
                <text
                  key={ratio}
                  x={left + ratio * (right - left)}
                  y={bottom + 24}
                  fill="#94a3b8"
                  fontSize="12"
                  textAnchor="middle"
                >
                  {label(xd[0] * (1 - ratio) + xd[1] * ratio)}
                </text>
              );
            })}
            <text
              x={(left + right) / 2}
              y={height - 20}
              textAnchor="middle"
              fill="#cbd5e1"
              fontSize="14"
            >
              {config.x.label ?? config.x.expression}
            </text>
            {points.map((point) => {
              const rotation = (
                point.data as { visual?: { rotate_deg?: unknown } }
              )?.visual?.rotate_deg;
              return (
                <g
                  key={point.id}
                  transform={`translate(${x(point.values.x)} ${y(point.values.y)})`}
                  tabIndex={0}
                  aria-label={`${point.id}: x ${point.values.x}, y ${point.values.y}`}
                >
                  <title>{`${point.id}: x=${point.values.x}, y=${point.values.y}`}</title>
                  <circle r={config.dot_size / 8} fill="#22d3ee" />
                  <image
                    href={`/assets/${encodeURIComponent(point.id)}/idle.png`}
                    x={-config.dot_size / 2}
                    y={-config.dot_size / 2}
                    width={config.dot_size}
                    height={config.dot_size}
                    transform={`rotate(${typeof rotation === "number" && Number.isFinite(rotation) ? rotation : 0})`}
                  />
                </g>
              );
            })}
          </>
        ) : (
          <>
            <line x1={left} x2={right} y1={y(0)} y2={y(0)} stroke="#94a3b8" />
            {points.map((point, index) => {
              const step = (right - left) / points.length;
              const px = left + (index + 0.5) * step;
              const py = y(point.values.value);
              return (
                <g
                  key={point.id}
                  tabIndex={0}
                  aria-label={`${point.id}: ${point.values.value}`}
                >
                  <title>{`${point.id}: ${point.values.value}`}</title>
                  <rect
                    x={px - step * 0.35}
                    y={Math.min(py, y(0))}
                    width={step * 0.7}
                    height={Math.max(1, Math.abs(py - y(0)))}
                    fill="#22d3ee"
                  />
                  <text
                    x={px}
                    y={py + (point.values.value < 0 ? 16 : -8)}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize="11"
                  >
                    {label(point.values.value)}
                  </text>
                  <text
                    transform={`translate(${px} ${bottom + 20}) rotate(55)`}
                    fill="#94a3b8"
                    fontSize="12"
                  >
                    {point.id}
                  </text>
                </g>
              );
            })}
          </>
        )}
      </svg>
    </div>
  );
}
