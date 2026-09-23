"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Entity = { id: string };
type Candidate = { id: string; url: string; revisedPrompt?: string };
type Generation = { entityId: string; requestId: string; count: number; finalPrompt: string; candidates: Candidate[] };
type GenerationEvent =
  | { type: "start"; entityId: string; requestId: string; count: number; finalPrompt: string }
  | { type: "candidate"; candidate: Candidate }
  | { type: "done" }
  | { type: "error"; error: string };

export default function SpriteGenerationPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [entityId, setEntityId] = useState("");
  const [provider, setProvider] = useState("openai");
  const [brief, setBrief] = useState("");
  const [references, setReferences] = useState<string[]>([]);
  const [referenceStrength, setReferenceStrength] = useState("style");
  const [resolution, setResolution] = useState(256);
  const [steps, setSteps] = useState(40);
  const [count, setCount] = useState(4);
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/content/entities")
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        const next = data?.entities ?? [];
        setEntities(next);
        const firstId = next[0]?.id ?? "";
        setEntityId(firstId);
        setReferences(firstId ? [firstId] : []);
      })
      .catch(() => setMessage("Could not load entity IDs."));
  }, []);

  const referenceOptions = entities;

  function selectEntity(id: string) {
    setEntityId(id);
    setReferences((current) => current.includes(id) ? current : [id, ...current].slice(0, 3));
  }

  function toggleReference(id: string) {
    setReferences((current) => current.includes(id)
      ? current.filter((item) => item !== id)
      : current.length < 3 ? [...current, id] : current);
  }

  async function generate() {
    setBusy(true);
    setMessage(null);
    setGeneration(null);
    try {
      const response = await fetch("/api/content/sprites/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId, brief, referenceEntityIds: references, referenceStrength, resolution, steps, count, provider }),
      });
      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Generation failed.");
      }
      if (!response.body) throw new Error("The generation connection closed before candidates arrived.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = "";
      while (true) {
        const { done, value } = await reader.read();
        pending += decoder.decode(value, { stream: !done });
        const lines = pending.split("\n");
        pending = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as GenerationEvent;
          if (event.type === "start") {
            setGeneration({ entityId: event.entityId, requestId: event.requestId, count: event.count, finalPrompt: event.finalPrompt, candidates: [] });
          } else if (event.type === "candidate") {
            setGeneration((current) => current ? { ...current, candidates: [...current.candidates, event.candidate] } : current);
          } else if (event.type === "error") {
            setMessage(event.error);
          }
        }
        if (done) break;
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  }

  async function publish(candidate: Candidate) {
    if (!generation) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/content/sprites/${generation.entityId}/${generation.requestId}/${candidate.id}/publish`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Publishing failed.");
      setMessage(`Published ${candidate.id} as ${generation.entityId}/idle.png.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Publishing failed.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="mx-auto min-h-screen max-w-6xl bg-slate-950 px-6 py-10 text-slate-100">
    <div className="mb-8 flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-medium tracking-[0.24em] text-cyan-400 uppercase">BitWars Content Editor</p>
        <h1 className="mt-2 text-3xl font-semibold">Sprite generation</h1>
        <p className="mt-2 max-w-2xl text-slate-400">Generate a few original candidates from an art brief and existing BitWars style references. Review before publishing one as the entity’s live sprite.</p>
      </div>
      <Link className="rounded border border-slate-600 px-3 py-2 text-sm hover:border-cyan-400 hover:text-cyan-300" href="/content">Back to content</Link>
    </div>

    <section className="grid gap-6 rounded-xl border border-slate-700 bg-slate-900/70 p-6 md:grid-cols-2">
      <label className="grid gap-2 text-sm font-medium">Entity
        <select className="rounded border border-slate-600 bg-slate-950 px-3 py-2" onChange={(event) => selectEntity(event.target.value)} value={entityId}>
          {entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.id}</option>)}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium">Image provider
        <select className="rounded border border-slate-600 bg-slate-950 px-3 py-2" onChange={(event) => setProvider(event.target.value)} value={provider}>
          <option value="openai">OpenAI · GPT Image 2.5 Flare</option>
          <option value="qwen">Qwen Image 2.1 · LAN</option>
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium">Candidates
        <select className="rounded border border-slate-600 bg-slate-950 px-3 py-2" onChange={(event) => setCount(Number(event.target.value))} value={count}>
          {[1, 2, 3, 4].map((value) => <option key={value} value={value}>{value}</option>)}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium">Qwen resolution
        <select className="rounded border border-slate-600 bg-slate-950 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50" disabled={provider !== "qwen"} onChange={(event) => setResolution(Number(event.target.value))} value={resolution}>
          <option value={192}>192 × 192</option>
          <option value={256}>256 × 256</option>
          <option value={1024}>1024 × 1024</option>
        </select>
        {provider !== "qwen" && <span className="text-xs font-normal text-slate-400">OpenAI uses 1024 × 1024.</span>}
      </label>
      <label className="grid gap-2 text-sm font-medium">Qwen steps
        <input className="rounded border border-slate-600 bg-slate-950 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-50" disabled={provider !== "qwen"} max={100} min={1} onChange={(event) => setSteps(Number(event.target.value))} step={1} type="number" value={steps} />
        {provider !== "qwen" && <span className="text-xs font-normal text-slate-400">OpenAI controls its own generation steps.</span>}
      </label>
      <label className="grid gap-2 text-sm font-medium md:col-span-2">Art brief
        <textarea className="min-h-32 rounded border border-slate-600 bg-slate-950 px-3 py-2" onChange={(event) => setBrief(event.target.value)} placeholder="A compact top-down interceptor with a cobalt hull, warm engine glow, swept wings, and a clear silhouette at small scale." value={brief} />
      </label>
      <fieldset className="md:col-span-2">
        <legend className="text-sm font-medium">Style references <span className="font-normal text-slate-400">(up to 3)</span></legend>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {referenceOptions.map((entity) => <label className="flex cursor-pointer items-center gap-2 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm hover:border-slate-500" key={entity.id}>
            <input checked={references.includes(entity.id)} disabled={!references.includes(entity.id) && references.length >= 3} onChange={() => toggleReference(entity.id)} type="checkbox" />
            <img alt="" className="size-8 object-contain" src={`/assets/${entity.id}/idle.png`} />
            {entity.id}
          </label>)}
        </div>
      </fieldset>
      <label className="grid gap-2 text-sm font-medium md:col-span-2">Reference strength
        <select className="rounded border border-slate-600 bg-slate-950 px-3 py-2" onChange={(event) => setReferenceStrength(event.target.value)} value={referenceStrength}>
          <option value="style">Style only — more variation; do not upload reference images</option>
          <option value="visual">Visual reference — upload images, retain broad art direction</option>
          <option value="close">Close iteration — upload images, preserve their visual language</option>
        </select>
      </label>
      <div className="md:col-span-2"><button className="rounded bg-cyan-400 px-4 py-2 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || !entityId || brief.trim().length < 12} onClick={generate} type="button">{busy ? "Working…" : "Generate candidates"}</button></div>
    </section>

    {message && <p className="mt-5 rounded border border-cyan-500/50 bg-cyan-950/40 px-4 py-3 text-cyan-100">{message}</p>}
    {generation && <section className="mt-8">
      <h2 className="text-xl font-semibold">Review candidates <span className="text-sm font-normal text-slate-400">({generation.candidates.length}/{generation.count})</span></h2>
      <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-4">
        <p className="text-sm font-medium">Final prompt</p>
        <pre className="mt-3 whitespace-pre-wrap font-sans text-sm text-slate-300">{generation.finalPrompt}</pre>
      </div>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {generation.candidates.map((candidate) => <article className="rounded-xl border border-slate-700 bg-slate-900 p-4" key={candidate.id}>
          <div className="grid aspect-square place-items-center rounded-lg bg-[linear-gradient(45deg,#182235_25%,transparent_25%,transparent_75%,#182235_75%),linear-gradient(45deg,#182235_25%,transparent_25%,transparent_75%,#182235_75%)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]">
            <img alt={`${candidate.id} for ${generation.entityId}`} className="max-h-full max-w-full object-contain" src={candidate.url} />
          </div>
          <p className="mt-3 text-sm font-medium">{candidate.id}</p>
          {candidate.revisedPrompt && <p className="mt-2 line-clamp-4 text-xs text-slate-400">{candidate.revisedPrompt}</p>}
          <button className="mt-4 w-full rounded border border-cyan-500 px-3 py-2 text-sm text-cyan-300 hover:bg-cyan-500/10 disabled:opacity-50" disabled={busy} onClick={() => publish(candidate)} type="button">Use this sprite</button>
        </article>)}
        {Array.from({ length: Math.max(0, generation.count - generation.candidates.length) }, (_, index) => <article className="animate-pulse rounded-xl border border-slate-700 bg-slate-900 p-4" key={`loading-${index}`}>
          <div className="aspect-square rounded-lg bg-slate-800" />
          <div className="mt-3 h-4 w-24 rounded bg-slate-800" />
          <div className="mt-4 h-9 rounded bg-slate-800" />
        </article>)}
      </div>
    </section>}
  </main>;
}
