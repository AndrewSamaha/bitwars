"use client";

import { ENTITY_CONTENT } from "@bitwars/content";
import YamlEditor from "@/features/content/components/YamlEditor";
import { Pencil } from "lucide-react";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  type Simulation,
  type SimulationNodeDatum,
} from "d3-force";
import { useEffect, useMemo, useRef, useState } from "react";

type Entity = { id: string; builds: readonly string[]; definition: string };
type Point = { x: number; y: number };
type GraphNode = SimulationNodeDatum & { id: string; entity: Entity };
type GraphLink = { source: string; target: string };

const INITIAL_ENTITIES: Entity[] = ENTITY_CONTENT.map((entity) => ({ ...entity }));
const DEFAULT_ZOOM = 0.85;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.4;
const ENTITY_FIELDS = [...new Set(INITIAL_ENTITIES.flatMap((entity) =>
  [...entity.definition.matchAll(/^([a-z_]+):/gm)].map((match) => match[1]),
))];

function linksFor(entities: readonly Entity[]): GraphLink[] {
  return entities.flatMap((entity) =>
  entity.builds.map((target) => ({ source: entity.id, target })),
  );
}

function initialPositions(entities: readonly Entity[]): Record<string, Point> {
  return Object.fromEntries(entities.map((entity, index) => [entity.id, {
    x: 120 + (index % 6) * 140,
    y: 100 + Math.floor(index / 6) * 150,
  }]));
}

function addBuild(definition: string, childId: string) {
  const buildBlock = /^builds:\n(?:(?: {2,}.*|\s*)\n)*/m;
  if (!buildBlock.test(definition)) return `${definition.trimEnd()}\nbuilds:\n  - entity_type_id: ${childId}\n`;
  return definition.replace(buildBlock, (block) => `${block.trimEnd()}\n  - entity_type_id: ${childId}\n`);
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
  const [entities, setEntities] = useState<Entity[]>(INITIAL_ENTITIES);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_ENTITIES[0]?.id ?? "");
  const [positions, setPositions] = useState<Record<string, Point>>(() => initialPositions(INITIAL_ENTITIES));
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [assetVersion, setAssetVersion] = useState(0);
  const [draftDefinition, setDraftDefinition] = useState<string | null>(null);
  const [draftName, setDraftName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const graphRef = useRef<HTMLDivElement>(null);
  const assetInputRef = useRef<HTMLInputElement>(null);
  const simulationRef = useRef<Simulation<GraphNode, undefined> | null>(null);
  const layoutSizeRef = useRef<Point | null>(null);
  const links = useMemo(() => linksFor(entities), [entities]);
  const linkIds = useMemo(() => new Set(links.map(({ source, target }) => `${source}:${target}`)), [links]);
  const selected = entities.find((entity) => entity.id === selectedId) ?? entities[0];

  useEffect(() => {
    fetch("/api/content/entities").then((response) => response.ok ? response.json() : null).then((data) => {
      if (data?.entities?.length) setEntities(data.entities);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const graph = graphRef.current;
    const simulation = simulationRef.current;
    const previousSize = layoutSizeRef.current;
    if (!graph || !simulation || !previousSize) return;

    const width = Math.max(graph.clientWidth, 832) / zoom;
    const height = graph.clientHeight / zoom;
    const dx = (width - previousSize.x) / 2;
    const dy = (height - previousSize.y) / 2;
    const nodes = simulation.nodes();
    for (const node of nodes) {
      node.x = (node.x ?? previousSize.x / 2) + dx;
      node.y = (node.y ?? previousSize.y / 2) + dy;
      if (node.fx !== null && node.fx !== undefined) node.fx += dx;
      if (node.fy !== null && node.fy !== undefined) node.fy += dy;
    }
    simulation.force("center", forceCenter(width / 2, height / 2));
    layoutSizeRef.current = { x: width, y: height };
    setPositions(Object.fromEntries(nodes.map((node) => [node.id, {
      x: Math.min(width - 64, Math.max(64, node.x ?? 64)),
      y: Math.min(height - 64, Math.max(64, node.y ?? 64)),
    }])));
  }, [zoom]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom((current) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current * Math.exp(-event.deltaY * 0.001))));
    };
    graph.addEventListener("wheel", onWheel, { passive: false });
    return () => graph.removeEventListener("wheel", onWheel);
  }, []);

  async function savingFetch(input: RequestInfo | URL, init?: RequestInit) {
    setSaving(true);
    try { return await fetch(input, init); } finally { setSaving(false); }
  }

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;

    let simulation: Simulation<GraphNode, undefined> | null = null;
    const layout = () => {
      simulation?.stop();
      const width = Math.max(graph.clientWidth, 832) / zoom;
      const height = graph.clientHeight / zoom;
      layoutSizeRef.current = { x: width, y: height };
      const nodes: GraphNode[] = entities.map((entity, index) => ({
        id: entity.id,
        entity,
        x: width / 2 + (index % 4 - 1.5) * 120,
        y: height / 2 + (Math.floor(index / 4) - 1) * 120,
      }));
      simulation = forceSimulation(nodes)
        .force("link", forceLink<GraphNode, GraphLink>(links.map((link) => ({ ...link }))).id((node) => node.id).distance(155).strength(0.9))
        .force("charge", forceManyBody().strength(-520))
        .force("collide", forceCollide<GraphNode>(72))
        .force("builder-outward", builderOutwardForce(links))
        .force("center", forceCenter(width / 2, height / 2));
      simulationRef.current = simulation;
      simulation.on("tick", () => setPositions(Object.fromEntries(nodes.map((node) => [node.id, {
        x: Math.min((layoutSizeRef.current?.x ?? width) - 64, Math.max(64, node.x ?? 64)),
        y: Math.min((layoutSizeRef.current?.y ?? height) - 64, Math.max(64, node.y ?? 64)),
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
  }, [entities, links]);

  async function createChild(parentId: string) {
    const parent = entities.find((entity) => entity.id === parentId);
    if (!parent) return;
    let childId = `${parent.id}_child`;
    for (let index = 2; entities.some((entity) => entity.id === childId); index += 1) childId = `${parent.id}_child_${index}`;
    const presentFields = new Set([...parent.definition.matchAll(/^([a-z_]+):/gm)].map((match) => match[1]));
    const definition = `${parent.definition.trimEnd()}\n${ENTITY_FIELDS.filter((field) => !presentFields.has(field)).map((field) => `${field}: null`).join("\n")}`.trim();
    const response = await savingFetch("/api/content/entities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ parentId, childId, definition }) });
    if (!response.ok) return;
    setEntities((current) => current.flatMap((entity) => entity.id === parentId
      ? [{ ...entity, builds: [...entity.builds, childId], definition: addBuild(entity.definition, childId) }, { id: childId, builds: [...parent.builds], definition }]
      : [entity]));
    setSelectedId(childId);
    setMenu(null);
  }

  function moveNode(id: string, event: React.PointerEvent<HTMLButtonElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const bounds = graphRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const node = simulationRef.current?.nodes().find((candidate) => candidate.id === id);
    if (!node) return;
    node.fx = (event.clientX - bounds.left) / zoom;
    node.fy = (event.clientY - bounds.top) / zoom;
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

  async function uploadAsset(file: File) {
    if (!selected) return;
    const body = new FormData();
    body.set("file", file);
    const response = await savingFetch(`/api/content/entities/${selected.id}/asset`, { method: "POST", body });
    if (response.ok) setAssetVersion(Date.now());
  }

  async function saveDraft() {
    if (!selected || (draftDefinition === null && draftName === null)) return;
    const definition = draftDefinition ?? selected.definition;
    const newId = draftName ?? selected.id;
    const response = await savingFetch(`/api/content/entities/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ definition, newId }) });
    if (!response.ok) return;
    setEntities((current) => current.map((entity) => ({ ...entity, id: entity.id === selected.id ? newId : entity.id, builds: entity.builds.map((id) => id === selected.id ? newId : id), definition: entity.id === selected.id ? definition : entity.definition })));
    setSelectedId(newId);
    setDraftDefinition(null);
    setDraftName(null);
  }

  return (
    <main className="flex min-h-screen bg-slate-950 text-slate-100">
      {saving && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80 backdrop-blur-sm">
        <div className="rounded-lg border border-cyan-400/40 bg-slate-900 px-5 py-3 text-sm text-cyan-300">Saving…</div>
      </div>}
      <section className="min-w-0 flex-1 p-6 lg:p-10">
        <header className="mb-8">
          <p className="text-sm font-medium tracking-[0.24em] text-cyan-400 uppercase">BitWars content</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Entity build graph</h1>
          <p className="mt-2 text-slate-400">Drag sprites to arrange the force graph. Scroll to zoom. Arrows show build relationships.</p>
        </header>

        <div className="overflow-auto rounded-xl border border-slate-700 bg-slate-900/60 p-6 shadow-2xl shadow-black/20">
          <div ref={graphRef} className="relative h-[42rem] min-w-[52rem] overflow-hidden rounded-lg bg-slate-950/50">
            <div className="absolute top-0 left-0" style={{ width: `${100 / zoom}%`, height: `${100 / zoom}%`, transform: `scale(${zoom})`, transformOrigin: "top left" }}>
            <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible">
              <defs>
                <marker id="build-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#22d3ee" />
                </marker>
                <marker id="reverse-build-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#c084fc" />
                </marker>
              </defs>
              {links.map(({ source, target }) => {
                const from = positions[source];
                const to = positions[target];
                if (!from || !to) return null;
                const reciprocal = linkIds.has(`${target}:${source}`);
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
            {entities.map((entity) => {
              const position = positions[entity.id];
              return (
                <button
                  className={`absolute flex min-h-28 w-24 -translate-x-1/2 -translate-y-1/2 touch-none flex-col items-center justify-center rounded-xl border bg-transparent p-2 text-center transition ${selectedId === entity.id ? "border-cyan-300 ring-2 ring-cyan-400/40" : "border-slate-700 hover:border-cyan-500"}`}
                  key={entity.id}
                  onClick={() => { setSelectedId(entity.id); setDraftDefinition(null); setDraftName(null); }}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    const bounds = graphRef.current?.getBoundingClientRect();
                    if (!bounds) return;
                    setMenu({
                      id: entity.id,
                      x: (event.clientX - bounds.left) / zoom,
                      y: (event.clientY - bounds.top) / zoom,
                    });
                  }}
                  onPointerDown={(event) => {
                    event.currentTarget.setPointerCapture(event.pointerId);
                    moveNode(entity.id, event);
                  }}
                  onPointerMove={(event) => moveNode(entity.id, event)}
                  onPointerUp={(event) => releaseNode(entity.id, event)}
                  style={{ left: position?.x, top: position?.y }}
                  type="button"
                >
                  <img alt="" className="pointer-events-none mb-1 size-12 select-none object-contain" draggable={false} onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} src={`/assets/${entity.id}/idle.png?v=${assetVersion}`} />
                  <span className="pointer-events-none text-sm font-medium">{entity.id}</span>
                  <span className="pointer-events-none mt-1 text-xs text-slate-400">{entity.builds.length ? `Builds ${entity.builds.length}` : "No builds"}</span>
                </button>
              );
            })}
            {menu && <div className="absolute z-20 w-36 rounded-md border border-slate-600 bg-slate-900 p-1 shadow-xl" style={{ left: menu.x, top: menu.y }}>
              <button className="w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-800" onClick={() => createChild(menu.id)} type="button">Create child</button>
            </div>}
            </div>
          </div>
        </div>
      </section>

      <aside className="w-[42rem] shrink-0 border-l border-slate-700 bg-slate-900 p-6">
        {selected && <>
          <div className="flex items-center gap-3 border-b border-slate-700 pb-5">
            <button className="relative" onClick={() => assetInputRef.current?.click()} type="button">
              <img alt="" className="size-14 object-contain" src={`/assets/${selected.id}/idle.png?v=${assetVersion}`} />
              <Pencil className="absolute -right-1 -bottom-1 size-5 rounded-full bg-cyan-400 p-1 text-slate-950" />
            </button>
            <input accept="image/png" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadAsset(file); event.target.value = ""; }} ref={assetInputRef} type="file" />
            <div><p className="text-sm text-slate-400">Entity definition</p><input className="w-full bg-transparent text-xl font-semibold outline-none" onChange={(event) => setDraftName(event.target.value)} value={draftName ?? selected.id} /></div>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-300">Fields</p>
            {(draftDefinition !== null && draftDefinition !== selected.definition || draftName !== null && draftName !== selected.id) && <div className="flex gap-2">
              <button className="rounded bg-cyan-400 px-3 py-1 text-sm font-medium text-slate-950" onClick={saveDraft} type="button">Save</button>
              <button className="rounded border border-slate-600 px-3 py-1 text-sm" onClick={() => { setDraftDefinition(null); setDraftName(null); }} type="button">Cancel</button>
            </div>}
          </div>
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-700">
            <YamlEditor id={selected.id} onChange={setDraftDefinition} value={draftDefinition ?? selected.definition} />
          </div>
        </>}
      </aside>
    </main>
  );
}
