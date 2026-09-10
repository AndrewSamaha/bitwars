"use client";

import { ENTITY_CONTENT } from "@bitwars/content";
import { useLayoutEffect, useRef, useState } from "react";

type Entity = (typeof ENTITY_CONTENT)[number];
type Point = { x: number; y: number };

function groupByBuildDepth(entities: readonly Entity[]) {
  const builtIds = new Set<string>(entities.flatMap((entity) => entity.builds));
  const depth = new Map(entities.filter((entity) => !builtIds.has(entity.id)).map((entity) => [entity.id, 0]));

  // A production loop (worker ↔ habitat today) has no root. Seed its first
  // builder, then continue walking outward so its children retain their rows.
  while (depth.size < entities.length) {
    let changed = false;
    for (const entity of entities) {
      const entityDepth = depth.get(entity.id);
      if (entityDepth === undefined) continue;
      for (const targetId of entity.builds) {
        if (depth.has(targetId)) continue;
        depth.set(targetId, entityDepth + 1);
        changed = true;
      }
    }
    if (!changed) {
      const cycleRoot = entities.find((entity) => !depth.has(entity.id) && entity.builds.length > 0)
        ?? entities.find((entity) => !depth.has(entity.id));
      if (cycleRoot) depth.set(cycleRoot.id, Math.max(...depth.values(), -1) + 1);
    }
  }
  return Array.from({ length: Math.max(...depth.values()) + 1 }, (_, level) =>
    entities.filter((entity) => depth.get(entity.id) === level),
  );
}

const ENTITY_LEVELS = groupByBuildDepth(ENTITY_CONTENT);

export default function ContentGraph() {
  const [selectedId, setSelectedId] = useState<string>(ENTITY_CONTENT[0]?.id ?? "");
  const [points, setPoints] = useState<Record<string, Point>>({});
  const graphRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());
  const selected = ENTITY_CONTENT.find((entity) => entity.id === selectedId) ?? ENTITY_CONTENT[0];

  useLayoutEffect(() => {
    const measure = () => {
      const graph = graphRef.current;
      if (!graph) return;
      const bounds = graph.getBoundingClientRect();
      setPoints(Object.fromEntries([...nodeRefs.current].map(([id, node]) => {
        const rect = node.getBoundingClientRect();
        return [id, { x: rect.left - bounds.left + rect.width / 2, y: rect.top - bounds.top + rect.height / 2 }];
      })));
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (graphRef.current) observer.observe(graphRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="flex min-h-screen bg-slate-950 text-slate-100">
      <section className="min-w-0 flex-1 p-6 lg:p-10">
        <header className="mb-8">
          <p className="text-sm font-medium tracking-[0.24em] text-cyan-400 uppercase">BitWars content</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Entity build graph</h1>
          <p className="mt-2 text-slate-400">Arrows show which entity can build another entity.</p>
        </header>

        <div className="overflow-auto rounded-xl border border-slate-700 bg-slate-900/60 p-6 shadow-2xl shadow-black/20">
          <div ref={graphRef} className="relative min-w-[50rem] space-y-10 p-4">
            <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
              <defs>
                <marker id="build-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#22d3ee" />
                </marker>
              </defs>
              {ENTITY_CONTENT.flatMap((entity) => entity.builds.map((targetId) => {
                const from = points[entity.id];
                const to = points[targetId];
                if (!from || !to) return null;
                return <line key={`${entity.id}-${targetId}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#22d3ee" strokeOpacity=".55" strokeWidth="2" markerEnd="url(#build-arrow)" />;
              }))}
            </svg>
            {ENTITY_LEVELS.map((level, levelIndex) => (
              <div className="relative z-10 flex flex-wrap justify-center gap-6" key={levelIndex}>
                {level.map((entity) => (
              <button
                className={`flex min-h-28 w-24 flex-col items-center justify-center rounded-xl border p-2 text-center transition ${selectedId === entity.id ? "border-cyan-300 bg-cyan-400/15 ring-2 ring-cyan-400/40" : "border-slate-700 bg-slate-950 hover:border-cyan-500 hover:bg-slate-800"}`}
                key={entity.id}
                onClick={() => setSelectedId(entity.id)}
                ref={(node) => { if (node) nodeRefs.current.set(entity.id, node); else nodeRefs.current.delete(entity.id); }}
                type="button"
              >
                <img alt="" className="mb-1 size-12 object-contain" onError={(event) => { event.currentTarget.style.visibility = "hidden"; }} src={`/assets/${entity.id}/idle.png`} />
                <span className="text-sm font-medium">{entity.id}</span>
                <span className="mt-1 text-xs text-slate-400">{entity.builds.length ? `Builds ${entity.builds.length}` : "No builds"}</span>
              </button>
                ))}
              </div>
            ))}
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
