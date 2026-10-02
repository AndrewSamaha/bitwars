"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PLAYER_PALETTES } from "@/lib/playerPalettes";
import { DEFAULT_PRIMARY_OPACITY, DEFAULT_SECONDARY_BRIGHTNESS_THRESHOLD, DEFAULT_SECONDARY_OPACITY, MAX_SECONDARY_BRIGHTNESS_THRESHOLD } from "@/lib/playerColorSettings";
import MaskedSpritePreview from "./MaskedSpritePreview";

type Phase = "idle" | "upscaling" | "upscaled" | "generating" | "generatingInvariants" | "ready" | "saving" | "saved" | "error";
type VisibleMasks = "both" | "primary" | "secondary";
type PreviewSprite = "upscaled" | "published";
type UpscaleResult = { requestId: string; primaryPrompt: string; invariantsPrompt: string };

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

function GeneratedImage({ src, alt, size, failed, idle }: { src: string | null; alt: string; size: "size-64" | "size-48"; failed?: boolean; idle?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const pending = !idle && !failed && !loadFailed && !loaded;

  return <div aria-busy={pending} className={`relative grid ${size} place-items-center overflow-hidden rounded border border-slate-700 bg-[linear-gradient(45deg,#182235_25%,transparent_25%,transparent_75%,#182235_75%)] bg-[length:20px_20px]`}>
    {pending && <div className="absolute inset-4 animate-pulse rounded-lg bg-slate-700/70 motion-reduce:animate-none" role="status"><span className="sr-only">Preparing {alt.toLowerCase()}…</span></div>}
    {idle && !src && <span className="px-4 text-center text-sm text-slate-400">Select Generate to start</span>}
    {src && <img alt={alt} className={`size-full object-contain ${loaded ? "" : "invisible"}`} onError={() => setLoadFailed(true)} onLoad={() => setLoaded(true)} src={src} />}
    {(failed || loadFailed) && <span className="px-4 text-center text-sm text-slate-400">Image unavailable</span>}
  </div>;
}

export default function MaskGenerationDialog({ sourcePath, sourceUrl, onClose, onSaved }: {
  sourcePath: string;
  sourceUrl: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [includeInvariants, setIncludeInvariants] = useState(true);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [primaryReady, setPrimaryReady] = useState(false);
  const [invariantsReady, setInvariantsReady] = useState(false);
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
  const upscaleInFlight = useRef(false);
  const masksInFlight = useRef(false);
  const componentActive = useRef(true);
  const saveInFlight = useRef(false);
  const savedCloseTimer = useRef<number | null>(null);
  const palette = PLAYER_PALETTES.find((item) => item.id === paletteId) ?? PLAYER_PALETTES[0];

  useEffect(() => {
    componentActive.current = true;
    return () => {
      componentActive.current = false;
      if (savedCloseTimer.current !== null) window.clearTimeout(savedCloseTimer.current);
    };
  }, []);

  const generateMasks = useCallback(async (candidateId: string, invariantPrompt: string, primaryMaskPrompt: string, useInvariants: boolean, isActive: () => boolean = () => true) => {
    if (!isActive() || masksInFlight.current) return;
    masksInFlight.current = true;
    setPhase(useInvariants ? "generatingInvariants" : "generating");
    setError(null);
    setPrimaryReady(false);
    setInvariantsReady(false);
    let invariantsGenerated = false;
    try {
      await postJson("/api/content/sprite-library/masks/generate", { path: sourcePath, requestId: candidateId, kind: "invariants", prompt: invariantPrompt, skipInvariants: !useInvariants });
      if (!isActive()) return;
      setInvariantsRevision((revision) => revision + 1);
      setInvariantsReady(true);
      invariantsGenerated = true;
      setPhase("generating");
      await postJson("/api/content/sprite-library/masks/generate", { path: sourcePath, requestId: candidateId, kind: "primary", prompt: primaryMaskPrompt });
      if (!isActive()) return;
      setMaskRevision((revision) => revision + 1);
      setPrimaryReady(true);
      setPhase("ready");
    } catch (cause) {
      if (!isActive()) return;
      setError(`${invariantsGenerated ? "Primary mask" : useInvariants ? "Invariant mask" : "Preparing transparent invariants"}: ${cause instanceof Error ? cause.message : "Unable to generate mask."}`);
      setPhase(invariantsGenerated ? "ready" : "upscaled");
    } finally {
      masksInFlight.current = false;
    }
  }, [sourcePath]);

  async function startGeneration() {
    if (upscaleInFlight.current || masksInFlight.current || saveInFlight.current) return;
    upscaleInFlight.current = true;
    setPhase("upscaling");
    setError(null);
    setRequestId(null);
    setPrimaryReady(false);
    setInvariantsReady(false);
    try {
      const { requestId: generatedId, primaryPrompt: defaultPrompt, invariantsPrompt: defaultInvariantsPrompt } = await postJson<UpscaleResult>("/api/content/sprite-library/masks/upscale", { path: sourcePath });
      if (!componentActive.current) return;
      setRequestId(generatedId);
      setPrimaryPrompt(defaultPrompt);
      setInvariantsPrompt(defaultInvariantsPrompt);
      void generateMasks(generatedId, defaultInvariantsPrompt, defaultPrompt, includeInvariants, () => componentActive.current);
    } catch (cause) {
      if (!componentActive.current) return;
      setError(cause instanceof Error ? cause.message : "Unable to upscale sprite.");
      setPhase("error");
    } finally {
      upscaleInFlight.current = false;
    }
  }

  function changeIncludeInvariants(checked: boolean) {
    setIncludeInvariants(checked);
    if (requestId) {
      setPrimaryReady(false);
      setInvariantsReady(false);
      setPhase("upscaled");
    }
  }

  async function saveMasks() {
    if (!requestId || !primaryReady || !invariantsReady || saveInFlight.current) return;
    saveInFlight.current = true;
    setPhase("saving");
    setError(null);
    try {
      await postJson("/api/content/sprite-library/masks/publish", { path: sourcePath, requestId, primaryOpacity, secondaryOpacity, secondaryBrightnessThreshold });
      if (!componentActive.current) return;
      setPhase("saved");
      savedCloseTimer.current = window.setTimeout(() => {
        savedCloseTimer.current = null;
        onClose();
        onSaved();
      }, 500);
    } catch (cause) {
      saveInFlight.current = false;
      if (!componentActive.current) return;
      setError(cause instanceof Error ? cause.message : "Unable to save sprite and colors.");
      setPhase("ready");
    }
  }

  function closeIfIdle() {
    if (!saveInFlight.current) onClose();
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
  const busy = phase === "upscaling" || phase === "generating" || phase === "generatingInvariants" || phase === "saving" || phase === "saved";
  const canGenerate = !busy && !!requestId && !!primaryPrompt.trim() && (!includeInvariants || !!invariantsPrompt.trim());
  const previewInvariantsUrl = includeInvariants ? (previewSprite === "upscaled" ? invariantsUrl : savedInvariantsUrl) : null;
  const previewInvariantColorsUrl = includeInvariants ? (previewSprite === "upscaled" ? invariantColorsUrl : savedInvariantColorsUrl) : null;

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4">
    <section aria-labelledby="generate-masks-title" aria-modal="true" className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-xl border border-slate-600 bg-slate-900 p-6 text-slate-100 shadow-2xl" role="dialog">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-cyan-300">Sprite tools</p>
          <h2 className="mt-1 text-xl font-semibold" id="generate-masks-title">Generate player color masks</h2>
          <p className="mt-2 text-sm text-slate-400">Select Generate to enlarge the sprite and create its masks. Review the results, then try player palettes and opacity before saving.</p>
        </div>
        <button className="rounded border border-slate-600 px-3 py-1 text-sm hover:bg-slate-800 disabled:opacity-50" disabled={phase === "saving" || phase === "saved"} onClick={closeIfIdle} type="button">Close</button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-5 rounded border border-slate-700 bg-slate-950/40 p-4">
        <button className="rounded bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy} onClick={() => void startGeneration()} type="button">{requestId ? "Generate new upscale" : "Generate"}</button>
        <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-200 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50" htmlFor="include-invariants">
          <input aria-label="Generate invariant mask" checked={includeInvariants} className="peer sr-only" disabled={busy} id="include-invariants" onChange={(event) => changeIncludeInvariants(event.target.checked)} role="switch" type="checkbox" />
          <span aria-hidden="true" className="relative h-6 w-11 rounded-full bg-slate-600 transition-colors peer-checked:bg-cyan-500 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-cyan-300 after:absolute after:left-1 after:top-1 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
          Generate invariant mask <span className="text-slate-400">{includeInvariants ? "On" : "Off"}</span>
        </label>
      </div>

      {error && <p className="mt-5 rounded border border-red-500/50 bg-red-950/40 px-4 py-3 text-sm text-red-200" role="alert">{error}</p>}
      <div className="mt-5 flex flex-wrap gap-5">
        <div>
          <h3 className="mb-2 text-sm font-medium">Original</h3>
          <div className="grid size-64 place-items-center rounded border border-slate-700 bg-[linear-gradient(45deg,#182235_25%,transparent_25%,transparent_75%,#182235_75%)] bg-[length:20px_20px]"><img alt="Original sprite" className="size-full object-contain" src={sourceUrl} /></div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium">Flare enlarged reference</h3>
          <GeneratedImage alt="Enlarged sprite proposal" failed={phase === "error"} idle={phase === "idle"} key={upscaledUrl ?? "upscaling"} size="size-64" src={upscaledUrl} />
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium">Grayscale enlarged sprite</h3>
          <GeneratedImage alt="Grayscale enlarged sprite" failed={phase === "error"} idle={phase === "idle"} key={grayUpscaledUrl ?? "grayscaling"} size="size-64" src={grayUpscaledUrl} />
        </div>
      </div>

      {requestId && <details className="mt-5 rounded border border-slate-700 bg-slate-950/40">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-slate-200">Mask prompts</summary>
        <div className="border-t border-slate-700 p-4">
          {includeInvariants && <>
            <label className="mb-2 block text-sm font-medium text-slate-300" htmlFor="invariants-mask-prompt">Invariant mask prompt</label>
            <textarea className="min-h-56 w-full rounded border border-slate-600 bg-slate-900 p-3 font-mono text-xs text-slate-100 focus:border-cyan-400 focus:outline-none disabled:opacity-60" disabled={busy} id="invariants-mask-prompt" maxLength={10_000} onChange={(event) => setInvariantsPrompt(event.target.value)} spellCheck={false} value={invariantsPrompt} />
          </>}
          <label className="mb-2 mt-5 block text-sm font-medium text-slate-300" htmlFor="primary-mask-prompt">Primary mask prompt</label>
          <textarea className="min-h-56 w-full rounded border border-slate-600 bg-slate-900 p-3 font-mono text-xs text-slate-100 focus:border-cyan-400 focus:outline-none disabled:opacity-60" disabled={busy} id="primary-mask-prompt" maxLength={10_000} onChange={(event) => setPrimaryPrompt(event.target.value)} spellCheck={false} value={primaryPrompt} />
          <p className="mt-2 text-xs text-slate-400">Prompt changes take effect when you re-generate the masks.</p>
        </div>
      </details>}

      {(phase === "generating" || primaryUrl || phase === "generatingInvariants" || invariantsUrl) && <div className="mt-5 flex flex-wrap gap-5">
        {includeInvariants && (phase === "generating" || phase === "generatingInvariants" || invariantsUrl) && <div>
          <h3 className="mb-2 text-sm font-medium">Invariant mask</h3>
          <GeneratedImage alt="Invariant mask proposal" key={phase === "generatingInvariants" ? "generating-invariants" : invariantsUrl ?? "invariants"} size="size-48" src={phase === "generatingInvariants" ? null : invariantsUrl} />
        </div>}
        {includeInvariants && (phase === "generatingInvariants" || invariantColorsUrl) && <div>
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
            <MaskedSpritePreview baseUrl={previewSprite === "upscaled" ? grayUpscaledUrl! : grayUrl!} className="size-full" invariantColorsUrl={previewInvariantColorsUrl} invariantsMaskUrl={previewInvariantsUrl} palette={palette} primaryMaskUrl={previewSprite === "upscaled" ? primaryUrl : savedPrimaryUrl!} primaryOpacity={primaryOpacity} secondaryOpacity={secondaryOpacity} secondaryBrightnessThreshold={secondaryBrightnessThreshold} showPrimary={visibleMasks !== "secondary"} showSecondary={visibleMasks !== "primary"} />
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
            {includeInvariants && <p className="mt-2 text-xs text-slate-400">Invariant regions stay clear of both player colors.</p>}
            <p className="mb-2 mt-5 text-sm text-slate-300">Player palettes</p>
            <div className="grid grid-cols-4 gap-2">
              {PLAYER_PALETTES.map((item) => <button aria-label={`Preview ${item.name} player colors`} aria-pressed={palette.id === item.id} className={`flex items-center justify-center gap-1.5 rounded border px-2 py-3 ${palette.id === item.id ? "border-cyan-400 bg-cyan-400/10" : "border-slate-600 hover:border-cyan-400"}`} key={item.id} onClick={() => setPaletteId(item.id)} title={item.name} type="button"><span className="size-5 rounded-full" style={{ backgroundColor: item.primary }} /><span className="size-5 rounded-full" style={{ backgroundColor: item.secondary }} /></button>)}
            </div>
          </div>
        </div>
      </div>}

      <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-5">
        <button className="rounded border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800 disabled:opacity-50" disabled={phase === "saving" || phase === "saved"} onClick={closeIfIdle} type="button">Cancel</button>
        {requestId && !busy && <button className="rounded border border-cyan-400 px-4 py-2 text-sm font-medium text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50" disabled={!canGenerate} onClick={() => void generateMasks(requestId, invariantsPrompt, primaryPrompt, includeInvariants, () => componentActive.current)} type="button">Re-generate masks</button>}
        {primaryReady && invariantsReady && !busy && <button className="rounded bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950" onClick={saveMasks} type="button">Save sprite and colors</button>}
        {phase === "saving" && <span className="self-center text-sm text-cyan-300">Saving sprite and colors…</span>}
        {phase === "saved" && <span aria-live="polite" className="self-center text-sm text-cyan-300">Saved. Closing…</span>}
      </div>
      <p className="mt-3 text-xs text-slate-500">Saving keeps idle.png as the color reference and publishes gray.png, primary.png, invariants.png, invariant-colors.png, both color opacities, and the secondary brightness threshold. Check both preview sizes before saving.</p>
    </section>
  </div>;
}
