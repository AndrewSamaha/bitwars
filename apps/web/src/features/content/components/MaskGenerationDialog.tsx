"use client";

import { useEffect, useState } from "react";
import { PLAYER_PALETTES } from "@/lib/playerPalettes";
import { DEFAULT_PRIMARY_OPACITY, DEFAULT_SECONDARY_BRIGHTNESS_THRESHOLD, DEFAULT_SECONDARY_OPACITY, MAX_SECONDARY_BRIGHTNESS_THRESHOLD } from "@/lib/playerColorSettings";
import MaskedSpritePreview from "./MaskedSpritePreview";

type Phase = "upscaling" | "upscaled" | "generating" | "generatingInvariants" | "ready" | "saving" | "error";
type VisibleMasks = "both" | "primary" | "secondary";
type PreviewSprite = "upscaled" | "published";

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

function candidateUrl(sourcePath: string, requestId: string, part: "upscaled" | "gray-upscaled" | "gray" | "primary" | "primary-upscaled" | "invariants" | "invariants-upscaled" | "invariant-colors" | "invariant-colors-upscaled", revision = 0) {
  return `/api/content/sprite-library/masks/image?${new URLSearchParams({ path: sourcePath, requestId, part, revision: String(revision) })}`;
}

function GeneratedImage({ src, alt, size, failed }: { src: string | null; alt: string; size: "size-64" | "size-48"; failed?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const pending = !failed && !loadFailed && !loaded;

  return <div aria-busy={pending} className={`relative grid ${size} place-items-center overflow-hidden rounded border border-slate-700 bg-[linear-gradient(45deg,#182235_25%,transparent_25%,transparent_75%,#182235_75%)] bg-[length:20px_20px]`}>
    {pending && <div className="absolute inset-4 animate-pulse rounded-lg bg-slate-700/70 motion-reduce:animate-none" role="status"><span className="sr-only">Preparing {alt.toLowerCase()}…</span></div>}
    {src && <img alt={alt} className={`size-full object-contain ${loaded ? "" : "invisible"}`} onError={() => setLoadFailed(true)} onLoad={() => setLoaded(true)} src={src} />}
    {(failed || loadFailed) && <span className="px-4 text-center text-sm text-slate-400">Image unavailable</span>}
  </div>;
}

export default function MaskGenerationDialog({ sourcePath, sourceUrl, upscalePromise, onClose, onSaved }: {
  sourcePath: string;
  sourceUrl: string;
  upscalePromise: Promise<{ requestId: string; primaryPrompt: string; invariantsPrompt: string }>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("upscaling");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [primaryReady, setPrimaryReady] = useState(false);
  const [invariantsReady, setInvariantsReady] = useState(false);
  const [generationAttempted, setGenerationAttempted] = useState(false);
  const [primaryPrompt, setPrimaryPrompt] = useState("");
  const [invariantsPrompt, setInvariantsPrompt] = useState("");
  const [maskRevision, setMaskRevision] = useState(0);
  const [invariantsRevision, setInvariantsRevision] = useState(0);
  const [paletteId, setPaletteId] = useState<string>(PLAYER_PALETTES[0].id);
  const [primaryOpacity, setPrimaryOpacity] = useState(DEFAULT_PRIMARY_OPACITY);
  const [secondaryOpacity, setSecondaryOpacity] = useState(DEFAULT_SECONDARY_OPACITY);
  const [secondaryBrightnessThreshold, setSecondaryBrightnessThreshold] = useState(DEFAULT_SECONDARY_BRIGHTNESS_THRESHOLD);
  const [visibleMasks, setVisibleMasks] = useState<VisibleMasks>("both");
  const [previewSprite, setPreviewSprite] = useState<PreviewSprite>("upscaled");
  const [error, setError] = useState<string | null>(null);
  const palette = PLAYER_PALETTES.find((item) => item.id === paletteId) ?? PLAYER_PALETTES[0];

  useEffect(() => {
    let mounted = true;
    upscalePromise.then(({ requestId: generatedId, primaryPrompt: defaultPrompt, invariantsPrompt: defaultInvariantsPrompt }) => {
      if (!mounted) return;
      setRequestId(generatedId);
      setPrimaryPrompt(defaultPrompt);
      setInvariantsPrompt(defaultInvariantsPrompt);
      setPhase("upscaled");
    }).catch((cause) => {
      if (!mounted) return;
      setError(cause instanceof Error ? cause.message : "Unable to upscale sprite.");
      setPhase("error");
    });
    return () => { mounted = false; };
  }, [upscalePromise]);

  async function retryUpscale() {
    setPhase("upscaling");
    setError(null);
    try {
      const { requestId: generatedId, primaryPrompt: defaultPrompt, invariantsPrompt: defaultInvariantsPrompt } = await postJson<{ requestId: string; primaryPrompt: string; invariantsPrompt: string }>("/api/content/sprite-library/masks/upscale", { path: sourcePath });
      setRequestId(generatedId);
      setPrimaryPrompt(defaultPrompt);
      setInvariantsPrompt(defaultInvariantsPrompt);
      setPhase("upscaled");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to upscale sprite.");
      setPhase("error");
    }
  }

  async function generateMasks() {
    if (!requestId) return;
    setGenerationAttempted(true);
    setPhase("generatingInvariants");
    setError(null);
    setPrimaryReady(false);
    setInvariantsReady(false);
    let invariantsGenerated = false;
    try {
      await postJson("/api/content/sprite-library/masks/generate", { path: sourcePath, requestId, kind: "invariants", prompt: invariantsPrompt });
      setInvariantsRevision((revision) => revision + 1);
      setInvariantsReady(true);
      invariantsGenerated = true;
      setPhase("generating");
      await postJson("/api/content/sprite-library/masks/generate", { path: sourcePath, requestId, kind: "primary", prompt: primaryPrompt });
      setMaskRevision((revision) => revision + 1);
      setPrimaryReady(true);
      setPhase("ready");
    } catch (cause) {
      setError(`${invariantsGenerated ? "Primary" : "Invariant"} mask: ${cause instanceof Error ? cause.message : "Unable to generate mask."}`);
      setPhase(invariantsGenerated ? "ready" : "upscaled");
    }
  }

  async function saveMasks() {
    if (!requestId || !primaryReady || !invariantsReady) return;
    setPhase("saving");
    setError(null);
    try {
      await postJson("/api/content/sprite-library/masks/publish", { path: sourcePath, requestId, primaryOpacity, secondaryOpacity, secondaryBrightnessThreshold });
      onSaved();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save sprite and colors.");
      setPhase("ready");
    }
  }

  const upscaledUrl = requestId ? candidateUrl(sourcePath, requestId, "upscaled") : null;
  const grayUpscaledUrl = requestId ? candidateUrl(sourcePath, requestId, "gray-upscaled") : null;
  const grayUrl = requestId ? candidateUrl(sourcePath, requestId, "gray") : null;
  const primaryUrl = requestId && primaryReady ? candidateUrl(sourcePath, requestId, "primary-upscaled", maskRevision) : null;
  const savedPrimaryUrl = requestId && primaryReady ? candidateUrl(sourcePath, requestId, "primary", maskRevision) : null;
  const invariantsUrl = requestId && invariantsReady ? candidateUrl(sourcePath, requestId, "invariants-upscaled", invariantsRevision) : null;
  const savedInvariantsUrl = requestId && invariantsReady ? candidateUrl(sourcePath, requestId, "invariants", invariantsRevision) : null;
  const invariantColorsUrl = requestId && invariantsReady ? candidateUrl(sourcePath, requestId, "invariant-colors-upscaled", invariantsRevision) : null;
  const savedInvariantColorsUrl = requestId && invariantsReady ? candidateUrl(sourcePath, requestId, "invariant-colors", invariantsRevision) : null;
  const busy = phase === "upscaling" || phase === "generating" || phase === "generatingInvariants" || phase === "saving";
  const canGenerate = !busy && !!requestId && !!primaryPrompt.trim() && !!invariantsPrompt.trim();

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4">
    <section aria-labelledby="generate-masks-title" aria-modal="true" className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-xl border border-slate-600 bg-slate-900 p-6 text-slate-100 shadow-2xl" role="dialog">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-cyan-300">Sprite tools</p>
          <h2 className="mt-1 text-xl font-semibold" id="generate-masks-title">Generate player color masks</h2>
          <p className="mt-2 text-sm text-slate-400">Review the enlarged sprite, generate invariant regions first, then use the remaining grayscale areas for the primary mask. Try player palettes and opacity before saving.</p>
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
          <GeneratedImage alt="Enlarged sprite proposal" failed={phase === "error"} key={upscaledUrl ?? "upscaling"} size="size-64" src={upscaledUrl} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium">Grayscale enlarged sprite</h3>
          <GeneratedImage alt="Grayscale enlarged sprite" failed={phase === "error"} key={grayUpscaledUrl ?? "grayscaling"} size="size-64" src={grayUpscaledUrl} />
        </div>
      </div>

      {requestId && <details className="mt-5 rounded border border-slate-700 bg-slate-950/40">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-200">Mask prompts</summary>
        <div className="border-t border-slate-700 p-4">
          <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="invariants-mask-prompt">Invariant mask prompt</label>
          <textarea className="min-h-56 w-full rounded border border-slate-600 bg-slate-900 p-3 font-mono text-xs text-slate-100 focus:border-cyan-400 focus:outline-none disabled:opacity-60" disabled={busy} id="invariants-mask-prompt" maxLength={10_000} onChange={(event) => setInvariantsPrompt(event.target.value)} spellCheck={false} value={invariantsPrompt} />
          <label className="mb-2 mt-5 block text-sm font-medium text-slate-300" htmlFor="primary-mask-prompt">Primary mask prompt</label>
          <textarea className="min-h-56 w-full rounded border border-slate-600 bg-slate-900 p-3 font-mono text-xs text-slate-100 focus:border-cyan-400 focus:outline-none disabled:opacity-60" disabled={busy} id="primary-mask-prompt" maxLength={10_000} onChange={(event) => setPrimaryPrompt(event.target.value)} spellCheck={false} value={primaryPrompt} />
          <p className="mt-2 text-xs text-slate-400">Prompt changes take effect when you generate both masks again.</p>
        </div>
      </details>}

      {(phase === "generating" || primaryUrl || phase === "generatingInvariants" || invariantsUrl) && <div className="mt-5 flex flex-wrap gap-5">
        {(phase === "generating" || phase === "generatingInvariants" || invariantsUrl) && <div>
          <h3 className="mb-2 text-sm font-medium">Invariant mask</h3>
          <GeneratedImage alt="Invariant mask proposal" key={phase === "generatingInvariants" ? "generating-invariants" : invariantsUrl ?? "invariants"} size="size-48" src={phase === "generatingInvariants" ? null : invariantsUrl} />
        </div>}
        {(phase === "generatingInvariants" || invariantColorsUrl) && <div>
          <h3 className="mb-2 text-sm font-medium">Invariant colors</h3>
          <GeneratedImage alt="Invariant color cutout" key={phase === "generatingInvariants" ? "generating-invariant-colors" : invariantColorsUrl ?? "invariant-colors"} size="size-48" src={phase === "generatingInvariants" ? null : invariantColorsUrl} />
        </div>}
        {(phase === "generating" || phase === "generatingInvariants" || primaryUrl) && <div>
          <h3 className="mb-2 text-sm font-medium">Primary mask</h3>
          <GeneratedImage alt="Primary mask proposal" key={phase === "generating" || phase === "generatingInvariants" ? "generating-primary" : primaryUrl ?? "primary"} size="size-48" src={phase === "generating" || phase === "generatingInvariants" ? null : primaryUrl} />
        </div>}
      </div>}

      {phase === "generating" && <p aria-live="polite" className="mt-5 text-sm text-cyan-300">Generating primary mask with GPT Image 2.5 Sunburst…</p>}
      {phase === "generatingInvariants" && <p aria-live="polite" className="mt-5 text-sm text-cyan-300">Generating invariant mask with GPT Image 2.5 Sunburst…</p>}
      {primaryUrl && <div className="mt-6 border-t border-slate-700 pt-5">
        <h3 className="text-base font-medium">Spot check player colors</h3>
        <div className="mt-3 flex gap-2">
          {(["upscaled", "published"] as const).map((choice) => <button aria-pressed={previewSprite === choice} className={`rounded border px-3 py-1.5 text-sm ${previewSprite === choice ? "border-cyan-400 bg-cyan-400/10" : "border-slate-600"}`} key={choice} onClick={() => setPreviewSprite(choice)} type="button">{choice === "upscaled" ? "Upscaled reference" : "Published size (saved result)"}</button>)}
        </div>
        <div className="mt-3 flex flex-wrap gap-5">
          <div className="grid size-72 place-items-center rounded border border-slate-700 bg-[linear-gradient(45deg,#182235_25%,transparent_25%,transparent_75%,#182235_75%)] bg-[length:20px_20px]">
            <MaskedSpritePreview baseUrl={previewSprite === "upscaled" ? grayUpscaledUrl! : grayUrl!} className="size-full" invariantColorsUrl={previewSprite === "upscaled" ? invariantColorsUrl : savedInvariantColorsUrl} invariantsMaskUrl={previewSprite === "upscaled" ? invariantsUrl : savedInvariantsUrl} palette={palette} primaryMaskUrl={previewSprite === "upscaled" ? primaryUrl : savedPrimaryUrl!} primaryOpacity={primaryOpacity} secondaryOpacity={secondaryOpacity} secondaryBrightnessThreshold={secondaryBrightnessThreshold} showPrimary={visibleMasks !== "secondary"} showSecondary={visibleMasks !== "primary"} />
          </div>
          <div className="min-w-56 flex-1">
            <p className="mb-2 text-sm text-slate-300">Layers</p>
            <div className="flex gap-2">
              {(["both", "primary", "secondary"] as const).map((choice) => <button aria-pressed={visibleMasks === choice} className={`rounded border px-3 py-1.5 text-sm capitalize ${visibleMasks === choice ? "border-cyan-400 bg-cyan-400/10" : "border-slate-600"}`} key={choice} onClick={() => setVisibleMasks(choice)} type="button">{choice}</button>)}
            </div>
            <label className="mb-2 mt-5 flex items-center justify-between text-sm text-slate-300" htmlFor="primary-opacity"><span>Primary opacity</span><span>{Math.round(primaryOpacity * 100)}%</span></label>
            <input className="w-full accent-cyan-400" id="primary-opacity" max="1" min="0" onChange={(event) => setPrimaryOpacity(Number(event.target.value))} step="0.05" type="range" value={primaryOpacity} />
            <label className="mb-2 mt-5 flex items-center justify-between text-sm text-slate-300" htmlFor="secondary-opacity"><span>Secondary opacity</span><span>{Math.round(secondaryOpacity * 100)}%</span></label>
            <input className="w-full accent-cyan-400" id="secondary-opacity" max="1" min="0" onChange={(event) => setSecondaryOpacity(Number(event.target.value))} step="0.05" type="range" value={secondaryOpacity} />
            <label className="mb-2 mt-5 flex items-center justify-between text-sm text-slate-300" htmlFor="secondary-brightness-threshold"><span>Secondary brightness threshold</span><span>{Math.round(secondaryBrightnessThreshold * 100)}%</span></label>
            <input className="w-full accent-cyan-400" id="secondary-brightness-threshold" max={MAX_SECONDARY_BRIGHTNESS_THRESHOLD} min="0" onChange={(event) => setSecondaryBrightnessThreshold(Number(event.target.value))} step="0.05" type="range" value={secondaryBrightnessThreshold} />
            <p className="mt-1 text-xs text-slate-400">Higher values keep secondary color on brighter areas. Pixels fade in over the next 15% of brightness; 0% covers all unselected pixels.</p>
            <p className="mt-2 text-xs text-slate-400">Primary regions stay clear of secondary color, even when primary opacity is lowered.</p>
            <p className="mt-2 text-xs text-slate-400">Invariant regions stay clear of both player colors.</p>
            <p className="mb-2 mt-5 text-sm text-slate-300">Player palettes</p>
            <div className="grid grid-cols-4 gap-2">
              {PLAYER_PALETTES.map((item) => <button aria-label={`Preview ${item.name} player colors`} aria-pressed={palette.id === item.id} className={`flex items-center justify-center gap-1.5 rounded border px-2 py-3 ${palette.id === item.id ? "border-cyan-400 bg-cyan-400/10" : "border-slate-600 hover:border-cyan-400"}`} key={item.id} onClick={() => setPaletteId(item.id)} title={item.name} type="button"><span className="size-5 rounded-full" style={{ backgroundColor: item.primary }} /><span className="size-5 rounded-full" style={{ backgroundColor: item.secondary }} /></button>)}
            </div>
          </div>
        </div>
      </div>}

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-5">
        <button className="rounded border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800" onClick={onClose} type="button">Cancel</button>
        {phase === "error" && <button className="rounded border border-cyan-400 px-4 py-2 text-sm font-medium text-cyan-300" onClick={retryUpscale} type="button">Retry upscale</button>}
        {requestId && !busy && <button className="rounded border border-cyan-400 px-4 py-2 text-sm font-medium text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50" disabled={!canGenerate} onClick={generateMasks} type="button">{generationAttempted ? "Re-generate masks" : "Generate masks"}</button>}
        {primaryReady && invariantsReady && !busy && <button className="rounded bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950" onClick={saveMasks} type="button">Save sprite and colors</button>}
        {phase === "saving" && <span className="self-center text-sm text-cyan-300">Saving sprite and colors…</span>}
      </div>
      <p className="mt-3 text-xs text-slate-500">Saving keeps idle.png as the color reference and publishes gray.png, primary.png, invariants.png, invariant-colors.png, both color opacities, and the secondary brightness threshold. Check both preview sizes before saving.</p>
    </section>
  </div>;
}
