"use client";

import Link from "next/link";
import { useState } from "react";

type Sprite = { path: string; width: number | null; height: number | null };

function spriteUrl(relativePath: string) {
  return `/assets/${relativePath.split("/").map(encodeURIComponent).join("/")}`;
}

function resolution(sprite: Sprite) {
  return sprite.width && sprite.height ? `${sprite.width} × ${sprite.height} px` : "Unavailable";
}

export default function SpriteCatalog({ sprites, initialPath }: { sprites: Sprite[]; initialPath?: string }) {
  const [selectedPath, setSelectedPath] = useState(
    initialPath && sprites.some((sprite) => sprite.path === initialPath) ? initialPath : sprites[0]?.path ?? "",
  );
  const selected = sprites.find((sprite) => sprite.path === selectedPath) ?? sprites[0];

  function selectSprite(relativePath: string) {
    setSelectedPath(relativePath);
    const url = new URL(window.location.href);
    url.searchParams.set("sprite", relativePath);
    window.history.replaceState(null, "", url);
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
                    <img alt="" className="size-10 shrink-0 object-contain" src={spriteUrl(sprite.path)} />
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
        <div className="mt-6 grid size-72 place-items-center rounded-lg border border-slate-700 bg-[linear-gradient(45deg,#182235_25%,transparent_25%,transparent_75%,#182235_75%),linear-gradient(45deg,#182235_25%,transparent_25%,transparent_75%,#182235_75%)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]">
          <img alt={selected.path} className="size-full object-contain" src={spriteUrl(selected.path)} />
        </div>
        <p className="mt-5 text-sm text-slate-300">Resolution: {resolution(selected)}</p>
        <p className="mt-2 break-all font-mono text-xs text-slate-400">{selected.path}</p>
      </>}
    </aside>
  </main>;
}
