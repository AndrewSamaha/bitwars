"use client";

export type SpriteFrontChoice = "top" | "right" | "bottom" | "left";

export type SpriteSizeOption = {
  value: string | number;
  imageUrl: string;
  label: string;
  detail?: string;
  disabled?: boolean;
  onLoad?: (image: HTMLImageElement) => void;
};

export function SpriteSizeChoices({ options, onSelect, selectedValue }: { options: SpriteSizeOption[]; onSelect: (value: SpriteSizeOption["value"]) => void; selectedValue?: SpriteSizeOption["value"] | null }) {
  return <div className="mt-6 grid gap-4 sm:grid-cols-3">
    {options.map((option) => <button aria-pressed={selectedValue === undefined ? undefined : selectedValue === option.value} className={`flex flex-col items-center rounded-lg border bg-slate-950 p-4 text-left hover:border-cyan-400 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-cyan-400 disabled:cursor-default disabled:hover:bg-slate-950 ${selectedValue === option.value ? "border-cyan-400 ring-2 ring-cyan-400/30" : "border-slate-600 disabled:hover:border-slate-600"}`} disabled={option.disabled} key={option.value} onClick={() => onSelect(option.value)} type="button">
      <span className="grid size-48 place-items-center rounded bg-[linear-gradient(45deg,#182235_25%,transparent_25%,transparent_75%,#182235_75%),linear-gradient(45deg,#182235_25%,transparent_25%,transparent_75%,#182235_75%)] bg-[length:20px_20px] bg-[position:0_0,10px_10px]">
        <img alt="" className="size-48 object-contain" height={192} onLoad={option.onLoad ? (event) => option.onLoad?.(event.currentTarget) : undefined} src={option.imageUrl} width={192} />
      </span>
      <span className="mt-3 text-sm font-medium">{option.label}</span>
      {option.detail && <span className="text-xs text-slate-400">{option.detail}</span>}
    </button>)}
  </div>;
}

export function SpriteFrontChoices({ sourceUrl, previewUrl, selectedFront, onSelect, savedSizeLabel }: {
  sourceUrl: string;
  previewUrl: (front: SpriteFrontChoice) => string;
  selectedFront: SpriteFrontChoice | null;
  onSelect: (front: SpriteFrontChoice) => void;
  savedSizeLabel: string;
}) {
  const frontButtonClass = (front: SpriteFrontChoice) => `rounded px-3 py-1 text-sm ${selectedFront === front ? "bg-cyan-400 text-slate-950" : "border border-slate-600 hover:border-cyan-400"}`;
  return <div className="mt-6 flex flex-wrap items-center justify-center gap-8">
    <div>
      <p className="mb-3 text-center text-sm text-slate-300">Source: choose its front</p>
      <div className="grid grid-cols-[5rem_12rem_5rem] grid-rows-[2.5rem_12rem_2.5rem] items-center justify-items-center">
        <button aria-pressed={selectedFront === "top"} className={`col-start-2 row-start-1 ${frontButtonClass("top")}`} onClick={() => onSelect("top")} type="button">↑ Top</button>
        <button aria-pressed={selectedFront === "left"} className={`col-start-1 row-start-2 ${frontButtonClass("left")}`} onClick={() => onSelect("left")} type="button">← Left</button>
        <img alt="Unrotated sprite" className="col-start-2 row-start-2 size-48 rounded object-contain bg-slate-950" height={192} src={sourceUrl} width={192} />
        <button aria-pressed={selectedFront === "right"} className={`col-start-3 row-start-2 ${frontButtonClass("right")}`} onClick={() => onSelect("right")} type="button">Right →</button>
        <button aria-pressed={selectedFront === "bottom"} className={`col-start-2 row-start-3 ${frontButtonClass("bottom")}`} onClick={() => onSelect("bottom")} type="button">↓ Bottom</button>
      </div>
    </div>
    <div>
      <p className="mb-3 text-center text-sm text-slate-300">Final sprite: front faces right →</p>
      {selectedFront ? <img alt="Sprite after rotation" className="size-48 rounded object-contain bg-slate-950" height={192} src={previewUrl(selectedFront)} width={192} /> : <div className="grid size-48 place-items-center rounded border border-dashed border-slate-600 text-center text-sm text-slate-400">Choose a front to preview the saved sprite</div>}
      <p className="mt-3 text-center text-xs text-slate-400">Saved size: {savedSizeLabel}</p>
    </div>
  </div>;
}
