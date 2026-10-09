"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import YamlEditor from "./YamlEditor";

type ScenarioItem = { id: string; name: string; yaml: string; entity_count?: number; tags?: string[]; error?: string; captured_tick?: number };
type Runtime = { run_id: string; scenario_id: string | null; paused: boolean; tick: number; steps: number };
const example = "version: 1\nid: my-scenario\nname: My scenario\ntags: []\nplayers: [player]\ntechnologies: {}\nentities:\n  - id: 1\n    entity_type: habitat\n    owner: player\n    position: {x: 0, y: 0}\n    resources: {energy: 500, food: 500, minerals: 500}\n";
const button = "rounded border border-slate-600 px-3 py-2 text-sm hover:bg-slate-800 disabled:opacity-40";
const input = "w-full rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm";

export default function ScenarioEditor() {
  const [scenarios, setScenarios] = useState<ScenarioItem[]>([]);
  const [runtime, setRuntime] = useState<Runtime | null>(null);
  const [id, setId] = useState("my-scenario");
  const [yaml, setYaml] = useState(example);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [bindings, setBindings] = useState("{}");
  const [ticks, setTicks] = useState(1);
  const [bookmark, setBookmark] = useState("");
  const [tags, setTags] = useState("");
  const [scope, setScope] = useState("world");
  const [entityIds, setEntityIds] = useState("");
  const [centerX, setCenterX] = useState(0);
  const [centerY, setCenterY] = useState(0);
  const [radius, setRadius] = useState(4000);

  async function refresh() {
    const response = await fetch("/api/content/scenarios", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error ?? "Sign in to manage scenarios");
    setScenarios(data.scenarios); setRuntime(data.runtime);
  }
  useEffect(() => {
    let active = true;
    const poll = () => { if (active) void refresh().catch(error => { if (active) setError(String(error)); }); };
    poll(); const timer = window.setInterval(poll, 2000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  async function act(action: string) {
    setBusy(true); setError(""); setMessage("");
    try {
      const body: Record<string, unknown> = { action, run_id: runtime?.run_id };
      if (["save", "validate", "load"].includes(action)) { body.yaml = yaml; body.bindings = JSON.parse(bindings); }
      if (action === "step") body.ticks = ticks;
      if (action === "bookmark") {
        body.id = bookmark; body.tags = tags.split(",").map(tag => tag.trim()).filter(Boolean);
        if (scope === "entities") body.entity_ids = entityIds.split(",").map(value => Number(value.trim()));
        if (scope === "area") { body.center = { x: centerX, y: centerY }; body.radius = radius; }
      }
      const response = await fetch("/api/content/scenarios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      let data = await response.json();
      if (!response.ok && response.status !== 202) throw new Error(data.error ?? "Command failed");
      const deadline = Date.now() + 15_000;
      while (data.pending && Date.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, 250));
        const resultResponse = await fetch(`/api/content/scenarios?request_id=${encodeURIComponent(data.request_id)}`, { cache: "no-store" });
        const next = await resultResponse.json();
        if (!resultResponse.ok && resultResponse.status !== 202) throw new Error(next.error ?? "Could not read command result");
        data = { ...next, request_id: data.request_id };
      }
      if (data.pending) throw new Error(`Engine has not processed request ${data.request_id}. Check that it is running.`);
      if (data.ok === false) throw new Error(data.error);
      if (data.saved_id) setId(data.saved_id);
      if (data.result?.yaml) { setYaml(data.result.yaml); setId(data.result.saved_id ?? bookmark); }
      setMessage(action === "load" || action === "reload" ? "Scenario loaded paused. Resume or step to run it." : `${action} complete`);
      await refresh();
    } catch (error) { setError(String(error)); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
    <nav className="mb-4 flex flex-wrap border-b border-slate-700" aria-label="Content">
      {[ ["entities", "Entities"], ["techtree", "Techtree"], ["sprite-library", "Sprites"], ["sfx", "SFX"], ["scenarios", "Scenarios"], ["spawn", "Spawn"] ].map(([path, label]) => <Link className={`px-4 py-2 text-sm ${path === "scenarios" ? "border-b-2 border-cyan-400 text-cyan-300" : "text-slate-400"}`} href={`/content/${path}`} key={path}>{label}</Link>)}
    </nav>
    <h1 className="mb-2 text-xl font-semibold">Scenarios</h1>
    <p className="mb-4 text-sm text-slate-400">Loading replaces the shared game world for everyone. Player slots bind to your account; extra slots require UUID bindings below.</p>
    <p className="mb-3 text-sm">{runtime ? `${runtime.scenario_id ?? "Normal game"} · ${runtime.paused ? "Paused" : "Running"} · tick ${runtime.tick}${runtime.steps ? ` · ${runtime.steps} steps remaining` : ""}` : "Engine unavailable"}</p>
    {error && <p className="mb-3 text-red-400" role="alert">{error}</p>}
    {message && <p className="mb-3 text-cyan-300" role="status">{message}</p>}
    <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
      <aside className="space-y-5">
        <fieldset disabled={busy} className="space-y-2">
          <legend className="mb-2 font-medium">Saved scenarios and bookmarks</legend>
          <select aria-label="Scenario" className={input} value={scenarios.some(item => item.id === id) ? id : ""} onChange={event => { const item = scenarios.find(item => item.id === event.target.value); if (item) { setId(item.id); setYaml(item.yaml); setError(item.error ?? ""); setMessage(""); } }}>
            <option value="">Choose a scenario</option>
            {scenarios.map(item => <option value={item.id} key={item.id}>{item.name} ({item.entity_count ?? "invalid"}){item.captured_tick !== undefined ? " · bookmark" : ""}</option>)}
          </select>
          <button className={button} onClick={() => { setId("my-scenario"); setYaml(example); }}>New scenario</button>
          <p className="text-sm text-slate-400">Tags: {scenarios.find(item => item.id === id)?.tags?.join(", ") || "none"}</p>
          <label className="block text-sm">Extra player bindings (JSON)<input className={input} value={bindings} onChange={event => setBindings(event.target.value)} placeholder={'{"player2":"player UUID"}'} /></label>
          <div className="flex flex-wrap gap-2">{["validate", "save", "load"].map(action => <button className={button} key={action} onClick={() => void act(action)}>{action === "load" ? "Load (replace world)" : action}</button>)}</div>
        </fieldset>
        <fieldset disabled={busy || !runtime} className="space-y-2">
          <legend className="mb-2 font-medium">Simulation</legend>
          <div className="flex flex-wrap gap-2">
            <button className={button} disabled={!runtime?.scenario_id} onClick={() => void act("reload")}>Reload</button>
            <button className={button} onClick={() => void act(runtime?.paused ? "resume" : "pause")}>{runtime?.paused ? "Resume" : "Pause"}</button>
          </div>
          <label className="block text-sm">Ticks<input className={input} type="number" min={1} max={3600} value={ticks} onChange={event => setTicks(Number(event.target.value))} /></label>
          <button className={button} disabled={!runtime?.paused} onClick={() => void act("step")}>Step</button>
        </fieldset>
        <fieldset disabled={busy || !runtime} className="space-y-2">
          <legend className="mb-2 font-medium">Bookmark current authoritative state</legend>
          <label className="block text-sm">Bookmark ID<input className={input} value={bookmark} onChange={event => setBookmark(event.target.value)} placeholder="energy-shortage" /></label>
          <label className="block text-sm">Tags (comma separated)<input className={input} value={tags} onChange={event => setTags(event.target.value)} /></label>
          <label className="block text-sm">Capture<select className={input} value={scope} onChange={event => setScope(event.target.value)}><option value="world">Whole world</option><option value="entities">Entity IDs</option><option value="area">Area</option></select></label>
          {scope === "entities" && <label className="block text-sm">Entity IDs (comma separated)<input className={input} value={entityIds} onChange={event => setEntityIds(event.target.value)} /></label>}
          {scope === "area" && <>{[["Center X", centerX, setCenterX], ["Center Y", centerY, setCenterY], ["Radius", radius, setRadius]].map(([label, value, setter]) => <label key={label as string} className="block text-sm">{label as string}<input className={input} type="number" value={value as number} onChange={event => (setter as (value: number) => void)(Number(event.target.value))} /></label>)}</>}
          <button className={button} onClick={() => void act("bookmark")}>Capture bookmark</button>
          <p className="text-xs text-slate-400">Captures inventory, health and technology. Orders and fractional timers start fresh when loaded.</p>
        </fieldset>
      </aside>
      <section aria-label="Scenario YAML" className="overflow-hidden rounded border border-slate-700"><YamlEditor kind="scenario" id={id} value={yaml} onChange={setYaml} /></section>
    </div>
  </main>;
}
