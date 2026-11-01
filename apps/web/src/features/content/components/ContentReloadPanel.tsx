"use client";

import { useCallback, useEffect, useState } from "react";

type Operation = {
  reload_id: string; candidate_revision?: string; base_revision?: string;
  status: string; requested_by: string; requested_at: number; activated_tick?: number;
  transitions: Array<{ status: string; at: number }>;
  error?: { stage: string; code: string; message: string; path?: string };
  recovery?: { code: string; snapshot_revision: string; previous_active_revision: string; at: number };
};
type Client = {
  client_id: string; player_id: string; status: string; advertised_revision: string;
  definitions_revision: string; asset_bundles: Record<string, string | null>;
  received_at: number; last_applied_at?: number;
  error?: { stage: string; code: string; message: string; entity_id?: string; url?: string; expected_hash?: string };
};
type ReloadStatus = {
  active: { content_revision: string; reload_id: string; activated_tick: number } | null;
  operations: Operation[];
  clients: Client[];
  client_events: Client[];
};

export default function ContentReloadPanel() {
  const [status, setStatus] = useState<ReloadStatus | null>(null);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const refresh = useCallback(async () => {
    const response = await fetch("/api/content/reload", { cache: "no-store" });
    if (!response.ok) throw new Error(`Reload status unavailable (${response.status})`);
    setStatus(await response.json());
  }, []);

  useEffect(() => {
    let disposed = false;
    let timer: number | undefined;
    const poll = async () => {
      try {
        if (!document.hidden) { await refresh(); if (!disposed) setError(""); }
      } catch (failure) {
        if (!disposed) setError(failure instanceof Error ? failure.message : "Unable to read reload status");
      } finally {
        if (!disposed) timer = window.setTimeout(poll, 2000);
      }
    };
    void poll();
    return () => { disposed = true; clearTimeout(timer); };
  }, [refresh]);

  async function publish() {
    setPublishing(true);
    setError("");
    try {
      const response = await fetch("/api/content/reload", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base_revision: status?.active?.content_revision }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to publish content");
      await refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to publish content");
    } finally { setPublishing(false); }
  }

  const latest = status?.operations[0];
  return (
    <details className="mb-3 rounded border border-slate-700 bg-slate-900/50 p-3 text-sm">
      <summary className="cursor-pointer">
        Live content: {status?.active ? <code title={status.active.content_revision}>{status.active.content_revision.slice(0, 12)}</code> : "not active"}
        {latest && <span className="ml-3">Latest reload: {latest.status}</span>}
        {status && <span className="ml-3 text-slate-400">{status.clients.filter((client) => client.status === "synchronized" && client.definitions_revision === status.active?.content_revision).length}/{status.clients.length} clients synchronized</span>}
        {error && <span className="ml-3 text-red-300">{error}</span>}
        {latest?.error && <span className="ml-3 text-red-300">{latest.error.message}</span>}
      </summary>
      <p className="my-2 text-slate-400">Editor saves publish automatically. Publish files to apply external edits. Invalid revisions leave the live game unchanged.</p>
      <button type="button" onClick={() => void publish()} disabled={publishing} className="rounded border border-slate-600 px-3 py-1 disabled:opacity-50">
        {publishing ? "Staging…" : "Publish files"}
      </button>
      {status?.active && <p className="mt-2 break-all">Active revision <code>{status.active.content_revision}</code> at tick {status.active.activated_tick}; reload <code>{status.active.reload_id}</code>.</p>}
      <h3 className="mt-3 font-medium">Reload history</h3>
      {!status?.operations.length && <p className="text-slate-400">No recorded reload attempts.</p>}
      <ol className="mt-2 max-h-72 space-y-2 overflow-auto">
        {status?.operations.map((operation) => (
          <li key={operation.reload_id} className="rounded border border-slate-800 p-2">
            <strong>{operation.status}</strong> · {new Date(operation.requested_at).toLocaleString()} · {operation.requested_by}
            <div className="break-all">Reload <code>{operation.reload_id}</code></div>
            <div className="break-all">Candidate <code>{operation.candidate_revision || "not staged"}</code></div>
            <div className="break-all">Base <code>{operation.base_revision || "none"}</code>{operation.activated_tick !== undefined && ` · activated at tick ${operation.activated_tick}`}</div>
            <div className="text-slate-400">{operation.transitions.map((transition) => `${transition.status} ${new Date(transition.at).toLocaleTimeString()}`).join(" → ")}</div>
            {operation.error && <p className="break-words text-red-300" role="alert">{operation.error.stage}/{operation.error.code}: {operation.error.message}{operation.error.path && ` (${operation.error.path})`}</p>}
            {operation.recovery && <p className="break-all text-amber-300">Recovery: {operation.recovery.code}; snapshot revision {operation.recovery.snapshot_revision}; previous active revision {operation.recovery.previous_active_revision}.</p>}
            <button type="button" className="mt-1 underline" onClick={() => void navigator.clipboard.writeText(operation.reload_id).catch(() => setError("Unable to copy reload ID"))}>Copy reload ID</button>
          </li>
        ))}
      </ol>
      <h3 className="mt-3 font-medium">Connected client reports</h3>
      <p className="text-slate-400">Reports expire after two minutes. Synchronized means definitions and required visuals have been applied.</p>
      {status?.clients.map((client) => (
        <details key={client.client_id} className="mt-2 rounded border border-slate-800 p-2">
          <summary className="cursor-pointer">{client.status} · {client.player_id} · {client.client_id.slice(0, 8)}</summary>
          <pre className="mt-2 overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(client, null, 2)}</pre>
        </details>
      ))}
      <details className="mt-3">
        <summary className="cursor-pointer font-medium">Client application history</summary>
        <p className="text-slate-400">The last 100 state transitions are retained, including failures after recovery.</p>
        <div className="max-h-72 overflow-auto">
          {status?.client_events.map((event, index) => (
            <details key={`${event.client_id}:${event.received_at}:${index}`} className="mt-2 border-t border-slate-800 pt-2">
              <summary className={`cursor-pointer ${event.status === "failed" ? "text-red-300" : ""}`}>
                {new Date(event.received_at).toLocaleString()} · {event.status} · {event.client_id.slice(0, 8)}
              </summary>
              <pre className="overflow-auto whitespace-pre-wrap break-all text-xs">{JSON.stringify(event, null, 2)}</pre>
            </details>
          ))}
        </div>
      </details>
    </details>
  );
}
