"use client";

import Link from "next/link";
import { useState } from "react";
import { SpriteFrontChoices, SpriteSizeChoices, type SpriteFrontChoice } from "@/features/content/components/SpriteReviewChoices";
import { PLAYER_PALETTES, type PlayerPalette } from "@/lib/playerPalettes";
import MaskedSpritePreview from "./MaskedSpritePreview";
import MaskGenerationDialog from "./MaskGenerationDialog";

type Sprite = { path: string; width: number | null; height: number | null; hasPlayerMasks: boolean };
type Tool = "downsample" | "rotate";

function spriteUrl(relativePath: string, assetVersion?: string) {
  const url = `/assets/${relativePath.split("/").map(encodeURIComponent).join("/")}`;
  return assetVersion ? `${url}?v=${encodeURIComponent(assetVersion)}` : url;
}

function resolution(sprite: Sprite) {
  return sprite.width && sprite.height ? `${sprite.width} × ${sprite.height} px` : "Unavailable";
}

function PlayerColorPreview({ sprite, palette, assetVersion, className }: {
  sprite: Sprite;
  palette: PlayerPalette;
  assetVersion?: string;
  className: string;
}) {
  const directory = sprite.path.slice(0, sprite.path.lastIndexOf("/"));
  return <MaskedSpritePreview
    baseUrl={spriteUrl(sprite.path, assetVersion)}
    className={className}
    palette={palette}
    primaryMaskUrl={spriteUrl(`${directory}/primary.png`, assetVersion)}
    secondaryMaskUrl={spriteUrl(`${directory}/secondary.png`, assetVersion)}
  />;
}

export default function SpriteCatalog({ sprites, initialPath, assetVersion }: { sprites: Sprite[]; initialPath?: string; assetVersion?: string }) {
  const [selectedPath, setSelectedPath] = useState(
    initialPath && sprites.some((sprite) => sprite.path === initialPath) ? initialPath : sprites[0]?.path ?? "",
  );
  const [tool, setTool] = useState<Tool | null>(null);
  const [selectedSize, setSelectedSize] = useState<192 | 512 | null>(null);
  const [selectedFront, setSelectedFront] = useState<SpriteFrontChoice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maskWorkflow, setMaskWorkflow] = useState<{ path: string; sourceUrl: string; upscalePromise: Promise<{ requestId: string }> } | null>(null);
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>(PLAYER_PALETTES[0].id);
  const selected = sprites.find((sprite) => sprite.path === selectedPath) ?? sprites[0];
  const selectedPalette = PLAYER_PALETTES.find((palette) => palette.id === selectedPaletteId) ?? PLAYER_PALETTES[0];
  const availableSizes = ([192, 512] as const).filter((size) => selected && Math.max(selected.width ?? 0, selected.height ?? 0) > size);
  const canEdit = selected?.path.toLowerCase().endsWith(".png") ?? false;
  const selectedUrl = selected ? spriteUrl(selected.path, assetVersion) : "";

  function previewUrl(relativePath: string, choice: { size: 192 | 512 } | { front: SpriteFrontChoice }) {
    const params = new URLSearchParams({ path: relativePath, ...("size" in choice ? { size: String(choice.size) } : { front: choice.front }) });
    return `/api/content/sprite-library/preview?${params}`;
  }

  function selectSprite(relativePath: string) {
    setSelectedPath(relativePath);
    setTool(null);
    setError(null);
    const url = new URL(window.location.href);
    url.searchParams.set("sprite", relativePath);
    window.history.replaceState(null, "", url);
  }

  function openTool(nextTool: Tool) {
    setTool(nextTool);
    setSelectedSize(null);
    setSelectedFront(null);
    setError(null);
  }

  function startMaskWorkflow() {
    if (!selected || selected.path.split("/").length !== 2 || !selected.path.endsWith("/idle.png")) return;
    const sourcePath = selected.path;
    const promise = fetch("/api/content/sprite-library/masks/upscale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: sourcePath }),
    }).then(async (response) => {
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to upscale sprite.");
      return payload as { requestId: string };
    });
    setMaskWorkflow({ path: sourcePath, sourceUrl: spriteUrl(sourcePath, assetVersion), upscalePromise: promise });
  }

  async function saveTransform() {
    if (!selected || !tool || (tool === "downsample" && !selectedSize) || (tool === "rotate" && !selectedFront)) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/content/sprite-library/transform", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: selected.path, kind: tool, ...(tool === "downsample" ? { size: selectedSize } : { front: selectedFront }) }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to update sprite.");
      const destination = new URL("/content/sprite-library/", window.location.origin);
      destination.searchParams.set("sprite", selected.path);
      destination.searchParams.set("updated", String(Date.now()));
      window.location.assign(destination.toString());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to update sprite.");
      setBusy(false);
    }
  }

  return <main className="flex min-h-screen bg-slate-950 text-slate-100">
    <section className="min-w-0 flex-1 p-6 lg:px-10 lg:pb-10 lg:pt-6">
      <header className="mb-[18px]">
        <p className="text-sm font-medium tracking-[0.24em] text-cyan-400 uppercase">BitWars Content Editor</p>
      </header>
      <nav aria-label="Content type" className="mb-3 flex gap-1 border-b border-slate-700">
        <Link className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-cyan-300" href="/content/entities">Entities</Link>
        <Link className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-cyan-300" href="/content/techtree">Techtree</Link>
        <Link className="border-b-2 border-cyan-400 px-4 py-2 text-sm font-medium text-cyan-300" href="/content/sprite-library">Sprites</Link>
        <Link className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-cyan-300" href="/content/sfx">SFX</Link>
      </nav>
      <div className="overflow-hidden rounded-xl border border-slate-700 bg-slate-900/60 shadow-2xl shadow-black/20">
        <div className="max-h-[calc(100vh-11rem)] overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sticky top-0 bg-slate-900 text-slate-300">
              <tr><th className="px-4 py-3 font-medium" scope="col">File path</th><th className="whitespace-nowrap px-4 py-3 font-medium" scope="col">Resolution</th></tr>
            </thead>
            <tbody>
              {sprites.map((sprite) => <tr className={`border-t border-slate-800 ${selected?.path === sprite.path ? "bg-cyan-400/10" : "hover:bg-slate-800/60"}`} key={sprite.path}>
                <td className="min-w-0 px-4 py-2">
                  <button aria-pressed={selected?.path === sprite.path} className="flex min-w-0 items-center gap-3 text-left text-slate-100 hover:text-cyan-300" onClick={() => selectSprite(sprite.path)} type="button">
                    <img alt="" className="size-10 shrink-0 object-contain" src={spriteUrl(sprite.path, assetVersion)} />
                    <span className="break-all font-mono text-xs">{sprite.path}</span>
                  </button>
                </td>
                <td className="whitespace-nowrap px-4 py-2 text-slate-300">{resolution(sprite)}</td>
              </tr>)}
            </tbody>
          </table>
          {sprites.length === 0 && <p className="p-6 text-sm text-slate-400">No sprite files found in public/assets.</p>}
        </div>
      </div>
    </section>
    <aside className="w-[42rem] shrink-0 border-l border-slate-700 bg-slate-900 p-6">
      {selected && <>
        <div className="border-b border-slate-700 pb-5">
          <p className="text-sm text-slate-400">Sprite</p>
          <h1 className="mt-1 break-all font-mono text-xl font-semibold">{selected.path}</h1>
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
          <div className="grid size-72 shrink-0 place-items-center rounded-lg border border-slate-700 bg-[linear-gradient(45deg,#182235_25%,transparent_25%,transparent_75%,#182235_75%),linear-gradient(45deg,#182235_25%,transparent_25%,transparent_75%,#182235_75%)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]">
            {selected.hasPlayerMasks
              ? <PlayerColorPreview assetVersion={assetVersion} className="size-full" palette={selectedPalette} sprite={selected} />
              : <img alt={selected.path} className="size-full object-contain" src={selectedUrl} />}
          </div>
          {selected.hasPlayerMasks && <div className="min-w-0 flex-1">
            <h2 className="mb-2 text-sm font-medium text-slate-200">Player colors</h2>
            <div className="grid grid-cols-4 gap-2">
              {PLAYER_PALETTES.map((palette) => <button
                aria-label={`Preview ${palette.name} player colors`}
                aria-pressed={selectedPalette.id === palette.id}
                className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-3 hover:border-cyan-400 ${selectedPalette.id === palette.id ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700"}`}
                key={palette.id}
                onClick={() => setSelectedPaletteId(palette.id)}
                title={palette.name}
                type="button"
              >
                <span className="size-5 rounded-full" style={{ backgroundColor: palette.primary }} />
                <span className="size-5 rounded-full" style={{ backgroundColor: palette.secondary }} />
              </button>)}
            </div>
          </div>}
        </div>
        <p className="mt-5 text-sm text-slate-300">Resolution: {resolution(selected)}</p>
        <p className="mt-2 break-all font-mono text-xs text-slate-400">{selected.path}</p>
        <div className="mt-6 border-t border-slate-700 pt-5">
          <h2 className="text-sm font-medium text-slate-300">Tools</h2>
          <div className="mt-3 flex gap-3">
            <button className="rounded border border-slate-600 px-4 py-2 text-sm hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50" disabled={!canEdit || availableSizes.length === 0} onClick={() => openTool("downsample")} type="button">Downsample</button>
            <button className="rounded border border-slate-600 px-4 py-2 text-sm hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50" disabled={!canEdit} onClick={() => openTool("rotate")} type="button">Rotate</button>
            <button className="rounded border border-slate-600 px-4 py-2 text-sm hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50" disabled={!canEdit || !/^[a-z][a-z0-9_]*\/idle\.png$/.test(selected.path)} onClick={startMaskWorkflow} type="button">Generate Masks</button>
          </div>
        </div>
      </>}
    </aside>
    {selected && tool && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4">
      <section aria-labelledby="sprite-tool-title" aria-modal="true" className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-slate-600 bg-slate-900 p-6 shadow-2xl" role="dialog">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-cyan-300">Sprite tools</p>
            <h2 className="mt-1 text-xl font-semibold" id="sprite-tool-title">{tool === "downsample" ? "Choose the saved resolution" : "Choose the entity’s front"}</h2>
            <p className="mt-2 text-sm text-slate-400">{tool === "downsample" ? "All previews appear at 192 × 192. Select a smaller PNG resolution to save." : "Select the side that is the front in the current image. The saved sprite will be rotated so that side faces right."}</p>
          </div>
          <button aria-label="Close sprite tool" className="rounded border border-slate-600 px-3 py-1 text-sm hover:bg-slate-800" disabled={busy} onClick={() => setTool(null)} type="button">Close</button>
        </div>
        {error && <p className="mt-5 rounded border border-red-500/50 bg-red-950/40 px-4 py-3 text-sm text-red-200" role="alert">{error}</p>}
        {tool === "downsample" ? <SpriteSizeChoices onSelect={(size) => setSelectedSize(size as 192 | 512)} options={[
          { value: "current", imageUrl: selectedUrl, label: "Current", detail: resolution(selected), disabled: true },
          ...availableSizes.map((size) => ({ value: size, imageUrl: previewUrl(selected.path, { size }), label: `${size} × ${size} px` })),
        ]} selectedValue={selectedSize} /> : <SpriteFrontChoices onSelect={setSelectedFront} previewUrl={(front) => previewUrl(selected.path, { front })} savedSizeLabel={resolution(selected)} selectedFront={selectedFront} sourceUrl={selectedUrl} />}
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-700 pt-5">
          <button className="rounded border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800" disabled={busy} onClick={() => setTool(null)} type="button">Cancel</button>
          <button className="rounded bg-cyan-400 px-4 py-2 font-medium text-slate-950 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || (tool === "downsample" ? !selectedSize : !selectedFront)} onClick={saveTransform} type="button">{busy ? "Saving…" : tool === "downsample" ? "Save downsampled sprite" : "Save rotated sprite"}</button>
        </div>
      </section>
    </div>}
    {maskWorkflow && <MaskGenerationDialog
      onClose={() => setMaskWorkflow(null)}
      onSaved={() => {
        const destination = new URL("/content/sprite-library/", window.location.origin);
        destination.searchParams.set("sprite", maskWorkflow.path);
        destination.searchParams.set("updated", String(Date.now()));
        window.location.assign(destination.toString());
      }}
      sourcePath={maskWorkflow.path}
      sourceUrl={maskWorkflow.sourceUrl}
      upscalePromise={maskWorkflow.upscalePromise}
    />}
  </main>;
}
