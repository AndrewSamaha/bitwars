export enum SoundEffect {
  EntityExplosion = "entity-explosion",
  SonarPing = "sonar-ping",
  BuildComplete = "build-complete",
  LaserShot = "laser-shot",
  UnderAttack = "under-attack",
}

export const GAMEPLAY_SOUND_EFFECTS = Object.values(SoundEffect);

export type SfxAttribution = {
  artist: string;
  source: string;
  license: string;
  changes: string;
  retrieved: string;
};

export type SfxDefinition = {
  name: string;
  sources: string[];
  volume: number;
  pool: number;
  attribution: SfxAttribution;
};

export type SfxEntry = { id: string; definition: SfxDefinition; usedByGameplay: boolean };

const ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const SOURCE_PATTERN = /^sfx\/(?:[a-zA-Z0-9_-]+\/)+[a-zA-Z0-9_.-]+\.(?:mp3|wav|ogg|flac)$/i;

export function validSfxId(id: unknown): id is string {
  return typeof id === "string" && ID_PATTERN.test(id);
}

export function validSfxSource(source: unknown): source is string {
  return typeof source === "string" && SOURCE_PATTERN.test(source) && !source.split("/").includes("..");
}

export function validateSfxDefinition(value: unknown): SfxDefinition {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Provide a sound effect definition.");
  const definition = value as Record<string, unknown>;
  const fields = ["name", "sources", "volume", "pool", "attribution"];
  if (Object.keys(definition).some((field) => !fields.includes(field))) throw new Error("Unknown sound effect field.");
  if (typeof definition.name !== "string" || !definition.name.trim()) throw new Error("Enter a sound name.");
  if (!Array.isArray(definition.sources) || definition.sources.length > 24 || !definition.sources.every(validSfxSource) || new Set(definition.sources).size !== definition.sources.length) {
    throw new Error("Choose unique audio files under audio/sfx.");
  }
  if (typeof definition.volume !== "number" || !Number.isFinite(definition.volume) || definition.volume < 0 || definition.volume > 1) throw new Error("Volume must be between 0 and 1.");
  if (!Number.isInteger(definition.pool) || (definition.pool as number) < 1 || (definition.pool as number) > 32) throw new Error("Pool must be between 1 and 32.");
  const attribution = definition.attribution;
  if (!attribution || typeof attribution !== "object" || Array.isArray(attribution)) throw new Error("Provide attribution details.");
  const attributionFields = ["artist", "source", "license", "changes", "retrieved"] as const;
  if (Object.keys(attribution).some((field) => !attributionFields.includes(field as typeof attributionFields[number]))) throw new Error("Unknown attribution field.");
  const details = attribution as Record<string, unknown>;
  for (const field of attributionFields) if (typeof details[field] !== "string") throw new Error(`Attribution ${field} must be text.`);
  if (definition.sources.length && ["artist", "source", "license"].some((field) => !(details[field] as string).trim())) {
    throw new Error("Artist, source, and license are required for effects with audio files.");
  }
  return {
    name: definition.name.trim(),
    sources: definition.sources,
    volume: definition.volume,
    pool: definition.pool as number,
    attribution: Object.fromEntries(attributionFields.map((field) => [field, (details[field] as string).trim()])) as SfxAttribution,
  };
}

export function audioUrl(source: string): string {
  return `/audio/${source.split("/").map(encodeURIComponent).join("/")}`;
}
