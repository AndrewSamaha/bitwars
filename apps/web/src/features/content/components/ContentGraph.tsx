"use client";

import { ENTITY_CONTENT } from "@bitwars/content";
import YamlEditor from "@/features/content/components/YamlEditor";
import { entityCombatRangeWarnings, unknownEntityFieldErrors } from "@/lib/content/schemaValidation";
import { gameScreenEntityScale } from "@/features/pixijs/renderer/entityScale";
import { Pencil } from "lucide-react";
import Link from "next/link";
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
import { parseDocument } from "yaml";

type Entity = {
  id: string;
  builds: readonly string[];
  upgrades: readonly string[];
  visual?: { scale?: number; rotate_deg?: number };
  definition: string;
};
type Point = { x: number; y: number };
type SpriteSize = { width: number; height: number };
type GraphNode = SimulationNodeDatum & { id: string; entity: Entity };
type GraphLink = { source: string; target: string; kind: "build" | "upgrade" };
type DiagnosticStatus = "error" | "warning" | null;

const INITIAL_ENTITIES: Entity[] = ENTITY_CONTENT.map((entity) => ({ ...entity }));
const DEFAULT_ZOOM = 0.85;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.4;
const GRAPH_WIDTH = 1600;
const GRAPH_HEIGHT = 1000;
const ENTITY_FIELDS = [...new Set(INITIAL_ENTITIES.flatMap((entity) =>
  [...entity.definition.matchAll(/^([a-z_]+):/gm)].map((match) => match[1]),
))];

function linksFor(entities: readonly Entity[]): GraphLink[] {
  return entities.flatMap((entity) => [
    ...entity.builds.map((target) => ({ source: entity.id, target, kind: "build" as const })),
    ...entity.upgrades.map((target) => ({ source: entity.id, target, kind: "upgrade" as const })),
  ]);
}

function addBuild(definition: string, childId: string) {
  const buildBlock = /^builds:\n(?:(?: {2,}.*|\s*)\n)*/m;
  if (!buildBlock.test(definition)) return `${definition.trimEnd()}\nbuilds:\n  - entity_type_id: ${childId}\n`;
  return definition.replace(buildBlock, (block) => `${block.trimEnd()}\n  - entity_type_id: ${childId}\n`);
}

function visualRotateDeg(definition: string, fallback = 0): number {
  const visualBlock = definition.match(/^visual:\n(?:(?: {2,}.*|\s*)\n)*/m)?.[0] ?? "";
  const value = Number(visualBlock.match(/^\s*rotate_deg:\s*([^\s#]+)/m)?.[1]);
  return Number.isFinite(value) ? value : fallback;
}

function visualScale(definition: string, fallback = 1): number {
  const visualBlock = definition.match(/^visual:\n(?:(?: {2,}.*|\s*)\n)*/m)?.[0] ?? "";
  const value = Number(visualBlock.match(/^\s*scale:\s*([^\s#]+)/m)?.[1]);
  return Number.isFinite(value) ? value : fallback;
}

function loadSpriteSize(src: string): Promise<SpriteSize> {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    image.onerror = () => resolve({ width: 48, height: 48 });
    image.src = src;
  });
}

async function loadSpriteSizes(entities: readonly Entity[]) {
  return Object.fromEntries(await Promise.all(entities.map(async (entity) => [entity.id, await loadSpriteSize(`/assets/${entity.id}/idle.png`)] as const)));
}

function diagnosticStatus(definition: string): DiagnosticStatus {
  const document = parseDocument(definition);
  if (document.errors.length) return "error";
  const entity = document.toJS();
  if (unknownEntityFieldErrors(entity).length) return "error";
  return entityCombatRangeWarnings(entity).length ? "warning" : null;
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
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedId, setSelectedId] = useState<string>(INITIAL_ENTITIES[0]?.id ?? "");
  const [positions, setPositions] = useState<Record<string, Point>>({});
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [assetVersion, setAssetVersion] = useState(0);
  const [draftDefinition, setDraftDefinition] = useState<string | null>(null);
  const [draftName, setDraftName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [drawToScale, setDrawToScale] = useState(false);
  const [drawToScaleReady, setDrawToScaleReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [spriteSizes, setSpriteSizes] = useState<Record<string, SpriteSize>>({});
  const graphRef = useRef<HTMLDivElement>(null);
  const assetInputRef = useRef<HTMLInputElement>(null);
  const simulationRef = useRef<Simulation<GraphNode, undefined> | null>(null);
  const layoutSizeRef = useRef<Point | null>(null);
  const links = useMemo(() => linksFor(entities), [entities]);
  const directionalLinks = useMemo(
    () => new Map(links.map(({ source, target }) => [`${source}:${target}`, true])),
    [links],
  );
  const parallelLinks = useMemo(
    () => new Set(
      links
        .map(({ source, target }) => `${source}:${target}`)
        .filter((key, index, values) => values.indexOf(key) !== index),
    ),
    [links],
  );
  const selected = entities.find((entity) => entity.id === selectedId) ?? entities[0];
  const diagnosticStatusByEntity = useMemo(() => new Map(entities.map((entity) => [
    entity.id,
    diagnosticStatus(entity.id === selectedId && draftDefinition !== null ? draftDefinition : entity.definition),
  ])), [entities, selectedId, draftDefinition]);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/content/entities", { signal: controller.signal });
        const data = response.ok ? await response.json() : null;
        const loadedEntities = data?.entities?.length ? data.entities : INITIAL_ENTITIES;
        const sizes = await loadSpriteSizes(loadedEntities);
        if (controller.signal.aborted) return;
        setSpriteSizes(sizes);
        setEntities(loadedEntities);
        setLoading(false);
      } catch {
        if (controller.signal.aborted) return;
        const sizes = await loadSpriteSizes(INITIAL_ENTITIES);
        if (controller.signal.aborted) return;
        setSpriteSizes(sizes);
        setEntities(INITIAL_ENTITIES);
        setLoading(false);
      }
    })();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    setDrawToScale(new URLSearchParams(window.location.search).get("drawToScale") === "1");
    setDrawToScaleReady(true);
  }, []);

  function updateDrawToScale(enabled: boolean) {
    setDrawToScale(enabled);
    const url = new URL(window.location.href);
    url.searchParams.set("drawToScale", enabled ? "1" : "0");
    window.history.replaceState(null, "", url);
  }

  function scaledSpriteSize(entity: Entity, definition = entity.definition): SpriteSize {
    const source = spriteSizes[entity.id] ?? { width: 48, height: 48 };
    const scale = gameScreenEntityScale(1, visualScale(definition, entity.visual?.scale ?? 1));
    return { width: source.width * scale, height: source.height * scale };
  }

  function nodeRadius(entity: Entity) {
    if (!drawToScale) return 72;
    const sprite = scaledSpriteSize(entity);
    return Math.max(72, Math.hypot(sprite.width, sprite.height) / 2 + 12);
  }

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
    if (loading || !drawToScaleReady) return;
    let simulation: Simulation<GraphNode, undefined> | null = null;
    const layout = () => {
      simulation?.stop();
      layoutSizeRef.current = { x: GRAPH_WIDTH, y: GRAPH_HEIGHT };
      const nodes: GraphNode[] = entities.map((entity, index) => ({
        id: entity.id,
        entity,
        x: GRAPH_WIDTH / 2 + (index % 4 - 1.5) * 120,
        y: GRAPH_HEIGHT / 2 + (Math.floor(index / 4) - 1) * 120,
      }));
      simulation = forceSimulation(nodes)
        .force("link", forceLink<GraphNode, GraphLink>(links.map((link) => ({ ...link }))).id((node) => node.id).distance(155).strength(0.9))
        .force("charge", forceManyBody().strength(-520))
        .force("collide", forceCollide<GraphNode>((node) => nodeRadius(node.entity)))
        .force("builder-outward", builderOutwardForce(links))
        .force("center", forceCenter(GRAPH_WIDTH / 2, GRAPH_HEIGHT / 2));
      simulationRef.current = simulation;
      simulation.on("tick", () => setPositions(Object.fromEntries(nodes.map((node) => [node.id, {
        x: Math.min((layoutSizeRef.current?.x ?? GRAPH_WIDTH) - nodeRadius(node.entity), Math.max(nodeRadius(node.entity), node.x ?? nodeRadius(node.entity))),
        y: Math.min((layoutSizeRef.current?.y ?? GRAPH_HEIGHT) - nodeRadius(node.entity), Math.max(nodeRadius(node.entity), node.y ?? nodeRadius(node.entity))),
      }]))));
    };

    layout();
    return () => {
      simulation?.stop();
      simulationRef.current = null;
    };
  }, [drawToScale, drawToScaleReady, entities, links, loading, spriteSizes]);

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
      ? [{ ...entity, builds: [...entity.builds, childId], definition: addBuild(entity.definition, childId) }, { id: childId, builds: [...parent.builds], upgrades: [...parent.upgrades], definition }]
      : [entity]));
    setSelectedId(childId);
    setMenu(null);
  }

  function moveNode(id: string, event: React.PointerEvent<HTMLButtonElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const graph = graphRef.current;
    if (!graph) return;
    const bounds = graph.getBoundingClientRect();
    const node = simulationRef.current?.nodes().find((candidate) => candidate.id === id);
    if (!node) return;
    node.fx = (event.clientX - bounds.left + graph.scrollLeft) / zoom;
    node.fy = (event.clientY - bounds.top + graph.scrollTop) / zoom;
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
    if (response.ok) {
      const src = URL.createObjectURL(file);
      const size = await loadSpriteSize(src);
      URL.revokeObjectURL(src);
      setSpriteSizes((current) => ({ ...current, [selected.id]: size }));
      setAssetVersion(Date.now());
    }
  }

  async function saveDraft() {
    if (!selected || (draftDefinition === null && draftName === null)) return;
    const definition = draftDefinition ?? selected.definition;
    const newId = draftName ?? selected.id;
    const response = await savingFetch(`/api/content/entities/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ definition, newId }) });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      setSaveError(body?.error ?? "Unable to save this entity definition.");
      return;
    }
    setSaveError(null);
    setEntities((current) => current.map((entity) => ({
      ...entity,
      id: entity.id === selected.id ? newId : entity.id,
      builds: entity.builds.map((id) => id === selected.id ? newId : id),
      upgrades: entity.upgrades.map((id) => id === selected.id ? newId : id),
      definition: entity.id === selected.id ? definition : entity.definition,
    })));
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
          <p className="text-sm font-medium tracking-[0.24em] text-cyan-400 uppercase">BitWars Content Editor</p>
        </header>

        <nav aria-label="Content type" className="mb-3 flex gap-1 border-b border-slate-700">
          <Link className="border-b-2 border-cyan-400 px-4 py-2 text-sm font-medium text-cyan-300" href="/content/entities">Entities</Link>
          <Link className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-cyan-300" href="/content/techtree">Techtree</Link>
          <Link className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-cyan-300" href="/content/sprites">Sprites</Link>
        </nav>
        <div className="overflow-auto rounded-xl border border-slate-700 bg-slate-900/60 p-6 shadow-2xl shadow-black/20">
          <div ref={graphRef} className="relative h-[42rem] min-w-[52rem] overflow-auto rounded-lg bg-slate-950/50">
            {loading ? <div aria-label="Loading entities" className="grid h-full grid-cols-4 gap-12 p-12" role="status">
              {Array.from({ length: 12 }, (_, index) => <div className="h-28 animate-pulse rounded-xl border border-slate-800 bg-slate-900/60" key={index} />)}
            </div> : <>
            <div style={{ width: GRAPH_WIDTH * zoom, height: GRAPH_HEIGHT * zoom }}>
            <div className="relative" style={{ width: GRAPH_WIDTH, height: GRAPH_HEIGHT, transform: `scale(${zoom})`, transformOrigin: "top left" }}>
            <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full overflow-visible">
              <defs>
                <marker id="build-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#22d3ee" />
                </marker>
                <marker id="reverse-build-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#c084fc" />
                </marker>
                <marker id="upgrade-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#fbbf24" />
                </marker>
              </defs>
              {links.map(({ source, target, kind }) => {
                const from = positions[source];
                const to = positions[target];
                if (!from || !to) return null;
                const reciprocal = directionalLinks.has(`${target}:${source}`);
                const reverse = reciprocal && source > target;
                const parallel = parallelLinks.has(`${source}:${target}`);
                const dx = to.x - from.x;
                const dy = to.y - from.y;
                const length = Math.hypot(dx, dy) || 1;
                // A reversed path already reverses its normal, so both sides
                // use the same signed bend to fan reciprocal arrows apart.
                const curve = reciprocal
                  ? 28
                  : parallel
                    ? (kind === "upgrade" ? 14 : -14)
                    : 0;
                const controlX = (from.x + to.x) / 2 - dy / length * curve;
                const controlY = (from.y + to.y) / 2 + dx / length * curve;
                const isUpgrade = kind === "upgrade";
                return <path d={`M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`} fill="none" key={`${kind}-${source}-${target}`} markerEnd={`url(#${isUpgrade ? "upgrade-arrow" : reverse ? "reverse-build-arrow" : "build-arrow"})`} stroke={isUpgrade ? "#fbbf24" : reverse ? "#c084fc" : "#22d3ee"} strokeDasharray={isUpgrade ? "5 3" : undefined} strokeOpacity=".85" strokeWidth="2" />;
              })}
            </svg>
            {entities.map((entity) => {
              const position = positions[entity.id];
              const diagnosticStatus = diagnosticStatusByEntity.get(entity.id);
              const definition = entity.id === selectedId && draftDefinition !== null ? draftDefinition : entity.definition;
              const rotateDeg = visualRotateDeg(
                definition,
                entity.visual?.rotate_deg ?? 0,
              );
              const sprite = scaledSpriteSize(entity, definition);
              return (
                <button
                  className={`absolute flex min-h-28 w-24 -translate-x-1/2 -translate-y-1/2 touch-none flex-col items-center justify-center rounded-xl border bg-transparent p-2 text-center transition ${selectedId === entity.id ? "border-cyan-300 ring-2 ring-cyan-400/40" : "border-slate-700 hover:border-cyan-500"} ${diagnosticStatus === "error" ? "outline outline-2 outline-red-400" : diagnosticStatus === "warning" ? "outline outline-2 outline-yellow-400" : ""}`}
                  key={entity.id}
                  onClick={() => { setSelectedId(entity.id); setDraftDefinition(null); setDraftName(null); setSaveError(null); }}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    const bounds = graphRef.current?.getBoundingClientRect();
                    if (!bounds) return;
                    setMenu({
                      id: entity.id,
                      x: (event.clientX - bounds.left + graphRef.current!.scrollLeft) / zoom,
                      y: (event.clientY - bounds.top + graphRef.current!.scrollTop) / zoom,
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
                  <img alt="" className={`pointer-events-none select-none object-contain ${drawToScale ? "absolute left-1/2 top-1/2 max-w-none" : "mb-1 size-12"}`} draggable={false} onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} src={`/assets/${entity.id}/idle.png?v=${assetVersion}`} style={drawToScale ? { width: sprite.width, height: sprite.height, transform: `translate(-50%, -50%) rotate(${rotateDeg}deg)` } : { transform: `rotate(${rotateDeg}deg)` }} />
                  <span className="pointer-events-none text-sm font-medium">{entity.id}</span>
                  <span className="pointer-events-none mt-1 text-xs text-slate-400">
                    {entity.builds.length ? `Builds ${entity.builds.length}` : "No builds"}
                    {entity.upgrades.length ? ` · Upgrades ${entity.upgrades.length}` : ""}
                  </span>
                </button>
              );
            })}
            {menu && <div className="absolute z-20 w-36 rounded-md border border-slate-600 bg-slate-900 p-1 shadow-xl" style={{ left: menu.x, top: menu.y }}>
              <button className="w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-800" onClick={() => createChild(menu.id)} type="button">Create child</button>
            </div>}
            </div>
            </div>
            </>}
          </div>
        </div>
        <footer className="mb-8">
          <p className="mt-2 text-slate-400">Drag sprites to arrange the graph. Cyan arrows build new entities; amber arrows upgrade in place.</p>
          <label className="mt-3 flex w-fit items-center gap-2 text-sm text-slate-300">
            <input checked={drawToScale} onChange={(event) => updateDrawToScale(event.target.checked)} type="checkbox" />
            Draw to scale
          </label>
        </footer>


      </section>

      <aside className="w-[42rem] shrink-0 border-l border-slate-700 bg-slate-900 p-6">
        {selected && <>
          <div className="flex items-center gap-3 border-b border-slate-700 pb-5">
            <button className="relative" onClick={() => assetInputRef.current?.click()} type="button">
              <img alt="" className="size-14 object-contain" src={`/assets/${selected.id}/idle.png?v=${assetVersion}`} style={{ transform: `rotate(${visualRotateDeg(draftDefinition ?? selected.definition, selected.visual?.rotate_deg ?? 0)}deg)` }} />
              <Pencil className="absolute -right-1 -bottom-1 size-5 rounded-full bg-cyan-400 p-1 text-slate-950" />
            </button>
            <input accept="image/png" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) uploadAsset(file); event.target.value = ""; }} ref={assetInputRef} type="file" />
            <div><p className="text-sm text-slate-400">Entity definition</p><input className="w-full bg-transparent text-xl font-semibold outline-none" onChange={(event) => setDraftName(event.target.value)} value={draftName ?? selected.id} /></div>
          </div>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-300">Fields</p>
            {(draftDefinition !== null && draftDefinition !== selected.definition || draftName !== null && draftName !== selected.id) && <div className="flex gap-2">
              <button className="rounded bg-cyan-400 px-3 py-1 text-sm font-medium text-slate-950" onClick={saveDraft} type="button">Save</button>
              <button className="rounded border border-slate-600 px-3 py-1 text-sm" onClick={() => { setDraftDefinition(null); setDraftName(null); setSaveError(null); }} type="button">Cancel</button>
            </div>}
          </div>
          {saveError && <p className="mt-2 text-sm text-red-400" role="alert">{saveError}</p>}
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-700">
            <YamlEditor id={selected.id} onChange={setDraftDefinition} value={draftDefinition ?? selected.definition} />
          </div>
        </>}
      </aside>
    </main>
  );
}
