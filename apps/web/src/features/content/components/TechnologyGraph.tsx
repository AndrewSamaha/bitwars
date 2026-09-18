"use client";

import YamlEditor from "@/features/content/components/YamlEditor";
import { forceCenter, forceCollide, forceLink, forceManyBody, forceSimulation, type SimulationNodeDatum } from "d3-force";
import { useEffect, useMemo, useRef, useState } from "react";
import { parseDocument } from "yaml";

type Requirement = string | { all?: Requirement[]; any?: Requirement[] };
type Technology = { id: string; requires?: Requirement; definition: string };
type Node = SimulationNodeDatum & { id: string };
type Link = { source: string; target: string; kind: "all" | "any" };
const WIDTH = 1600;
const HEIGHT = 1000;
const DEFAULT_ZOOM = .85;
const MIN_ZOOM = .5;
const MAX_ZOOM = 1.4;

function requirementLinks(requires: Requirement | undefined, target: string, kind: Link["kind"] = "all"): Link[] {
  if (!requires) return [];
  if (typeof requires === "string") return [{ source: requires, target, kind }];
  return (["all", "any"] as const).flatMap((key) => requires[key]?.flatMap((item) => requirementLinks(item, target, key)) ?? []);
}

export default function TechnologyGraph({ activeTab, onTabChange }: { activeTab: "entities" | "techtree"; onTabChange: (tab: "entities" | "techtree") => void }) {
  const [technologies, setTechnologies] = useState<Technology[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draftDefinition, setDraftDefinition] = useState<string | null>(null);
  const [draftName, setDraftName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [menu, setMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const graphRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<ReturnType<typeof forceSimulation<Node>> | null>(null);
  const links = useMemo(() => technologies.flatMap((technology) => requirementLinks(technology.requires, technology.id)), [technologies]);
  const selected = technologies.find((technology) => technology.id === selectedId) ?? technologies[0];

  useEffect(() => {
    fetch("/api/content/technologies").then((response) => response.ok ? response.json() : null).then((data) => {
      if (!data?.technologies) return;
      setTechnologies(data.technologies);
      setSelectedId(data.technologies[0]?.id ?? "");
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom((current) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current * Math.exp(-event.deltaY * .001))));
    };
    graph.addEventListener("wheel", onWheel, { passive: false });
    return () => graph.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const nodes: Node[] = technologies.map((technology, index) => ({ id: technology.id, x: WIDTH / 2 + (index % 5 - 2) * 150, y: HEIGHT / 2 + (Math.floor(index / 5) - 1) * 150 }));
    const simulation = forceSimulation(nodes)
      .force("link", forceLink<Node, Link>(links.map((link) => ({ ...link }))).id((node) => node.id).distance(180).strength(.9))
      .force("charge", forceManyBody().strength(-600))
      .force("collide", forceCollide<Node>(78))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2));
    simulationRef.current = simulation;
    simulation.on("tick", () => setPositions(Object.fromEntries(nodes.map((node) => [node.id, { x: Math.min(WIDTH - 70, Math.max(70, node.x ?? 70)), y: Math.min(HEIGHT - 45, Math.max(45, node.y ?? 45)) }]))));
    return () => { simulation.stop(); simulationRef.current = null; };
  }, [technologies, links]);

  async function request(input: RequestInfo | URL, init?: RequestInit) {
    setSaving(true);
    try { return await fetch(input, init); } finally { setSaving(false); }
  }

  async function createChild(parentId: string) {
    let childId = `${parentId}_child`;
    for (let index = 2; technologies.some((technology) => technology.id === childId); index += 1) childId = `${parentId}_child_${index}`;
    const definition = `display_name: ${childId}`;
    const response = await request("/api/content/technologies", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ parentId, childId, definition }) });
    if (!response.ok) return;
    setTechnologies((current) => [...current, { id: childId, requires: parentId, definition: `${definition}\nrequires: ${parentId}` }]);
    setSelectedId(childId);
    setMenu(null);
  }

  async function saveDraft() {
    if (!selected || (draftDefinition === null && draftName === null)) return;
    const definition = draftDefinition ?? selected.definition;
    const newId = draftName ?? selected.id;
    const response = await request(`/api/content/technologies/${selected.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ definition, newId }) });
    if (!response.ok) { setSaveError((await response.json().catch(() => null))?.error ?? "Unable to save this technology."); return; }
    setTechnologies((current) => current.map((technology) => technology.id === selected.id ? { ...technology, id: newId, definition } : { ...technology, requires: replaceRequirement(technology.requires, selected.id, newId) }));
    setSelectedId(newId); setDraftDefinition(null); setDraftName(null); setSaveError(null);
  }

  function moveNode(id: string, event: React.PointerEvent<HTMLButtonElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const bounds = graphRef.current?.getBoundingClientRect();
    const node = simulationRef.current?.nodes().find((candidate) => candidate.id === id);
    if (!bounds || !node) return;
    node.fx = (event.clientX - bounds.left + graphRef.current!.scrollLeft) / zoom;
    node.fy = (event.clientY - bounds.top + graphRef.current!.scrollTop) / zoom;
    simulationRef.current?.alphaTarget(.25).restart();
  }

  return <main className="flex min-h-screen bg-slate-950 text-slate-100">
    {saving && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/80"><div className="rounded-lg border border-cyan-400/40 bg-slate-900 px-5 py-3 text-sm text-cyan-300">Saving…</div></div>}
    <section className="min-w-0 flex-1 p-6 lg:p-10">
      <header className="mb-8"><p className="text-sm font-medium tracking-[0.24em] text-cyan-400 uppercase">BitWars Content Editor</p></header>
      <nav aria-label="Content type" className="mb-3 flex gap-1 border-b border-slate-700"><button className="px-4 py-2 text-sm font-medium text-slate-400" onClick={() => onTabChange("entities")} type="button">Entities</button><button className="border-b-2 border-cyan-400 px-4 py-2 text-sm font-medium text-cyan-300" onClick={() => onTabChange("techtree")} type="button">Techtree</button></nav>
      <div className="overflow-auto rounded-xl border border-slate-700 bg-slate-900/60 p-6"><div ref={graphRef} className="relative h-[42rem] min-w-[52rem] overflow-auto rounded-lg bg-slate-950/50"><div style={{ width: WIDTH * zoom, height: HEIGHT * zoom }}><div className="relative" style={{ width: WIDTH, height: HEIGHT, transform: `scale(${zoom})`, transformOrigin: "top left" }}>
        <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full"><defs><marker id="tech-all-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#22d3ee" /></marker><marker id="tech-any-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill="#fbbf24" /></marker></defs>{links.map((link, index) => { const from = positions[link.source]; const to = positions[link.target]; return from && to && <path d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`} fill="none" key={`${link.source}-${link.target}-${index}`} markerEnd={`url(#tech-${link.kind}-arrow)`} stroke={link.kind === "all" ? "#22d3ee" : "#fbbf24"} strokeDasharray={link.kind === "any" ? "5 3" : undefined} strokeWidth="2" />; })}</svg>
        {technologies.map((technology) => <button className={`absolute min-h-20 w-36 -translate-x-1/2 -translate-y-1/2 rounded-xl border p-3 text-center text-sm transition ${selected?.id === technology.id ? "border-cyan-300 ring-2 ring-cyan-400/40" : "border-slate-700 hover:border-cyan-500"}`} key={technology.id} onClick={() => { setSelectedId(technology.id); setDraftDefinition(null); setDraftName(null); setSaveError(null); }} onContextMenu={(event) => { event.preventDefault(); const bounds = graphRef.current?.getBoundingClientRect(); if (bounds) setMenu({ id: technology.id, x: (event.clientX - bounds.left + graphRef.current!.scrollLeft) / zoom, y: (event.clientY - bounds.top + graphRef.current!.scrollTop) / zoom }); }} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); moveNode(technology.id, event); }} onPointerMove={(event) => moveNode(technology.id, event)} onPointerUp={(event) => { event.currentTarget.releasePointerCapture(event.pointerId); const node = simulationRef.current?.nodes().find((candidate) => candidate.id === technology.id); if (node) { node.fx = null; node.fy = null; } simulationRef.current?.alphaTarget(0); }} style={{ left: positions[technology.id]?.x, top: positions[technology.id]?.y }} type="button">{displayName(technology)}</button>)}
        {menu && <div className="absolute z-20 w-36 rounded-md border border-slate-600 bg-slate-900 p-1 shadow-xl" style={{ left: menu.x, top: menu.y }}><button className="w-full rounded px-3 py-2 text-left text-sm hover:bg-slate-800" onClick={() => createChild(menu.id)} type="button">Create child</button></div>}
      </div></div></div></div>
      <p className="mt-2 text-slate-400">Drag technologies to arrange the graph. Cyan arrows are all-of prerequisites; amber dashed arrows are any-of prerequisites.</p>
    </section>
    <aside className="w-[42rem] shrink-0 border-l border-slate-700 bg-slate-900 p-6">{selected && <><div className="border-b border-slate-700 pb-5"><p className="text-sm text-slate-400">Technology definition</p><input className="w-full bg-transparent text-xl font-semibold outline-none" onChange={(event) => setDraftName(event.target.value)} value={draftName ?? selected.id} /></div><div className="mt-5 flex items-center justify-between"><p className="text-sm font-medium text-slate-300">Fields</p>{(draftDefinition !== null && draftDefinition !== selected.definition || draftName !== null && draftName !== selected.id) && <div className="flex gap-2"><button className="rounded bg-cyan-400 px-3 py-1 text-sm font-medium text-slate-950" onClick={saveDraft} type="button">Save</button><button className="rounded border border-slate-600 px-3 py-1 text-sm" onClick={() => { setDraftDefinition(null); setDraftName(null); setSaveError(null); }} type="button">Cancel</button></div>}</div>{saveError && <p className="mt-2 text-sm text-red-400" role="alert">{saveError}</p>}<div className="mt-3 overflow-hidden rounded-lg border border-slate-700"><YamlEditor id={selected.id} kind="technology" onChange={setDraftDefinition} value={draftDefinition ?? selected.definition} /></div></>}</aside>
  </main>;
}

function replaceRequirement(requirement: Requirement | undefined, oldId: string, newId: string): Requirement | undefined {
  if (!requirement) return requirement;
  if (typeof requirement === "string") return requirement === oldId ? newId : requirement;
  return { ...(requirement.all && { all: requirement.all.map((item) => replaceRequirement(item, oldId, newId)!) }), ...(requirement.any && { any: requirement.any.map((item) => replaceRequirement(item, oldId, newId)!) }) };
}

function displayName(technology: Technology) {
  const document = parseDocument(technology.definition).toJS() as { display_name?: string };
  return document.display_name ?? technology.id;
}
