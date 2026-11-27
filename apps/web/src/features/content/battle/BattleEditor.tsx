"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { v4 as newId } from "uuid";
import ContentNavigation from "../components/ContentNavigation";
import BattleBoard from "./BattleBoard";
import BattleReplay from "./BattleReplay";
import VariantInspector from "./VariantInspector";
import { CLOSE_BOUNDS, DEFAULT_BOUNDS, MAX_RANGE, MAX_UNITS, TEAM_LABEL, battleRequest, fits, normalizedName, readNumber, readSetups, validateDraft, writeSetups,
  type Bounds, type Catalog, type Draft, type Placement, type Point, type Setup, type Team, type Variant } from "./model";
import { useBattleRun } from "./useBattleRun";

const PANEL = "space-y-3 rounded border border-slate-700 bg-slate-900 p-3";
const BUTTON = "rounded border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm hover:border-cyan-400 disabled:opacity-40";
const FIELD = "rounded border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm";
const EMPTY_UNITS: Catalog["units"] = [];
type Working = { catalog: Catalog; draft: Draft; baseline: string };

// Same-document Back/Forward can unmount this route without a beforeunload event.
// Keep only the dirty draft in this tab's module; named setups are the durable store.
let unsavedInTab: Working | null = null;

export default function BattleEditor() {
  const [working, setWorking] = useState<Working | null>(() => unsavedInTab);
  const [catalogPending, setCatalogPending] = useState(() => !unsavedInTab);
  const catalogOperation = useRef<AbortController | null>(null);
  const [alert, setAlert] = useState("");
  const [notice, setNotice] = useState(() => unsavedInTab ? "Restored this tab’s unsaved setup." : "");
  const [setups, setSetups] = useState<Setup[]>([]);
  const [savedName, setSavedName] = useState("");
  const [saveName, setSaveName] = useState("");
  const [team, setTeam] = useState<Team>("a");
  const [query, setQuery] = useState("");
  const [typeId, setTypeId] = useState("");
  const [placementVariant, setPlacementVariant] = useState("");
  const [selected, setSelected] = useState("");
  const { view, go, retry, reset } = useBattleRun((draft, error) => {
    setWorking(current => current && { ...current, draft });
    setAlert(error ?? "");
  });
  const locked = view.kind !== "edit";
  const editorBusy = locked || catalogPending;
  const draft = working?.draft;
  const catalogUnits = working?.catalog.units ?? EMPTY_UNITS;
  const units = useMemo(() => new Map(catalogUnits.map(unit => [unit.id, unit])), [catalogUnits]);
  const dirty = working !== null && JSON.stringify(working.draft) !== working.baseline;

  const loadCatalog = useCallback(async (setup?: Setup, initial = false) => {
    catalogOperation.current?.abort();
    const controller = new AbortController();
    catalogOperation.current = controller;
    setCatalogPending(true);
    if (!initial) setAlert("");
    setNotice("");
    try {
      const catalog = await battleRequest<Catalog>(setup ? `/catalog?revision=${setup.draft.revision}` : "/catalog", {
        method: setup ? "GET" : "POST", signal: controller.signal,
      });
      if (catalogOperation.current !== controller) return;
      const draft: Draft = setup?.draft ?? { version: 1, revision: catalog.revision, bounds: DEFAULT_BOUNDS, placements: [], variants: [] };
      const problem = validateDraft(draft, catalog);
      if (problem) throw new Error(problem);
      setWorking({ catalog, draft, baseline: JSON.stringify(draft) });
      setSaveName(setup?.name ?? "");
      setSelected("");
      setTeam("a");
      setQuery("");
      setPlacementVariant("");
      setTypeId(catalog.units.find(u => u.id === "fighter_v1" && !u.unavailable)?.id ?? catalog.units.find(u => !u.unavailable)?.id ?? "");
      setNotice(setup ? `Opened ${setup.name} at its pinned revision.` : "Pinned current authored content for a new setup.");
    } catch (error) {
      if (catalogOperation.current === controller) {
        setAlert(`${setup ? `Could not reopen “${setup.name}” at ${setup.draft.revision}. ` : ""}${error instanceof Error ? error.message : "Catalog unavailable. Retry."}`);
      }
    } finally {
      if (catalogOperation.current === controller) {
        catalogOperation.current = null;
        setCatalogPending(false);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    // Strict Mode's discarded mount must not start a second capture.
    queueMicrotask(() => { if (mounted && !unsavedInTab && !catalogOperation.current) void loadCatalog(undefined, true); });
    try { setSetups(readSetups()); }
    catch (error) { setAlert((error as Error).message); }
    return () => {
      mounted = false;
      catalogOperation.current?.abort();
      catalogOperation.current = null;
    };
  }, [loadCatalog]);

  useEffect(() => {
    unsavedInTab = dirty ? working : null;
  }, [dirty, working]);

  useEffect(() => {
    if (!dirty) return;
    function warn(event: BeforeUnloadEvent) { event.preventDefault(); event.returnValue = ""; }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function confirmLeave() {
    return !dirty || window.confirm("Discard unsaved battle setup changes?");
  }

  function change(next: Draft) {
    if (!working || editorBusy) return false;
    const error = validateDraft(next, working.catalog);
    if (error) { setAlert(error); return false; }
    setWorking({ ...working, draft: next });
    setAlert("");
    setNotice("");
    return true;
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!working || editorBusy) return;
    try {
      const name = normalizedName(saveName);
      const problem = validateDraft(working.draft, working.catalog);
      if (problem) throw new Error(problem);
      const previous = readSetups();
      if (previous.some(s => s.name === name) && !window.confirm(`Overwrite saved setup “${name}”?`)) return;
      const entries = [...previous.filter(s => s.name !== name), { name, draft: working.draft }].sort((a, b) => a.name.localeCompare(b.name));
      writeSetups(entries);
      setWorking({ ...working, baseline: JSON.stringify(working.draft) });
      setSetups(entries);
      setSaveName(name);
      setSavedName(name);
      setAlert("");
      setNotice(`Saved “${name}” in this browser. Live content was not changed.`);
    } catch (error) { setAlert((error as Error).message); }
  }

  function open() {
    if (locked || !savedName || !confirmLeave()) return;
    try {
      const setup = readSetups().find(s => s.name === savedName);
      if (!setup) throw new Error(`Saved setup “${savedName}” is no longer in this browser.`);
      void loadCatalog(setup);
    } catch (error) { setAlert((error as Error).message); }
  }

  function deleteSetup() {
    if (editorBusy || !savedName || !window.confirm(`Delete saved setup “${savedName}” from this browser?`)) return;
    try {
      const entries = readSetups().filter(s => s.name !== savedName);
      writeSetups(entries);
      setSetups(entries);
      setSavedName("");
      setAlert("");
      setNotice("Saved setup deleted. The current draft is unchanged.");
    } catch (error) { setAlert((error as Error).message); }
  }

  function resize(bounds: Bounds) {
    if (!draft) return;
    const stranded = draft.placements.flatMap((p, i) => fits(bounds, p, units.get(p.type_id)!.hull_radius) ? [] : [`${TEAM_LABEL[p.team]} ${p.type_id} #${i + 1}`]);
    if (stranded.length) {
      setAlert(`Arena unchanged: ${stranded.join(", ")} would not fit. Move or remove these units, or choose larger bounds.`);
      return;
    }
    change({ ...draft, bounds });
  }

  const found = catalogUnits.filter(unit => unit.id.includes(query.trim().toLowerCase().replaceAll(" ", "_")));
  const paletteUnit = found.find(unit => unit.id === typeId);
  const palette = paletteUnit && !paletteUnit.unavailable && !!draft && draft.placements.length < MAX_UNITS ? { unit: paletteUnit, team } : null;
  function place(point: Point) {
    if (!draft || !palette) return;
    if (!fits(draft.bounds, point, palette.unit.hull_radius)) {
      setAlert(`Cannot place ${typeId}: its whole hull must fit inside the arena.`);
      return;
    }
    const placement: Placement = { id: newId(), team, type_id: typeId, ...point, variant_id: placementVariant || undefined };
    if (change({ ...draft, placements: [...draft.placements, placement] })) setSelected(placement.id);
  }

  function updatePlacement(id: string, patch: Partial<Placement>) {
    if (draft) change({ ...draft, placements: draft.placements.map(p => p.id === id ? { ...p, ...patch } : p) });
  }

  const selection = draft?.placements.find(p => p.id === selected);
  const selectionUnit = selection ? units.get(selection.type_id) : undefined;
  const hasTeams = !!draft && ["a", "b"].every(team => draft.placements.some(p => p.team === team));
  const goWhy = !draft ? "Pin a content revision before starting." : !hasTeams ? "Place at least one unit on both teams before starting." : null;
  const teamVariants = draft?.variants.filter(v => v.type_id === typeId) ?? [];
  const paletteSpeed = teamVariants.find(v => v.id === placementVariant)?.speed ?? paletteUnit?.speed ?? 0;
  const strategy = paletteUnit?.combat?.on_near_enemy_strategy;
  const behavior = !paletteUnit?.combat?.attacks.length ? "Does not attack"
    : strategy === "flee" ? "Flees without firing"
    : strategy === "approach" && paletteSpeed > 0 ? "Pursues and attacks"
    : "Attacks in place";

  function addVariant() {
    if (!draft || !selection || draft.variants.length >= MAX_UNITS) return;
    const v: Variant = { id: newId(), name: `${selection.type_id.slice(0, 48)} variant ${draft.variants.length + 1}`, type_id: selection.type_id, weapons: [] };
    change({ ...draft, variants: [...draft.variants, v], placements: draft.placements.map(p => p.id === selection.id ? { ...p, variant_id: v.id } : p) });
  }

  function removeVariant(variant: Variant) {
    if (!draft || !window.confirm(`Remove “${variant.name}”? Its units will use the shipped base.`)) return;
    if (change({ ...draft, variants: draft.variants.filter(v => v.id !== variant.id),
      placements: draft.placements.map(p => p.variant_id === variant.id ? { ...p, variant_id: undefined } : p) })) {
      if (placementVariant === variant.id) setPlacementVariant("");
    }
  }

  function coordinateForm(event: FormEvent<HTMLFormElement>, apply: (point: Point) => void) {
    event.preventDefault();
    const entries = new FormData(event.currentTarget);
    try { apply({ x: readNumber(String(entries.get("x") ?? ""), "X", -MAX_RANGE, MAX_RANGE), y: readNumber(String(entries.get("y") ?? ""), "Y", -MAX_RANGE, MAX_RANGE) }); }
    catch (error) { setAlert((error as Error).message); }
  }

  return <main className="min-h-screen bg-slate-950 p-4 text-slate-100">
    <div className="mx-auto max-w-[105rem] space-y-4">
      <ContentNavigation active="battle" confirmLeave={() => {
        if (!confirmLeave()) return false;
        unsavedInTab = null;
        return true;
      }} />
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Battle Sandbox</h1>
          <p className="text-sm text-slate-300">Autonomous combat in an isolated runner. Sandbox changes never publish to the live game.</p>
          {draft && <p className="mt-1 break-all font-mono text-xs text-slate-400">Pinned revision: {draft.revision}</p>}
        </div>
        {locked ? <button type="button" className={BUTTON} onClick={reset}>Reset to setup</button>
          : <div className="flex flex-col items-end gap-1">
            <button type="button" disabled={!!goWhy || catalogPending} className="rounded bg-cyan-700 px-7 py-2 font-semibold hover:bg-cyan-600 disabled:opacity-40" onClick={() => {
              if (draft && !goWhy && !editorBusy) { setAlert(""); setNotice(""); void go(draft); }
            }}>Go</button>
            <span className="text-xs text-slate-400">{catalogPending ? "Waiting for pinned content." : goWhy ?? "Run the current draft, including unsaved edits."}</span>
          </div>}
      </header>
      {!locked && alert && <p role="alert" className="rounded border border-red-800 bg-red-950 p-3 text-sm text-red-100">{alert}</p>}
      {!locked && !alert && notice && <p role="status" className="text-sm text-cyan-200">{notice}</p>}
      {!locked && catalogPending && <p role="status" className="text-sm text-slate-300">Loading pinned content…</p>}
      {!locked && <section className={`${PANEL} flex flex-wrap items-end gap-x-3`}>
        <form onSubmit={save} className="flex flex-wrap items-end gap-2">
          <label className="text-sm">Setup name {dirty && <span className="text-amber-300">· Unsaved</span>}
            <input className={`${FIELD} block`} placeholder="Name this setup" value={saveName} maxLength={64} onChange={e => setSaveName(e.target.value)} required />
          </label>
          <button className={BUTTON} disabled={!draft || editorBusy}>Save setup</button>
        </form>
        <label className="text-sm">Saved setups in this browser
          <select className={`${FIELD} block max-w-64`} value={savedName} onChange={e => setSavedName(e.target.value)}>
            <option value="">Choose a setup</option>
            {setups.map(s => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
        </label>
        <button type="button" className={BUTTON} disabled={!savedName} onClick={open}>Open setup</button>
        <button type="button" className={BUTTON} disabled={!savedName || editorBusy} onClick={deleteSetup}>Delete saved setup</button>
        <button type="button" className={BUTTON} disabled={catalogPending} onClick={() => { if (confirmLeave()) void loadCatalog(); }}>New setup · pin current content</button>
      </section>}
      {locked && view.kind !== "replay" && <section className={PANEL}>
        {view.kind === "submitting" && <p role="status">Submitting frozen draft…</p>}
        {view.kind === "pending" && <p role="status">Run accepted · simulation pending <span className="block font-mono text-xs">{view.id}</span></p>}
        {view.kind === "loading" && <><p role="status">Run accepted · preparing replay</p><progress aria-label="Replay pages loaded" max={view.total} value={view.loaded} /></>}
        {view.kind === "check" && <><p role="alert" className="text-red-200">{view.error}</p><button type="button" className={BUTTON} onClick={retry}>Check this run again</button></>}
        <p className="text-sm text-slate-400">Reset returns to your unchanged draft. Playback does not control the simulation.</p>
      </section>}
      {draft && view.kind === "replay" && <BattleReplay key={view.id} draft={draft} units={units} ready={view.ready} frames={view.frames} />}
      {draft && view.kind !== "replay" && <div className={`grid gap-4 ${locked ? "" : "xl:grid-cols-[16rem_minmax(0,1fr)_20rem]"}`}>
        {!locked && <fieldset disabled={editorBusy} className={PANEL}>
          <legend className="sr-only">Deployment palette</legend>
          <h2 className="font-semibold">Deploy</h2>
          <label className="block text-sm">Team
            <select className={`${FIELD} block w-full`} value={team} onChange={e => setTeam(e.target.value as Team)}>
              <option value="a">Team A · cyan</option><option value="b">Team B · gold</option>
            </select>
          </label>
          <label className="block text-sm">Search unit types
            <input className={`${FIELD} block w-full`} value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. kinetic fighter" />
          </label>
          <label className="block text-sm">Unit type
            <select className={`${FIELD} block w-full`} value={paletteUnit?.id ?? ""} onChange={e => { setTypeId(e.target.value); setPlacementVariant(""); }}>
              <option value="" disabled>{found.length ? "Choose a unit" : "No matching types"}</option>
              {found.map(u => <option key={u.id} value={u.id}>{u.id}{u.unavailable ? " (unavailable)" : ""}</option>)}
            </select>
          </label>
          {paletteUnit && <p className="text-xs text-slate-300">{paletteUnit.unavailable ?? `${behavior} · ${paletteUnit.targetable ? "Targetable" : "Not targetable"} · Hull radius ${paletteUnit.hull_radius} world units.`}</p>}
          <label className="block text-sm">Deployment variant
            <select className={`${FIELD} block w-full`} value={placementVariant} onChange={e => setPlacementVariant(e.target.value)}>
              <option value="">Shipped base</option>{teamVariants.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </label>
          <p className="text-xs text-slate-400">Click open space to place, or enter coordinates. Drag a hull to move it. {draft.placements.length}/{MAX_UNITS} units; overlapping hulls are allowed.</p>
          <form noValidate key={`${team}:${draft.bounds.width}:${draft.bounds.height}`} onSubmit={e => coordinateForm(e, place)} className="grid grid-cols-2 gap-2">
            <label className="text-sm">Place X<input name="x" type="number" step="any" className={`${FIELD} block w-full`} defaultValue={Math.min(900, draft.bounds.width * 0.22) * (team === "a" ? -1 : 1)} /></label>
            <label className="text-sm">Place Y<input name="y" type="number" step="any" className={`${FIELD} block w-full`} defaultValue={0} /></label>
            <button className={`${BUTTON} col-span-2`} disabled={!palette}>Place at coordinates</button>
          </form>
        </fieldset>}
        <section className="space-y-3">
          {!locked && <form noValidate key={`${draft.bounds.width}:${draft.bounds.height}`} className="flex flex-wrap items-end gap-2" onSubmit={e => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            try { resize({ width: readNumber(String(data.get("width")), "Arena width", 1, MAX_RANGE), height: readNumber(String(data.get("height")), "Arena height", 1, MAX_RANGE) }); }
            catch (error) { setAlert((error as Error).message); }
          }}>
            <label className="text-sm">Arena width<input name="width" type="number" step="any" className={`${FIELD} block w-28`} disabled={editorBusy} defaultValue={draft.bounds.width} /></label>
            <label className="text-sm">Arena height<input name="height" type="number" step="any" className={`${FIELD} block w-28`} disabled={editorBusy} defaultValue={draft.bounds.height} /></label>
            <button className={BUTTON} disabled={editorBusy}>Resize arena</button>
            <button type="button" className={BUTTON} disabled={editorBusy} onClick={() => resize(CLOSE_BOUNDS)}>Close Quarters · 500 × 500</button>
          </form>}
          <BattleBoard key={draft.revision} draft={draft} units={units} selected={selected} tools={editorBusy ? undefined : {
            place, move: (id, position) => updatePlacement(id, position), select: setSelected, palette,
          }} />
          <p className="text-xs text-slate-300">World units, centered at (0, 0); +Y points down. Hulls stop at the wall; kinetic shots end at the wall or their travel limit. Lasers hit instantly. Acquisition, firing and projectile travel ranges are independent. Try starts within 2,000 world units for fighters and closer for shorter-range units.</p>
        </section>
        {!locked && <fieldset disabled={editorBusy} className={PANEL}>
          <legend className="sr-only">Placement roster and inspector</legend>
          <h2 className="font-semibold">Placement roster</h2>
          {draft.placements.length === 0 ? <p className="text-sm text-slate-400">No units yet. Use the palette to deploy both teams.</p>
            : <ul className="max-h-44 space-y-1 overflow-auto">{draft.placements.map((p, i) => <li key={p.id}>
              <button type="button" aria-pressed={selected === p.id} className="w-full rounded border border-slate-700 px-2 py-1 text-left text-sm aria-pressed:border-cyan-400" onClick={() => setSelected(p.id)}>
                {TEAM_LABEL[p.team]} · {p.type_id} #{i + 1}
                <span className="block text-xs text-slate-400">({p.x.toFixed(2)}, {p.y.toFixed(2)}){p.variant_id && ` · ${draft.variants.find(v => v.id === p.variant_id)?.name}`}</span>
              </button>
            </li>)}</ul>}
          {selection && selectionUnit && <>
            <form noValidate key={`${selection.id}:${selection.x}:${selection.y}`} className="grid grid-cols-2 gap-2" onSubmit={e => coordinateForm(e, point => updatePlacement(selection.id, point))}>
              <label className="text-sm">Move X<input name="x" type="number" step="any" className={`${FIELD} block w-full`} defaultValue={selection.x} /></label>
              <label className="text-sm">Move Y<input name="y" type="number" step="any" className={`${FIELD} block w-full`} defaultValue={selection.y} /></label>
              <button className={BUTTON}>Move unit</button>
              <button type="button" className={BUTTON} onClick={() => {
                if (change({ ...draft, placements: draft.placements.filter(p => p.id !== selection.id) })) setSelected("");
              }}>Remove unit</button>
            </form>
            <label className="block text-sm">Placement team
              <select value={selection.team} className={`${FIELD} block w-full`} onChange={e => updatePlacement(selection.id, { team: e.target.value as Team })}>
                <option value="a">Team A</option><option value="b">Team B</option>
              </select>
            </label>
            <VariantInspector key={selection.id} draft={draft} placement={selection} unit={selectionUnit} create={addVariant}
              attach={variant_id => updatePlacement(selection.id, { variant_id: variant_id || undefined })} remove={removeVariant} error={setAlert}
              update={variant => change({ ...draft, variants: draft.variants.map(v => v.id === variant.id ? variant : v) })} />
          </>}
        </fieldset>}
      </div>}
    </div>
  </main>;
}
