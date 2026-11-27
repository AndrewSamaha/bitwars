"use client";

import { useState } from "react";
import { MAX_COOLDOWN, MAX_HP, MAX_RANGE, normalizedName, readNumber, type Draft, type Placement, type Unit, type Variant, type WeaponOverride } from "./model";

const BUTTON = "rounded border border-slate-600 px-2 py-1 text-sm hover:border-cyan-400 disabled:opacity-40";
const FIELD = "w-full rounded border border-slate-600 bg-slate-950 px-2 py-1 text-sm";

type NumberSpec = { label: string; base: number; current?: number; min: number; max: number; integer?: boolean };

function Stat({ spec, editable, change, error }: { spec: NumberSpec; editable: boolean; change: (value: number | undefined) => void; error: (message: string) => void }) {
  const { label, base, current, min, max, integer } = spec;
  const effective = current ?? base;
  const [text, setText] = useState(String(effective));
  return <div className="space-y-1">
    <label className="block text-sm">{label}
      {!editable ? <span className="block font-mono">{base}</span> : <input type="number" min={min} max={max} step={integer ? 1 : "any"}
        className={FIELD} value={text} onChange={e => setText(e.target.value)} onKeyDown={e => {
          if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
          if (e.key === "Escape") { e.preventDefault(); e.currentTarget.value = String(effective); e.currentTarget.blur(); }
        }} onBlur={e => {
          if (e.currentTarget.value === String(effective)) { setText(String(effective)); return; }
          try { change(readNumber(e.currentTarget.value, label, min, max, integer)); }
          catch (err) { error((err as Error).message); setText(String(effective)); }
        }} />}
    </label>
    {editable && <div className="flex gap-2 text-xs text-slate-400">
      <span>Base {base} · Effective {effective}</span>
      {current !== undefined && <button type="button" className="text-cyan-300 underline" aria-label={`Reset ${label}`} onClick={() => change(undefined)}>Reset</button>}
    </div>}
  </div>;
}

export default function VariantInspector({ draft, placement, unit, create, attach, update, remove, error }: {
  draft: Draft; placement: Placement; unit: Unit;
  create: () => void; attach: (variantId: string) => void; update: (variant: Variant) => void;
  remove: (variant: Variant) => void; error: (message: string) => void;
}) {
  const variant = draft.variants.find(variant => variant.id === placement.variant_id);
  const shared = variant && draft.placements.filter(p => p.variant_id === variant.id).length;
  type HullKey = "health" | "speed" | "acquisition_range";
  const hullFields: { key: HullKey; label: string; min: number; max: number; base: number }[] = [
    { key: "health", label: "Health (HP)", min: 0.01, max: MAX_HP, base: unit.health },
    { key: "speed", label: "Speed (world units/s)", min: 0, max: MAX_RANGE, base: unit.speed },
  ];
  if (unit.combat) hullFields.push({ key: "acquisition_range", label: "Acquisition range (world units)", min: 0, max: MAX_RANGE, base: unit.combat.acquisition_range });

  function weaponField(id: string, field: Exclude<keyof WeaponOverride, "id">, value: number | undefined) {
    if (!variant) return;
    const entry = { ...variant.weapons.find(w => w.id === id), id, [field]: value };
    const weapons = variant.weapons.filter(w => w.id !== id);
    if (entry.cooldown_ticks !== undefined || entry.damage !== undefined || entry.range !== undefined) weapons.push(entry);
    update({ ...variant, weapons });
  }

  return <section className="space-y-3 border-t border-slate-700 pt-3">
    <h3 className="font-semibold">Variant inspector</h3>
    <label className="block text-sm">Variant for this placement
      <select value={variant?.id ?? ""} className={FIELD} onChange={e => attach(e.target.value)}>
        <option value="">Shipped base</option>
        {draft.variants.filter(v => v.type_id === unit.id).map(v => <option value={v.id} key={v.id}>{v.name}</option>)}
      </select>
    </label>
    <button type="button" className={BUTTON} disabled={draft.variants.length >= 64} onClick={create}>Create variant from base</button>
    {variant && <div className="space-y-2">
      <label className="block text-sm">Variant name
        <input key={`${variant.id}:${variant.name}`} className={FIELD} defaultValue={variant.name} maxLength={64} onKeyDown={e => {
          if (e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
        }} onBlur={e => {
          const input = e.currentTarget;
          try { const name = normalizedName(input.value); if (name !== variant.name) update({ ...variant, name }); else input.value = name; }
          catch (err) { error((err as Error).message); input.value = variant.name; }
        }} />
      </label>
      <p className="text-xs text-slate-400">Changes apply to {shared} {shared === 1 ? "placement" : "placements"} using this variant.</p>
      <button type="button" className={BUTTON} onClick={() => remove(variant)}>Remove variant</button>
    </div>}
    {hullFields.map(({ key, ...spec }) => <Stat key={`${variant?.id}:${key}:${variant?.[key]}`} spec={{ ...spec, current: variant?.[key] }}
      editable={!!variant} error={error} change={value => { if (variant) update({ ...variant, [key]: value }); }} />)}
    {unit.combat?.attacks.map(weapon => {
      const w = variant?.weapons.find(w => w.id === weapon.id);
      const fields: { key: Exclude<keyof WeaponOverride, "id">; label: string; base: number; min: number; max: number; integer?: boolean }[] = [
        { key: "damage", label: "Damage (HP/hit)", base: weapon.damage, min: weapon.type === "kinetic" ? 0.01 : 0, max: MAX_HP },
        { key: "cooldown_ticks", label: "Cooldown (ticks)", base: Math.max(1, weapon.cooldown_ticks), min: 1, max: MAX_COOLDOWN, integer: true },
      ];
      if (weapon.type !== "dismantle") fields.push({ key: "range", label: "Firing range (world units)", base: weapon.range, min: weapon.type === "kinetic" ? 0.01 : 0, max: MAX_RANGE });
      return <fieldset key={weapon.id} className="space-y-2 rounded border border-slate-700 p-2">
        <legend className="px-1 text-sm font-medium">{weapon.id} · {weapon.type}</legend>
        {weapon.type === "dismantle" && <p className="text-xs text-slate-400">Contact: both hull radii + {Math.max(0, weapon.contact_tolerance)} world units.</p>}
        {weapon.projectile && <p className="text-xs text-slate-400">Kinetic travel limit: {weapon.projectile.max_travel_distance} world units (independent of firing range).</p>}
        {fields.map(({ key, ...spec }) => <Stat key={`${variant?.id}:${key}:${w?.[key]}`} spec={{ ...spec, current: w?.[key] }}
          editable={!!variant} error={error} change={value => weaponField(weapon.id, key, value)} />)}
      </fieldset>;
    })}
  </section>;
}
