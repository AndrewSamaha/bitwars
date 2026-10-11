"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { audioUrl, type SfxAttribution, type SfxDefinition, type SfxEntry, validSfxId } from "@/features/audio/sfxCatalog";

const emptyAttribution: SfxAttribution = { artist: "", source: "", license: "", changes: "", retrieved: "" };
const fieldClass = "w-full rounded border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-400";

export default function SfxCatalogEditor() {
  const [effects, setEffects] = useState<SfxEntry[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [draft, setDraft] = useState<SfxDefinition | null>(null);
  const [newId, setNewId] = useState("");
  const [existingPath, setExistingPath] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const selected = effects.find((effect) => effect.id === selectedId);
  const changed = selected && draft && JSON.stringify(draft) !== JSON.stringify(selected.definition);

  useEffect(() => {
    fetch("/api/content/sfx", { cache: "no-store" })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Unable to load sounds."); return data; })
      .then((data: { effects: SfxEntry[] }) => {
        setEffects(data.effects);
        const first = data.effects[0];
        setSelectedId(first?.id ?? "");
        setDraft(first ? structuredClone(first.definition) : null);
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load sounds."))
      .finally(() => setLoaded(true));
  }, []);

  function select(effect: SfxEntry) {
    if (changed && !window.confirm("Discard unsaved changes?")) return;
    setSelectedId(effect.id);
    setDraft(structuredClone(effect.definition));
    setExistingPath("");
    setError(null);
  }

  async function mutate(method: "POST" | "PUT" | "DELETE", body: object) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/content/sfx", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to save sound effect.");
      setEffects(result.effects);
      return result.effects as SfxEntry[];
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save sound effect.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function createEffect() {
    if (busy || (changed && !window.confirm("Discard unsaved changes?"))) return;
    const id = newId.trim();
    if (!validSfxId(id)) { setError("Use a lowercase, hyphenated sound key."); return; }
    const definition: SfxDefinition = { name: id.replaceAll("-", " "), sources: [], volume: 0.7, pool: 5, attribution: { ...emptyAttribution } };
    const updated = await mutate("POST", { id, definition });
    if (updated) {
      setSelectedId(id);
      setDraft(structuredClone(updated.find((effect) => effect.id === id)!.definition));
      setNewId("");
    }
  }

  async function saveEffect() {
    if (!draft || !selected) return;
    const updated = await mutate("PUT", { id: selected.id, definition: draft });
    if (updated) setDraft(structuredClone(updated.find((effect) => effect.id === selected.id)!.definition));
  }

  async function deleteEffect() {
    if (!selected || selected.usedByGameplay || !window.confirm(`Delete ${selected.id} from the catalog? Uploaded files will remain on disk.`)) return;
    const updated = await mutate("DELETE", { id: selected.id });
    if (updated) {
      const first = updated[0];
      setSelectedId(first?.id ?? "");
      setDraft(first ? structuredClone(first.definition) : null);
    }
  }

  async function upload(file: File | undefined) {
    if (!selected || !draft || !file) return;
    setBusy(true);
    setError(null);
    try {
      const data = new FormData();
      data.set("id", selected.id);
      data.set("file", file);
      const response = await fetch("/api/content/sfx/assets", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to upload audio.");
      setDraft((current) => current && ({ ...current, sources: [...current.sources, result.source] }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to upload audio.");
    } finally {
      setBusy(false);
    }
  }

  return <main className="flex min-h-screen bg-slate-950 text-slate-100">
    <section className="min-w-0 flex-1 p-6 lg:px-10 lg:pb-10 lg:pt-6">
      <header className="mb-[18px]"><p className="text-sm font-medium uppercase tracking-[0.24em] text-cyan-400">BitWars Content Editor</p></header>
      <nav aria-label="Content type" className="mb-5 flex gap-1 border-b border-slate-700">
        <Link className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-cyan-300" href="/content/entities">Entities</Link>
        <Link className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-cyan-300" href="/content/techtree">Techtree</Link>
        <Link className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-cyan-300" href="/content/sprite-library">Sprites</Link>
        <Link className="border-b-2 border-cyan-400 px-4 py-2 text-sm font-medium text-cyan-300" href="/content/sfx">SFX</Link>
          <Link className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-cyan-300" href="/content/scenarios">Scenarios</Link>
          <Link className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-cyan-300" href="/content/spawn">Spawn</Link>
      </nav>
      <div className="rounded-xl border border-slate-700 bg-slate-900/60 p-5">
        <h1 className="text-xl font-semibold">Sound effects</h1>
        <p className="mt-1 text-sm text-slate-400">Stable keys map gameplay events to one or more audio files.</p>
        <div className="mt-5 flex gap-2">
          <input aria-label="New sound key" className={fieldClass} onChange={(event) => setNewId(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") createEffect(); }} placeholder="new-sound-key" value={newId} />
          <button className="shrink-0 rounded bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-50" disabled={busy || !newId.trim()} onClick={createEffect} type="button">Add sound</button>
        </div>
        <div className="mt-5 overflow-hidden rounded-lg border border-slate-700">
          <table className="w-full text-left text-sm"><thead className="bg-slate-800/80 text-slate-300"><tr><th className="px-4 py-3">Sound key</th><th className="px-4 py-3">Files</th><th className="px-4 py-3">Status</th></tr></thead><tbody>
            {effects.map((effect) => <tr className={`border-t border-slate-800 ${effect.id === selectedId ? "bg-cyan-400/10" : "hover:bg-slate-800/60"}`} key={effect.id}>
              <td className="px-4 py-3"><button aria-pressed={effect.id === selectedId} className="font-mono text-cyan-300 hover:underline" onClick={() => select(effect)} type="button">{effect.id}</button></td>
              <td className="px-4 py-3">{effect.definition.sources.length}</td><td className="px-4 py-3 text-slate-400">{effect.usedByGameplay ? "Used by game" : "Unassigned"}</td>
            </tr>)}
            {loaded && effects.length === 0 && <tr><td className="px-4 py-5 text-slate-400" colSpan={3}>No sound effects yet.</td></tr>}
          </tbody></table>
        </div>
      </div>
    </section>
    <aside className="w-[42rem] shrink-0 overflow-y-auto border-l border-slate-700 bg-slate-900 p-6">
      {error && <p className="mb-5 rounded border border-red-500/50 bg-red-950/40 px-4 py-3 text-sm text-red-200" role="alert">{error}</p>}
      {selected && draft ? <>
        <div className="flex items-start justify-between gap-3 border-b border-slate-700 pb-5"><div><p className="text-sm text-slate-400">Sound effect</p><h2 className="mt-1 break-all font-mono text-xl font-semibold">{selected.id}</h2></div><div className="flex gap-2"><button className="rounded border border-slate-600 px-3 py-2 text-sm disabled:opacity-50" disabled={busy || !changed} onClick={() => setDraft(structuredClone(selected.definition))} type="button">Cancel</button><button className="rounded bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-50" disabled={busy || !changed} onClick={saveEffect} type="button">{busy ? "Saving…" : "Save"}</button></div></div>
        <div className="mt-5 grid grid-cols-2 gap-4"><label className="col-span-2 text-sm text-slate-300">Name<input className={`mt-1 ${fieldClass}`} onChange={(event) => setDraft({ ...draft, name: event.target.value })} value={draft.name} /></label><label className="text-sm text-slate-300">Volume (0–1)<input className={`mt-1 ${fieldClass}`} max="1" min="0" onChange={(event) => setDraft({ ...draft, volume: Number(event.target.value) })} step="0.05" type="number" value={draft.volume} /></label><label className="text-sm text-slate-300">Playback pool<input className={`mt-1 ${fieldClass}`} max="32" min="1" onChange={(event) => setDraft({ ...draft, pool: Number(event.target.value) })} type="number" value={draft.pool} /></label></div>
        <div className="mt-6 border-t border-slate-700 pt-5"><h3 className="text-sm font-medium text-slate-300">Audio files</h3><p className="mt-1 text-xs text-slate-400">Files play as random variants. Save after uploading to assign them. Removing a file here does not delete it from disk.</p>
          <div className="mt-3 space-y-3">{draft.sources.map((source) => <div className="rounded border border-slate-700 bg-slate-950 p-3" key={source}><div className="flex items-start justify-between gap-2"><span className="break-all font-mono text-xs text-slate-300">{source}</span><button aria-label={`Remove ${source}`} className="text-xs text-red-300 hover:underline" onClick={() => setDraft({ ...draft, sources: draft.sources.filter((item) => item !== source) })} type="button">Remove</button></div><audio className="mt-2 w-full" controls preload="none" src={audioUrl(source)} /></div>)}{draft.sources.length === 0 && <p className="text-sm text-slate-400">No audio files assigned.</p>}</div>
          <label className="mt-4 block text-sm text-slate-300">Upload a clip<input accept=".mp3,.wav,.ogg,.flac" className="mt-2 block w-full text-sm" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; void upload(file); event.target.value = ""; }} type="file" /></label>
          <div className="mt-4 flex gap-2"><input aria-label="Existing audio path" className={fieldClass} onChange={(event) => setExistingPath(event.target.value)} placeholder="sfx/folder/file.wav" value={existingPath} /><button className="shrink-0 rounded border border-slate-600 px-3 text-sm disabled:opacity-50" disabled={!existingPath.trim()} onClick={() => { const source = existingPath.trim(); if (!draft.sources.includes(source)) setDraft({ ...draft, sources: [...draft.sources, source] }); setExistingPath(""); }} type="button">Add existing</button></div>
        </div>
        <div className="mt-6 border-t border-slate-700 pt-5"><h3 className="text-sm font-medium text-slate-300">Attribution</h3><p className="mt-1 text-xs text-slate-400">Required for assigned files. The public attribution document is updated when you save.</p><div className="mt-3 space-y-3">{(["artist", "source", "license", "changes", "retrieved"] as const).map((field) => <label className="block text-sm capitalize text-slate-300" key={field}>{field}<input className={`mt-1 ${fieldClass}`} onChange={(event) => setDraft({ ...draft, attribution: { ...draft.attribution, [field]: event.target.value } })} value={draft.attribution[field]} /></label>)}</div></div>
        <div className="mt-6 border-t border-slate-700 pt-5"><button className="rounded border border-red-500/60 px-4 py-2 text-sm text-red-300 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || selected.usedByGameplay} onClick={deleteEffect} type="button">Delete sound effect</button>{selected.usedByGameplay && <p className="mt-2 text-xs text-slate-400">This key is referenced by gameplay and cannot be deleted.</p>}</div>
      </> : <p className="text-slate-400">Select or add a sound effect.</p>}
    </aside>
  </main>;
}
