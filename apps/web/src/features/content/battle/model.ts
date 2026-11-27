import { z } from "zod";

export const BATTLE_API = "/api/content/battle";
export const DEFAULT_BOUNDS = { width: 12_000, height: 8_000 };
export const CLOSE_BOUNDS = { width: 500, height: 500 };
export const MAX_UNITS = 64;
export const MAX_RANGE = 20_000;
export const MAX_HP = 1_000_000;
export const MAX_COOLDOWN = 2400;
export const MAX_DRAFT_BYTES = 128 * 1024;
export const TEAM_LABEL = { a: "Team A", b: "Team B" };

const id = z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/);
const typeId = z.string().regex(/^[a-z][a-z0-9_]*$/);
const name = z.string().trim().min(1).max(64).regex(/^[^\p{Cc}]*$/u);
const revision = z.string().regex(/^[0-9a-f]{64}$/);
const override = z.strictObject({
  id, damage: z.number().min(0).max(MAX_HP).optional(), range: z.number().min(0).max(MAX_RANGE).optional(),
  cooldown_ticks: z.number().int().min(1).max(MAX_COOLDOWN).optional(),
});
const variant = z.strictObject({
  id, name, type_id: typeId, health: z.number().min(0.01).max(MAX_HP).optional(),
  speed: z.number().min(0).max(MAX_RANGE).optional(), acquisition_range: z.number().min(0).max(MAX_RANGE).optional(),
  weapons: z.array(override).max(16),
});
const placement = z.strictObject({ id, team: z.enum(["a", "b"]), type_id: typeId, x: z.number(), y: z.number(), variant_id: id.optional() });
const draftSchema = z.strictObject({
  version: z.literal(1), revision,
  bounds: z.strictObject({ width: z.number().min(1).max(MAX_RANGE), height: z.number().min(1).max(MAX_RANGE) }),
  placements: z.array(placement).max(MAX_UNITS), variants: z.array(variant).max(MAX_UNITS),
});
export type Draft = z.infer<typeof draftSchema>;
export type Placement = z.infer<typeof placement>;
export type Team = Placement["team"];
export type Variant = z.infer<typeof variant>;
export type WeaponOverride = z.infer<typeof override>;
export type Bounds = Draft["bounds"];
export type Point = { x: number; y: number };
export type Weapon = {
  id: string; type: "laser" | "kinetic" | "dismantle"; damage: number; range: number; cooldown_ticks: number;
  contact_tolerance: number; projectile?: { max_travel_distance: number; speed: number };
};
export type Unit = {
  id: string; health: number; speed: number; hull_radius: number; targetable: boolean; sprite: boolean; unavailable: string | null;
  combat: { acquisition_range: number; on_near_enemy_strategy: "approach" | "flee" | "stay"; attacks: Weapon[] } | null;
};
export type Catalog = { revision: string; units: Unit[] };

const STORAGE_KEY = "bitwars:battle-setups:v1";
const MAX_STORAGE = 768 * 1024;
const MAX_SETUPS = 20;
const setups = z.strictObject({ version: z.literal(1), setups: z.array(z.strictObject({ name, draft: draftSchema })).max(MAX_SETUPS) });
export type Setup = z.infer<typeof setups>["setups"][number];

export function fits(bounds: Bounds, point: Point, radius: number) {
  return Math.abs(Math.fround(point.x)) <= Math.fround(bounds.width) / 2 - Math.fround(radius)
    && Math.abs(Math.fround(point.y)) <= Math.fround(bounds.height) / 2 - Math.fround(radius);
}

export function normalizedName(value: string) {
  const result = name.safeParse(value);
  if (!result.success) throw new Error("Use a name of 1–64 characters without control characters.");
  return result.data;
}

export function validateDraft(draft: Draft, catalog: Catalog) {
  const result = draftSchema.safeParse(draft);
  if (!result.success) return `Invalid ${result.error.issues[0].path.join(".") || "draft"}. Check bounds, coordinates and variant values.`;
  if (draft.revision !== catalog.revision) return `Pin revision ${draft.revision} before using this draft.`;
  const units = new Map(catalog.units.map((unit) => [unit.id, unit]));
  const variants = new Map(draft.variants.map((variant) => [variant.id, variant]));
  if (variants.size !== draft.variants.length || new Set(draft.placements.map((p) => p.id)).size !== draft.placements.length) return "Duplicate placement or variant IDs. Recreate the affected setup.";
  for (const variant of draft.variants) {
    const unit = units.get(variant.type_id);
    if (!unit || unit.unavailable) return `Variant ${variant.name}: ${unit?.unavailable ?? `${variant.type_id} is not a combat unit.`}`;
    if (variant.acquisition_range !== undefined && !unit.combat) return `Variant ${variant.name} has no acquisition range.`;
    const ids = new Set<string>();
    for (const values of variant.weapons) {
      const weapon = unit.combat?.attacks.find((w) => w.id === values.id);
      if (!weapon || ids.has(values.id)) return `Variant ${variant.name}: invalid weapon ${values.id}.`;
      ids.add(values.id);
      if (weapon.type === "dismantle" && values.range !== undefined) return `Variant ${variant.name}: dismantle uses hull contact, not firing range.`;
      if (weapon.type === "kinetic" && ((values.damage ?? weapon.damage) < 0.01 || (values.range ?? weapon.range) < 0.01)) return `Variant ${variant.name}: kinetic damage and range must be at least 0.01.`;
    }
  }
  for (const p of draft.placements) {
    const unit = units.get(p.type_id);
    if (!unit || unit.unavailable) return `Unit ${p.id}: ${unit?.unavailable ?? `${p.type_id} is not a combat unit.`}`;
    if (p.variant_id && variants.get(p.variant_id)?.type_id !== p.type_id) return `Unit ${p.id} has an unavailable variant.`;
    if (!fits(draft.bounds, p, unit.hull_radius)) return `The whole hull of ${p.type_id} (${p.id}) must fit in the arena.`;
  }
  if (new TextEncoder().encode(JSON.stringify(draft)).length > MAX_DRAFT_BYTES) return "Draft exceeds 128 KiB. Remove placements or variants.";
  return null;
}

export function readSetups(): Setup[] {
  let stored: string | null;
  try { stored = localStorage.getItem(STORAGE_KEY); }
  catch { throw new Error("Cannot read saved setups. Enable site storage in this browser and reload."); }
  if (stored === null) return [];
  if (stored.length <= MAX_STORAGE && new TextEncoder().encode(stored).length <= MAX_STORAGE) {
    try { return setups.parse(JSON.parse(stored)).setups; }
    catch { /* Recovery message below. */ }
  }
  throw new Error(`Saved setups cannot be read. Back up and remove the invalid ${STORAGE_KEY} local-storage entry to start over.`);
}

export function writeSetups(entries: Setup[]) {
  const encoded = JSON.stringify({ version: 1, setups: entries });
  if (entries.length > MAX_SETUPS || new TextEncoder().encode(encoded).length > MAX_STORAGE) {
    throw new Error("Setup storage allows 20 names and 768 KiB. Delete an old setup or overwrite an existing name.");
  }
  try { localStorage.setItem(STORAGE_KEY, encoded); }
  catch { throw new Error("Could not save setups in this browser. Check site storage permissions or free space; the draft is unchanged."); }
}

export function readNumber(text: string, label: string, min: number, max: number, integer = false) {
  const n = Number(text);
  if (!text.trim() || !Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) {
    throw new Error(`${label}: enter ${integer ? "a whole number" : "a finite value"} from ${min} to ${max}.`);
  }
  return n;
}

export class BattleRequestError extends Error {
  constructor(readonly code: string, message: string) { super(message); }
}

export async function battleRequest<T>(endpoint: string, options: RequestInit) {
  const response = await fetch(`${BATTLE_API}${endpoint}`, { cache: "no-store", ...options });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new BattleRequestError(error?.code ?? "request_failed", error?.message ?? `Battle request failed (${response.status}). Retry.`);
  }
  return await response.json() as T;
}
