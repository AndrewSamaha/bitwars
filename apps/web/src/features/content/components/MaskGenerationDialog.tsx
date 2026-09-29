"use client";

import { useEffect, useState } from "react";
import { PLAYER_PALETTES } from "@/lib/playerPalettes";
import MaskedSpritePreview from "./MaskedSpritePreview";

type Phase = "upscaling" | "upscaled" | "generating" | "ready" | "saving" | "error";
type VisibleMasks = "both" | "primary" | "secondary";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error ?? `Request failed (${response.status}).`);
  return payload as T;
}

function candidateUrl(sourcePath: string, requestId: string, part: "upscaled" | "primary" | "secondary", revision = 0) {
  return `/api/content/sprite-library/masks/image?${new URLSearchParams({ path: sourcePath, requestId, part, revision: String(revision) })}`;
}

export default function MaskGenerationDialog({ sourcePath, sourceUrl, upscalePromise, onClose, onSaved }: {
  sourcePath: string;
  sourceUrl: string;
  upscalePromise: Promise<{ requestId: string }>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("upscaling");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [primaryReady, setPrimaryReady] = useState(false);
  const [secondaryReady, setSecondaryReady] = useState(false);
  const [maskRevision, setMaskRevision] = useState(0);
  const [activePart, setActivePart] = useState<"primary" | "secondary" | null>(null);
  const [paletteId, setPaletteId] = useState<string>(PLAYER_PALETTES[0].id);
  const [visibleMasks, setVisibleMasks] = useState<VisibleMasks>("both");
  const [error, setError] = useState<string | null>(null);
  const palette = PLAYER_PALETTES.find((item) => item.id === paletteId) ?? PLAYER_PALETTES[0];

  useEffect(() => {
    let mounted = true;
    upscalePromise.then(({ requestId: generatedId }) => {
      if (!mounted) return;
      setRequestId(generatedId);
      setPhase("upscaled");
    }).catch((cause) => {
      if (!mounted) return;
      setError(cause instanceof Error ? cause.message : "Unable to upscale sprite.");
      setPhase("error");
    });
    return () => { mounted = false; };
  }, [upscalePromise]);

  async function generateMasks() {
    if (!requestId) return;
    setPhase("generating");
    setError(null);
    setPrimaryReady(false);
    setSecondaryReady(false);
    try {
      for (const part of ["primary", "secondary"] as const) {
        setActivePart(part);
        await postJson("/api/content/sprite-library/masks/generate", { path: sourcePath, requestId, part });
        setMaskRevision((revision) => revision + 1);
        if (part === "primary") setPrimaryReady(true);
        else setSecondaryReady(true);
      }
      setActivePart(null);
      setPhase("ready");
    } catch (cause) {
      setActivePart(null);
      setError(cause instanceof Error ? cause.message : "Unable to generate masks.");
      setPhase("upscaled");
    }
  }

  async function saveMasks() {
    if (!requestId) return;
    setPhase("saving");
    setError(null);
    try {
      await postJson("/api/content/sprite-library/masks/publish", { path: sourcePath, requestId });
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save masks.");
      setPhase("ready");
    }
  }

  const upscaledUrl = requestId ? candidateUrl(sourcePath, requestId, "upscaled") : null;
  const primaryUrl = requestId && primaryReady ? candidateUrl(sourcePath, requestId, "primary", maskRevision) : null;
  const secondaryUrl = requestId && secondaryReady ? candidateUrl(sourcePath, requestId, "secondary", maskRevision) : null;
  const busy = phase === "upscaling" || phase === "generating" || phase === "saving";

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4">
    <section aria-labelledby="generate-masks-title" aria-modal="true" className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-xl border border-slate-600 bg-slate-900 p-6 text-slate-100 shadow-2xl" role="dialog">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-cyan-300">Sprite tools</p>
          <h2 className="mt-1 text-xl font-semibold" id="generate-masks-title">Generate player color masks</h2>
          <p className="mt-2 text-sm text-slate-400">Review the enlarged sprite, generate two candidate regions, then try the player palettes before saving.</p>
        </div>
        <button className="rounded border border-slate-600 px-3 py-1 text-sm hover:bg-slate-800" onClick={onClose} type="button">Close</button>
      </div>

      {error && <p className="mt-5 rounded border border-red-500/50 bg-red-950/40 px-4 py-3 text-sm text-red-200" role="alert">{error}</p>}
      <div className="mt-5 flex flex-wrap gap-5">
        <div>
          <h3 className="mb-2 text-sm font-medium">Original</h3>
          <div className="grid size-64 place-items-center rounded border border-slate-700 bg-[linear-gradient(45deg,#182235_25%,transparent_25%,transparent_75%,#182235_75%)] bg-[length:20px_20px]"><img alt="Original sprite" className="size-full object-contain" src={sourceUrl} /></div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium">Flare enlarged reference</h3>
          <div className="grid size-64 place-items-center rounded border border-slate-700 bg-[linear-gradient(45deg,#182235_25%,transparent_25%,transparent_75%,#182235_75%)] bg-[length:20px_20px]">
            {upscaledUrl ? <img alt="Enlarged sprite proposal" className="size-full object-contain" src={upscaledUrl} /> : <span className="px-4 text-center text-sm text-slate-400">{phase === "error" ? "Generation failed" : "Generating enlarged reference…"}</span>}
          </div>
        </div>
        {primaryUrl && <div>
          <h3 className="mb-2 text-sm font-medium">Primary mask</h3>
          <div className="grid size-48 place-items-center rounded border border-slate-700 bg-[linear-gradient(45deg,#182235_25%,transparent_25%,transparent_75%,#182235_75%)] bg-[length:20px_20px]"><img alt="Primary mask proposal" className="size-full object-contain" src={primaryUrl} /></div>
        </div>}
        {secondaryUrl && <div>
          <h3 className="mb-2 text-sm font-medium">Secondary mask</h3>
          <div className="grid size-48 place-items-center rounded border border-slate-700 bg-[linear-gradient(45deg,#182235_25%,transparent_25%,transparent_75%,#182235_75%)] bg-[length:20px_20px]"><img alt="Secondary mask proposal" className="size-full object-contain" src={secondaryUrl} /></div>
        </div>}
      </div>

      {phase === "generating" && <p aria-live="polite" className="mt-5 text-sm text-cyan-300">Generating {activePart} mask with GPT Image 2.5 Sunburst…</p>}
      {primaryUrl && secondaryUrl && <div className="mt-6 border-t border-slate-700 pt-5">
        <h3 className="text-base font-medium">Spot check player colors</h3>
        <div className="mt-3 flex flex-wrap gap-5">
          <div className="grid size-72 place-items-center rounded border border-slate-700 bg-[linear-gradient(45deg,#182235_25%,transparent_25%,transparent_75%,#182235_75%)] bg-[length:20px_20px]">
            <MaskedSpritePreview baseUrl={sourceUrl} className="size-full" palette={palette} primaryMaskUrl={primaryUrl} secondaryMaskUrl={secondaryUrl} showPrimary={visibleMasks !== "secondary"} showSecondary={visibleMasks !== "primary"} />
          </div>
          <div className="min-w-56 flex-1">
            <p className="mb-2 text-sm text-slate-300">Regions</p>
            <div className="flex gap-2">
              {(["both", "primary", "secondary"] as const).map((choice) => <button aria-pressed={visibleMasks === choice} className={`rounded border px-3 py-1.5 text-sm capitalize ${visibleMasks === choice ? "border-cyan-400 bg-cyan-400/10" : "border-slate-600"}`} key={choice} onClick={() => setVisibleMasks(choice)} type="button">{choice}</button>)}
            </div>
            <p className="mb-2 mt-5 text-sm text-slate-300">Player palettes</p>
            <div className="grid grid-cols-4 gap-2">
              {PLAYER_PALETTES.map((item) => <button aria-label={`Preview ${item.name} player colors`} aria-pressed={palette.id === item.id} className={`flex items-center justify-center gap-1.5 rounded border px-2 py-3 ${palette.id === item.id ? "border-cyan-400 bg-cyan-400/10" : "border-slate-600 hover:border-cyan-400"}`} key={item.id} onClick={() => setPaletteId(item.id)} title={item.name} type="button"><span className="size-5 rounded-full" style={{ backgroundColor: item.primary }} /><span className="size-5 rounded-full" style={{ backgroundColor: item.secondary }} /></button>)}
            </div>
          </div>
        </div>
      </div>}

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-5">
        <button className="rounded border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800" onClick={onClose} type="button">Cancel</button>
        {requestId && !primaryReady && phase !== "generating" && <button className="rounded bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950" onClick={generateMasks} type="button">Generate masks</button>}
        {requestId && (primaryReady || secondaryReady) && phase === "upscaled" && <button className="rounded bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950" onClick={generateMasks} type="button">Retry masks</button>}
        {primaryReady && secondaryReady && !busy && <button className="rounded bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950" onClick={saveMasks} type="button">Save masks</button>}
        {phase === "saving" && <span className="self-center text-sm text-cyan-300">Saving masks…</span>}
      </div>
      <p className="mt-3 text-xs text-slate-500">Generated masks are proposals. Check alignment and coverage before saving; the sprite artwork is preserved.</p>
    </section>
  </div>;
}
