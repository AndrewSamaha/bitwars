"use client";
import type { BalanceConfig, evaluateBalance } from "@/lib/content/balance";
import { balanceAxis } from "@/lib/content/balanceAxis";

type Point = ReturnType<typeof evaluateBalance>["points"][number];
const label = (value: number) => {
  const rounded = Number(value.toPrecision(4));
  return Number.isFinite(rounded) ? rounded.toString() : value.toPrecision(4);
};
function AxisBreak({
  x,
  y,
  vertical,
  description,
}: {
  x: number;
  y: number;
  vertical?: boolean;
  description: string;
}) {
  return (
    <g transform={`translate(${x} ${y})${vertical ? " rotate(90)" : ""}`}>
      <title>{description}</title>
      <rect x="-9" y="-6" width="18" height="12" fill="#020617" />
      <path
        d="M -8 0 L -4 -4 L 4 4 L 8 0"
        fill="none"
        stroke="#cbd5e1"
        strokeWidth="2"
      />
    </g>
  );
}
export default function BalanceChart({
  config,
  points,
  selectedId,
  onSelectEntity,
}: {
  config: BalanceConfig;
  points: Point[];
  selectedId?: string;
  onSelectEntity?: (id: string) => void;
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
  const xAxis = balanceAxis(
    scatter ? points.map((point) => point.values.x) : [],
    scatter ? config.x : {},
  );
  const yAxis = balanceAxis(
    points.map((point) => (scatter ? point.values.y : point.values.value)),
    scatter ? config.y : config.value,
    !scatter,
  );
  const screenX = (position: number) => left + position * (right - left);
  const screenY = (position: number) => bottom - position * (bottom - top);
  const x = (value: number) => screenX(xAxis.position(value));
  const y = (value: number) => screenY(yAxis.position(value));
  const baseline = y(Math.max(yAxis.min, Math.min(yAxis.max, 0)));
  const yLabel = scatter
    ? (config.y.label ?? config.y.expression)
    : (config.value.label ?? config.value.expression);
  return (
    <div className="overflow-auto rounded-lg border border-slate-700 bg-slate-950/50">
      <svg
        role={onSelectEntity ? "group" : "img"}
        aria-label={config.name ?? config.id}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ minWidth: scatter ? 640 : width }}
      >
        <title>{config.name ?? config.id}</title>
        {yAxis.ticks.map(({ value, position }) => {
          const py = screenY(position);
          return (
            <g key={position}>
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
            {xAxis.ticks.map(({ value, position }) => {
              return (
                <text
                  key={position}
                  x={screenX(position)}
                  y={bottom + 24}
                  fill="#94a3b8"
                  fontSize="12"
                  textAnchor="middle"
                >
                  {label(value)}
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
                // biome-ignore lint/a11y/useSemanticElements: HTML buttons cannot wrap SVG graphics; use an accessible SVG group.
                <g
                  key={point.id}
                  transform={`translate(${x(point.values.x)} ${y(point.values.y)})`}
                  tabIndex={0}
                  role="button"
                  aria-pressed={
                    onSelectEntity ? selectedId === point.id : undefined
                  }
                  className={
                    onSelectEntity
                      ? "cursor-pointer outline-none focus:stroke-cyan-300"
                      : undefined
                  }
                  onClick={() => onSelectEntity?.(point.id)}
                  onKeyDown={(event) => {
                    if (
                      onSelectEntity &&
                      (event.key === "Enter" || event.key === " ")
                    ) {
                      event.preventDefault();
                      onSelectEntity(point.id);
                    }
                  }}
                  aria-label={`${point.id}: x ${point.values.x}, y ${point.values.y}`}
                >
                  <title>{`${point.id}: x=${point.values.x}, y=${point.values.y}`}</title>
                  {selectedId === point.id && (
                    <circle
                      r={config.dot_size / 2 + 3}
                      fill="none"
                      stroke="#67e8f9"
                      strokeWidth="2"
                    />
                  )}
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
            <line
              x1={left}
              x2={right}
              y1={baseline}
              y2={baseline}
              stroke="#94a3b8"
            />
            {points.map((point, index) => {
              const step = (right - left) / points.length;
              const px = left + (index + 0.5) * step;
              const py = y(point.values.value);
              return (
                // biome-ignore lint/a11y/useSemanticElements: HTML buttons cannot wrap SVG graphics; use an accessible SVG group.
                <g
                  key={point.id}
                  tabIndex={0}
                  role="button"
                  aria-pressed={
                    onSelectEntity ? selectedId === point.id : undefined
                  }
                  className={
                    onSelectEntity
                      ? "cursor-pointer outline-none focus:stroke-cyan-300"
                      : undefined
                  }
                  onClick={() => onSelectEntity?.(point.id)}
                  onKeyDown={(event) => {
                    if (
                      onSelectEntity &&
                      (event.key === "Enter" || event.key === " ")
                    ) {
                      event.preventDefault();
                      onSelectEntity(point.id);
                    }
                  }}
                  aria-label={`${point.id}: ${point.values.value}`}
                >
                  <title>{`${point.id}: ${point.values.value}`}</title>
                  <rect
                    x={px - step * 0.35}
                    y={Math.min(py, baseline)}
                    width={step * 0.7}
                    height={Math.max(1, Math.abs(py - baseline))}
                    fill="#22d3ee"
                    stroke={selectedId === point.id ? "#e0f2fe" : undefined}
                    strokeWidth={selectedId === point.id ? 3 : undefined}
                  />
                  {yAxis.breaks
                    .filter((axisBreak) =>
                      axisBreak.side === "below"
                        ? point.values.value < axisBreak.bound
                        : point.values.value > axisBreak.bound,
                    )
                    .map((axisBreak) => {
                      const by = screenY(axisBreak.position);
                      return (
                        <path
                          key={axisBreak.side}
                          d={`M ${px - step * 0.35} ${by - 3} L ${px - step * 0.12} ${by + 3} L ${px + step * 0.12} ${by - 3} L ${px + step * 0.35} ${by + 3}`}
                          stroke="#020617"
                          strokeWidth="6"
                          fill="none"
                          pointerEvents="none"
                        />
                      );
                    })}
                  <text
                    x={px}
                    y={py + (py > baseline ? 16 : -8)}
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
        {yAxis.breaks.map((axisBreak) => (
          <g key={axisBreak.side} data-axis-break={`y-${axisBreak.side}`}>
            <line
              x1={left}
              x2={right}
              y1={screenY(axisBreak.position)}
              y2={screenY(axisBreak.position)}
              stroke="#475569"
              strokeDasharray="4 5"
              pointerEvents="none"
            />
            <AxisBreak
              x={left}
              y={screenY(axisBreak.position)}
              vertical
              description={`Values ${axisBreak.side} ${label(axisBreak.bound)} share one position`}
            />
            <text
              x={left - 10}
              y={screenY(axisBreak.slot) + 4}
              textAnchor="end"
              fill="#fbbf24"
              fontSize="12"
            >
              {axisBreak.side === "below" ? "<" : ">"} {label(axisBreak.bound)}
            </text>
          </g>
        ))}
        {scatter &&
          xAxis.breaks.map((axisBreak) => (
            <g key={axisBreak.side} data-axis-break={`x-${axisBreak.side}`}>
              <line
                x1={screenX(axisBreak.position)}
                x2={screenX(axisBreak.position)}
                y1={top}
                y2={bottom}
                stroke="#475569"
                strokeDasharray="4 5"
                pointerEvents="none"
              />
              <AxisBreak
                x={screenX(axisBreak.position)}
                y={bottom}
                description={`Values ${axisBreak.side} ${label(axisBreak.bound)} share one position`}
              />
              <text
                x={screenX(axisBreak.slot)}
                y={bottom + 24}
                textAnchor="middle"
                fill="#fbbf24"
                fontSize="12"
              >
                {axisBreak.side === "below" ? "<" : ">"}{" "}
                {label(axisBreak.bound)}
              </text>
            </g>
          ))}
      </svg>
    </div>
  );
}
