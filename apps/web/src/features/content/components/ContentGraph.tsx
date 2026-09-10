"use client";

import { ENTITY_CONTENT } from "@bitwars/content";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationNodeDatum,
} from "d3-force";
import { useEffect, useRef, useState } from "react";

type Entity = (typeof ENTITY_CONTENT)[number];
type Point = { x: number; y: number };
type GraphNode = SimulationNodeDatum & { id: string; entity: Entity };
type GraphLink = { source: string; target: string };

const LINKS: GraphLink[] = ENTITY_CONTENT.flatMap((entity) =>
  entity.builds.map((target) => ({ source: entity.id, target })),
);
const LINK_IDS = new Set(LINKS.map(({ source, target }) => `${source}:${target}`));

function initialPositions(): Record<string, Point> {
  return Object.fromEntries(ENTITY_CONTENT.map((entity, index) => [entity.id, {
    x: 120 + (index % 6) * 140,
    y: 100 + Math.floor(index / 6) * 150,
  }]));
}

function builderOutwardForce(links: readonly GraphLink[]) {
  let nodesById = new Map<string, GraphNode>();
  function force(alpha: number) {
    for (const { source, target } of links) {
      const builder = nodesById.get(source);
      const child = nodesById.get(target);
      if (!builder || !child) continue;
      const dx = (child.x ?? 0) - (builder.x ?? 0);
      const dy = (child.y ?? 0) - (builder.y ?? 0);
      const distance = Math.hypot(dx, dy) || 1;
      const push = alpha * 0.8;
      child.vx = (child.vx ?? 0) + dx / distance * push;
      child.vy = (child.vy ?? 0) + dy / distance * push;
      builder.vx = (builder.vx ?? 0) - dx / distance * push * 0.15;
      builder.vy = (builder.vy ?? 0) - dy / distance * push * 0.15;
    }
  }
  force.initialize = (nodes: GraphNode[]) => { nodesById = new Map(nodes.map((node) => [node.id, node])); };
  return force;
}

export default function ContentGraph() {
  const [selectedId, setSelectedId] = useState<string>(ENTITY_CONTENT[0]?.id ?? "");
  const [positions, setPositions] = useState<Record<string, Point>>(initialPositions);
  const graphRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<Simulation<GraphNode, undefined> | null>(null);
  const selected = ENTITY_CONTENT.find((entity) => entity.id === selectedId) ?? ENTITY_CONTENT[0];

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    let simulation: Simulation<GraphNode, undefined> | null = null;
    const layout = () => {
      simulation?.stop();
      const width = Math.max(graph.clientWidth, 832);
      const height = graph.clientHeight;
      const nodes: GraphNode[] = ENTITY_CONTENT.map((entity, index) => ({
        id: entity.id,
        entity,
        x: width / 2 + (index % 4 - 1.5) * 120,
        y: height / 2 + (Math.floor(index / 4) - 1) * 120,
      }));
      simulation = forceSimulation(nodes)
        .force("link", forceLink<GraphNode, GraphLink>(LINKS.map((link) => ({ ...link }))).id((node) => node.id).distance(155).strength(0.9))
        .force("charge", forceManyBody().strength(-520))
        .force("collide", forceCollide<GraphNode>(72))
        .force("builder-outward", builderOutwardForce(LINKS))
        .force("center", forceCenter(width / 2, height / 2));
      simulationRef.current = simulation;
      simulation.on("tick", () => setPositions(Object.fromEntries(nodes.map((node) => [node.id, {
        x: Math.min(width - 64, Math.max(64, node.x ?? 64)),
        y: Math.min(height - 64, Math.max(64, node.y ?? 64)),
      }]))));
    };

    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(graph);
    return () => {
      observer.disconnect();
      simulation?.stop();
      simulationRef.current = null;
    };
  }, []);

  function moveNode(id: string, event: React.PointerEvent<HTMLButtonElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const bounds = graphRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const node = simulationRef.current?.nodes().find((candidate) => candidate.id === id);
    if (!node) return;
    node.fx = event.clientX - bounds.left;
    node.fy = event.clientY - bounds.top;
    simulationRef.current?.alphaTarget(0.25).restart();
  }

  function releaseNode(id: string, event: React.PointerEvent<HTMLButtonElement>) {
    event.currentTarget.releasePointerCapture(event.pointerId);
    const node = simulationRef.current?.nodes().find((candidate) => candidate.id === id);
    if (node) {
      node.fx = null;
      node.fy = null;
    }
    simulationRef.current?.alphaTarget(0);
  }

  return (
    <main className="flex min-h-screen bg-slate-950 text-slate-100">
      <section className="min-w-0 flex-1 p-6 lg:p-10">
        <header className="mb-8">
          <p className="text-sm font-medium tracking-[0.24em] text-cyan-400 uppercase">BitWars content</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Entity build graph</h1>
          <p className="mt-2 text-slate-400">Drag sprites to arrange the force graph. Arrows show build relationships.</p>
        </header>

        <div className="overflow-auto rounded-xl border border-slate-700 bg-slate-900/60 p-6 shadow-2xl shadow-black/20">
          <div ref={graphRef} className="relative h-[42rem] min-w-[52rem] overflow-hidden rounded-lg bg-slate-950/50">
            <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible">
              <defs>
                <marker id="build-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#22d3ee" />
                </marker>
                <marker id="reverse-build-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#c084fc" />
                </marker>
              </defs>
              {LINKS.map(({ source, target }) => {
                const from = positions[source];
                const to = positions[target];
                if (!from || !to) return null;
                const reciprocal = LINK_IDS.has(`${target}:${source}`);
                const reverse = reciprocal && source > target;
                if (!reciprocal) {
                  return <line key={`${source}-${target}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#22d3ee" strokeOpacity=".6" strokeWidth="2" markerEnd="url(#build-arrow)" />;
                }
                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const length = Math.hypot(dx, dy) || 1;
                const curve = 28;
                const controlX = (from.x + to.x) / 2 - dy / length * curve;
                const controlY = (from.y + to.y) / 2 + dx / length * curve;
                return <path d={`M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`} fill="none" key={`${source}-${target}`} markerEnd={`url(#${reverse ? "reverse-build-arrow" : "build-arrow"})`} stroke={reverse ? "#c084fc" : "#22d3ee"} strokeOpacity=".8" strokeWidth="2" />;
              })}
            </svg>
            {ENTITY_CONTENT.map((entity) => {
              const position = positions[entity.id];
              return (
                <button
                  className={`absolute flex min-h-28 w-24 -translate-x-1/2 -translate-y-1/2 touch-none flex-col items-center justify-center rounded-xl border bg-transparent p-2 text-center transition ${selectedId === entity.id ? "border-cyan-300 ring-2 ring-cyan-400/40" : "border-slate-700 hover:border-cyan-500"}`}
                  key={entity.id}
                  onClick={() => setSelectedId(entity.id)}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    moveNode(entity.id, event);
                  }}
                  onPointerMove={(event) => moveNode(entity.id, event)}
                  onPointerUp={(event) => releaseNode(entity.id, event)}
                  style={{ left: position?.x, top: position?.y }}
                  type="button"
                >
                  <img alt="" className="pointer-events-none mb-1 size-12 select-none object-contain" draggable={false} onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} src={`/assets/${entity.id}/idle.png`} />
                  <span className="pointer-events-none text-sm font-medium">{entity.id}</span>
                  <span className="pointer-events-none mt-1 text-xs text-slate-400">{entity.builds.length ? `Builds ${entity.builds.length}` : "No builds"}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <aside className="w-96 shrink-0 border-l border-slate-700 bg-slate-900 p-6">
        {selected && <>
          <div className="flex items-center gap-3 border-b border-slate-700 pb-5">
            <img alt="" className="size-14 object-contain" src={`/assets/${selected.id}/idle.png`} />
            <div><p className="text-sm text-slate-400">Entity definition</p><h2 className="text-xl font-semibold">{selected.id}</h2></div>
          </div>
          <p className="mt-5 text-sm font-medium text-slate-300">Fields</p>
          <pre className="mt-3 max-h-[calc(100vh-13rem)] overflow-auto whitespace-pre-wrap rounded-lg bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-300">{selected.definition || "No fields defined."}</pre>
        </>}
      </aside>
    </main>
  );
}
