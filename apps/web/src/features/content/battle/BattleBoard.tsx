"use client";

import { useRef, useState, type PointerEvent } from "react";
import { BATTLE_API, TEAM_LABEL, fits, type Draft, type Point, type Team, type Unit } from "./model";
import type { ReplayEvent } from "./useBattleRun";

const TEAM_COLOR = { a: "#67e8f9", b: "#fbbf24" };
export type Hull = [id: number, x: number, y: number, health: number];
export type Shot = [id: number, x: number, y: number];
export type BoardReplay = { hulls: Hull[]; shots: Shot[]; effects: (ReplayEvent & { key: string })[] };
export type BoardTools = {
  place: (point: Point) => void; move: (id: string, point: Point) => void; select: (id: string) => void;
  palette: { unit: Unit; team: Team } | null;
};

type Drag = { id: string; startX: number; startY: number; moved: boolean };

export default function BattleBoard({ draft, units, selected, tools, replay }: {
  draft: Draft; units: Map<string, Unit>; selected: string; tools?: BoardTools; replay?: BoardReplay;
}) {
  const board = useRef<SVGSVGElement>(null);
  const drag = useRef<Drag | null>(null);
  const [ghost, setGhost] = useState<{ point: Point; unit: Unit; team: Team } | null>(null);
  const [brokenSprites, setBrokenSprites] = useState<Record<string, true>>({});
  const { width, height } = draft.bounds;
  const marker = Math.max(width, height) / 62;
  const hulls: Hull[] = replay?.hulls ?? draft.placements.map((p, i) => [i + 1, p.x, p.y, 0]);

  function point(event: PointerEvent<SVGSVGElement>) {
    const matrix = board.current?.getScreenCTM();
    if (!matrix) return null;
    const p = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    return Number.isFinite(p.x) && Number.isFinite(p.y) ? { x: Math.fround(p.x), y: Math.fround(p.y) } : null;
  }

  function down(event: PointerEvent<SVGSVGElement>) {
    if (!tools || event.button !== 0 || !event.isPrimary) return;
    const id = (event.target as Element).closest("[data-unit]")?.getAttribute("data-unit");
    if (id) {
      tools.select(id);
      drag.current = { id, startX: event.clientX, startY: event.clientY, moved: false };
      event.currentTarget.setPointerCapture(event.pointerId);
    } else {
      const p = point(event);
      if (p && tools.palette && fits(draft.bounds, p, 0)) tools.place(p);
    }
  }

  function move(event: PointerEvent<SVGSVGElement>) {
    if (!tools || !event.isPrimary) return;
    const p = point(event);
    const active = drag.current;
    if (active && Math.hypot(event.clientX - active.startX, event.clientY - active.startY) >= 4) active.moved = true;
    const target = active ? draft.placements.find((p) => p.id === active.id) : undefined;
    const unit = target ? units.get(target.type_id) : tools.palette?.unit;
    const team = target?.team ?? tools.palette?.team;
    setGhost(p && unit && team && (!active || active.moved) ? { point: p, unit, team } : null);
  }

  function up(event: PointerEvent<SVGSVGElement>) {
    if (!event.isPrimary) return;
    const active = drag.current;
    drag.current = null;
    setGhost(null);
    if (active?.moved && tools) {
      const p = point(event);
      if (p) tools.move(active.id, p);
    }
  }

  return <svg ref={board} viewBox={`${-width / 2} ${-height / 2} ${width} ${height}`}
    aria-label={`${width} by ${height} battle arena${tools ? ". Use the coordinate and roster controls for keyboard placement and movement." : " replay"}`}
    className={`block h-[min(62vh,42rem)] w-full rounded border border-slate-700 bg-slate-950 ${tools ? "touch-none cursor-crosshair" : ""}`}
    onPointerDown={down} onPointerMove={move} onPointerUp={up}
    onPointerLeave={() => { if (!drag.current) setGhost(null); }}
    onLostPointerCapture={() => { drag.current = null; setGhost(null); }}
    onPointerCancel={() => { drag.current = null; setGhost(null); }}>
    <rect x={-width / 2} y={-height / 2} width={width} height={height} fill="#0f172a" stroke="#64748b" vectorEffect="non-scaling-stroke" />
    {[-0.25, 0, 0.25].map((n) => <g key={n} stroke="#25334a" pointerEvents="none">
      <line x1={width * n} x2={width * n} y1={-height / 2} y2={height / 2} vectorEffect="non-scaling-stroke" />
      <line x1={-width / 2} x2={width / 2} y1={height * n} y2={height * n} vectorEffect="non-scaling-stroke" />
    </g>)}
    {hulls.map(([id, x, y]) => {
      const p = draft.placements[id - 1];
      const unit = units.get(p.type_id);
      if (!unit) return null;
      const color = TEAM_COLOR[p.team];
      const isSelected = selected === p.id;
      const hasSprite = unit.sprite && !brokenSprites[unit.id];
      return <g key={id} transform={`translate(${x} ${y})`} data-unit={p.id} className={tools ? "cursor-grab" : undefined}>
        <title>{TEAM_LABEL[p.team]} · {p.type_id} #{id}{hasSprite ? "" : " · No pinned sprite"}</title>
        <circle r={Math.max(marker, unit.hull_radius)} fill="transparent" />
        <circle r={unit.hull_radius} fill="none" stroke={color} opacity={isSelected ? 0.9 : 0.35} vectorEffect="non-scaling-stroke" />
        {hasSprite ? <image href={`${BATTLE_API}/art/${draft.revision}/${unit.id}`} x={-marker} y={-marker} width={marker * 2} height={marker * 2}
          onError={() => setBrokenSprites(previous => ({ ...previous, [unit.id]: true }))} />
          : p.team === "a" ? <circle r={marker * 0.52} fill={color} />
          : <rect x={-marker * 0.39} y={-marker * 0.39} width={marker * 0.78} height={marker * 0.78} fill={color} transform="rotate(45)" />}
        {p.team === "a"
          ? <circle r={marker * 0.78} fill="none" stroke={color} strokeWidth={isSelected ? 2 : 1} vectorEffect="non-scaling-stroke" />
          : <path d={`M 0 ${-marker} L ${marker} 0 L 0 ${marker} L ${-marker} 0 Z`} fill="none" stroke={color}
            strokeWidth={isSelected ? 2 : 1} vectorEffect="non-scaling-stroke" />}
        <text x={0} y={-marker * 1.12} fill={color} stroke="#0f172a" paintOrder="stroke" strokeWidth={marker / 9} textAnchor="middle" fontWeight="bold"
          fontSize={marker * 0.76}>{p.team.toUpperCase()}{id}</text>
      </g>;
    })}
    {tools && ghost && <g transform={`translate(${ghost.point.x} ${ghost.point.y})`} pointerEvents="none"
      stroke={fits(draft.bounds, ghost.point, ghost.unit.hull_radius) ? TEAM_COLOR[ghost.team] : "#f87171"}>
      <circle r={Math.max(ghost.unit.hull_radius, marker / 3)} strokeWidth={2} vectorEffect="non-scaling-stroke" fill="none" />
      <path d={`M ${-marker / 3} 0 H ${marker / 3} M 0 ${-marker / 3} V ${marker / 3}`} vectorEffect="non-scaling-stroke" />
    </g>}
    {replay?.shots.map(([id, x, y]) => <circle key={id} cx={x} cy={y} r={marker * 0.22} fill="#fdf4d3" stroke="#fb923c" vectorEffect="non-scaling-stroke" />)}
    {replay?.effects.map(event => {
      if (event.kind === "laser") return <line key={event.key} x1={event.from[0]} y1={event.from[1]} x2={event.to[0]} y2={event.to[1]}
        stroke="#f472b6" strokeWidth={2} vectorEffect="non-scaling-stroke" />;
      if (event.kind === "launch") return <circle key={event.key} cx={event.x} cy={event.y} r={marker * 0.38} fill="none" stroke="#fb923c" vectorEffect="non-scaling-stroke" />;
      if (event.kind === "casualty") return <path key={event.key} transform={`translate(${event.x} ${event.y})`}
        d={`M ${-marker} ${-marker} L ${marker} ${marker} M ${marker} ${-marker} L ${-marker} ${marker}`}
        stroke="#fca5a5" strokeWidth={2} vectorEffect="non-scaling-stroke" />;
      return <circle key={event.key} cx={event.x} cy={event.y} r={marker * 0.58} strokeDasharray={event.reason === "contact" ? undefined : "3 2"}
        fill="none" stroke={event.reason === "contact" ? "#fcd34d" : "#94a3b8"} strokeWidth={2} vectorEffect="non-scaling-stroke" />;
    })}
  </svg>;
}
