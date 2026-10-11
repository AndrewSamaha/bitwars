"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import YamlEditor from "./YamlEditor";

export default function SpawnEditor() {
  const [yaml, setYaml] = useState("");
  const [savedYaml, setSavedYaml] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/content/spawn", { cache: "no-store", signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Unable to load spawn configuration");
        setYaml(data.yaml);
        setSavedYaml(data.yaml);
      } catch (error) {
        if (!controller.signal.aborted) setError(error instanceof Error ? error.message : "Unable to load spawn configuration");
      }
    }
    void load();
    return () => controller.abort();
  }, []);

  async function save() {
    const submittedYaml = yaml;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/content/spawn", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yaml: submittedYaml }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to save spawn configuration");
      setSavedYaml(submittedYaml);
      setMessage("Saved. Changes take effect when the engine restarts.");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save spawn configuration");
    } finally {
      setBusy(false);
    }
  }

  return <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
    <nav className="mb-4 flex flex-wrap border-b border-slate-700" aria-label="Content">
      {[["entities", "Entities"], ["techtree", "Techtree"], ["sprite-library", "Sprites"], ["sfx", "SFX"], ["scenarios", "Scenarios"], ["spawn", "Spawn"]].map(([path, label]) =>
        <Link key={path} href={`/content/${path}`} aria-current={path === "spawn" ? "page" : undefined} className={`px-4 py-2 text-sm ${path === "spawn" ? "border-b-2 border-cyan-400 text-cyan-300" : "text-slate-400 hover:text-cyan-300"}`}>{label}</Link>)}
    </nav>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold">Spawn configuration</h1>
        <p className="mt-1 text-sm text-slate-400">Edit loadouts, neutral fields, starting resources and deposit amounts. Changes take effect when the engine restarts.</p>
      </div>
      <button type="button" className="rounded border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-40" disabled={busy || savedYaml === null || yaml === savedYaml} onClick={() => void save()}>{busy ? "Saving…" : "Save changes"}</button>
    </div>
    {error && <p className="mb-3 text-red-400" role="alert">{error}</p>}
    {message && <p className="mb-3 text-cyan-300" role="status">{message}</p>}
    {savedYaml === null ? !error && <p role="status">Loading spawn configuration…</p> :
      <section aria-label="Spawn configuration YAML" className="overflow-hidden rounded border border-slate-700">
        <YamlEditor kind="spawn" id="spawn" value={yaml} onChange={value => { setYaml(value); setMessage(""); }} />
      </section>}
  </main>;
}
