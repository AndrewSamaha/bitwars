import { z } from "zod";
import { parseDocument } from "yaml";

const amount = z.number().finite().nonnegative();
const count = amount.int().safe();
const positiveCount = count.positive();
const id = z.string().regex(/^[a-z][a-z0-9_]*$/);
const distribution = z.object({ average: amount, sd: amount, min: amount, max: amount }).strict()
  .refine(v => v.min <= v.average && v.average <= v.max, { message: "Require min <= average <= max" });
const weightMap = z.record(id, amount).refine(v => {
  const total = Object.values(v).reduce((a,b) => a+b,0);
  return total > 0 && Number.isFinite(total);
}, { message: "Weights require a positive finite total" });
const placement = z.object({
  min_distance: amount.describe("Minimum radius from the system anchor, in game units."),
  max_distance: amount.describe("Maximum radius from the system anchor, in game units."),
  sampling: z.enum(["uniform_radius", "uniform_area"]).describe("Uniform radius favors inner regions; uniform area spreads objects evenly over the annulus."),
  min_separation: amount.describe("Minimum center separation from previously placed objects; hull overlap is also prohibited."),
  max_attempts_per_object: positiveCount.describe("Skip an object after this many failed placements."),
  avoid_damaging_radiation: z.boolean(),
}).strict().refine(v => v.min_distance <= v.max_distance, { message: "Require min_distance <= max_distance" });
const countRange = z.object({ min: count, max: count }).strict().refine(v => v.min <= v.max, { message: "Require min <= max" });
const exposureRange = z.object({ min: amount, max: amount }).strict().refine(v => v.min <= v.max, { message: "Require min <= max" });

export const spawnConfigSchema = z.object({
  min_entity_spawn_distance: amount.default(0),
  max_entity_spawn_distance: amount.default(25),
  max_raiders: count.optional(),
  loadouts: z.array(z.record(id, count).refine(v => Object.values(v).some(n => n > 0), { message: "Loadout must contain units" })).min(1),
  global_neutral_fields: z.array(z.object({
    type: id, count,
    origin: z.tuple([z.number().finite(), z.number().finite()]),
    standard_deviation: amount.describe("Per-axis Gaussian spread about origin."),
  }).strict()).default([]),
  neutrals_near_spawn: z.array(z.object({
    type: id, count,
    min_distance_from_spawn: amount.default(0),
    max_distance_from_spawn: amount.default(0),
  }).strict().refine(v => v.min_distance_from_spawn <= v.max_distance_from_spawn, { message: "Invalid nearby distance bounds" })).default([]),
  starting_resources: z.record(id, count).default({}),
  starting_resources_recipient_type: id.default("habitat"),
  resource_amounts: z.record(id, distribution).default({}),
  exposure: z.object({
    reference_distance: amount.positive().describe("A strength-1 source contributes exposure 1 at this distance."),
    minimum_distance: amount.positive().describe("Positive distance clamp, preventing singular exposure near a source."),
    sources: weightMap.describe("Entity type to relative heating strength; stars and theta contribute additively."),
  }).strict(),
  solar_systems: z.object({
    anchor_type: id.describe("Generate one random system around each initial anchor."),
    planets: z.object({
      count_weights: z.record(z.string().regex(/^(0|[1-9][0-9]*)$/).refine(v => Number.isSafeInteger(Number(v))), amount)
        .refine(v => Object.entries(v).some(([n,w]) => Number(n) > 0 && w > 0) && Number.isFinite(Object.values(v).reduce((a,b) => a+b,0)), { message: "Require positive weight for a nonzero planet count" }),
      placement,
      type_weights: z.object({
        interpolation: z.literal("linear"),
        points: z.array(z.object({ exposure: amount, weights: weightMap }).strict()).min(1)
          .refine(v => v.every((p,i) => !i || p.exposure > v[i-1].exposure), { message: "Exposure points must be strictly increasing" }),
      }).strict(),
    }).strict(),
    populations: z.array(z.object({ type: id, probability: amount.max(1), count: countRange, placement }).strict()),
  }).strict(),
  player_starts: z.object({
    planet_type: id,
    exposure: exposureRange.describe("Inclusive Goldilocks interval for both start origin and planet."),
    min_planet_food_fraction: amount.max(1),
    max_starts_per_planet: positiveCount.describe("Historical reservation limit; disconnects do not release starts."),
    placement: z.object({
      min_distance_from_planet: amount,
      max_distance_from_planet: amount,
      max_attempts_per_planet: positiveCount,
      radiation_clearance_multiplier: amount.min(1),
    }).strict().refine(v => v.min_distance_from_planet <= v.max_distance_from_planet, { message: "Invalid start distance bounds" }),
    min_distance_between_starts: amount,
    enemy_clearance: amount,
    minerals: z.object({ search_radius: amount.positive(), min_remaining: amount.positive(), create_if_missing: z.boolean() }).strict(),
    fallback: z.object({ generate_additional_systems: z.boolean(), max_additional_systems: positiveCount }).strict(),
  }).strict(),
}).strict().superRefine((config, context) => {
  const issue = (path: string, message: string) => context.addIssue({ code: "custom", path: path.split("."), message });
  if (config.min_entity_spawn_distance > config.max_entity_spawn_distance) issue("min_entity_spawn_distance", "Invalid unit spacing");
  if (!Number.isFinite(Object.values(config.exposure.sources).reduce((a,b) => a+b,0) * (config.exposure.reference_distance/config.exposure.minimum_distance)**2)) issue("exposure", "Exposure strengths and distance ratio overflow");
  const systems = config.solar_systems;
  if (!(config.exposure.sources[systems.anchor_type] > 0)) issue("solar_systems.anchor_type", "Anchor must be a positive exposure source");
  if (!config.global_neutral_fields.some(f => f.type === systems.anchor_type && f.count > 0)) issue("global_neutral_fields", `Include an initial ${systems.anchor_type} field`);
  const localTypes = [...config.neutrals_near_spawn.map(f => f.type), ...systems.populations.map(f => f.type), ...systems.planets.type_weights.points.flatMap(p => Object.keys(p.weights))];
  if (localTypes.some(type => type in config.exposure.sources)) issue("exposure.sources", "Exposure sources cannot be planets, local populations or per-player neutrals");
  const points = systems.planets.type_weights.points;
  const start = config.player_starts;
  const weight = (x: number) => {
    if (x <= points[0].exposure) return points[0].weights[start.planet_type] ?? 0;
    for (let i=1; i<points.length; i++) if (x <= points[i].exposure) {
      const t = (x-points[i-1].exposure)/(points[i].exposure-points[i-1].exposure);
      return (1-t)*(points[i-1].weights[start.planet_type] ?? 0)+t*(points[i].weights[start.planet_type] ?? 0);
    }
    return points.at(-1)!.weights[start.planet_type] ?? 0;
  };
  if (![start.exposure.min,start.exposure.max,...points.filter(p => p.exposure >= start.exposure.min && p.exposure <= start.exposure.max).map(p => p.exposure)].some(x => weight(x)>0)) issue("player_starts.planet_type", "Starting planet has no weight in start exposure interval");
});

export type SpawnConfig = z.infer<typeof spawnConfigSchema>;
export type SpawnContent = { entity_types: Record<string, {
  max_capacity?: Record<string, number>; speed?: number;
  collector?: { collects?: string[] };
  resource_node?: { resource_type: string; amount?: number };
}>; resource_types?: Record<string, unknown> };

export function validateSpawnContent(config: SpawnConfig, content: SpawnContent) {
  const types = content.entity_types;
  const refs = [...Object.keys(config.exposure.sources), config.solar_systems.anchor_type, config.player_starts.planet_type,
    ...config.global_neutral_fields.map(f => f.type), ...config.neutrals_near_spawn.map(f => f.type),
    ...config.solar_systems.populations.map(f => f.type), ...config.solar_systems.planets.type_weights.points.flatMap(p => Object.keys(p.weights)),
    ...Object.keys(config.resource_amounts), ...config.loadouts.flatMap(l => Object.keys(l))];
  for (const ref of refs) if (!types[ref]) throw new Error(`Unknown spawn entity ${ref}`);
  const node = types[config.player_starts.planet_type].resource_node;
  if (node?.resource_type !== "food" || !(node.amount! > 0)) throw new Error("Starting planet requires finite food");
  for (const resource of Object.keys(config.starting_resources)) if (!(resource in (content.resource_types ?? {}))) throw new Error(`Unknown starting resource ${resource}`);
  for (const loadout of config.loadouts) {
    if (Object.keys(config.starting_resources).length) {
      const recipient = config.starting_resources_recipient_type;
      if (loadout[recipient] !== 1) throw new Error("Starting resource recipient must appear exactly once");
      for (const [resource, amount] of Object.entries(config.starting_resources)) if (amount > (types[recipient].max_capacity?.[resource] ?? 0)) throw new Error(`Starting ${resource} exceeds capacity`);
    }
    if (!Object.entries(loadout).some(([id,n]) => n>0 && (types[id].speed ?? 0)>0 && types[id].collector?.collects?.includes("minerals"))) throw new Error("Loadout needs a mobile mineral collector");
  }
  if (config.player_starts.minerals.create_if_missing) {
    const node = types.minerals?.resource_node;
    const distribution = config.resource_amounts.minerals;
    const maximum = distribution ? distribution.sd === 0 ? distribution.average : distribution.max : node?.amount ?? 0;
    if (node?.resource_type !== "minerals" || node.amount === undefined || maximum < config.player_starts.minerals.min_remaining) throw new Error("Mineral stock cannot meet start minimum");
  }
}

export function parseSpawnConfig(yaml: unknown, content?: SpawnContent) {
  if (typeof yaml !== "string") throw new Error("Provide spawn configuration YAML");
  const document = parseDocument(yaml);
  if (document.errors.length) throw new Error(document.errors.map(error => error.message).join("; "));
  // YAML numeric 0 and quoted "0" are distinct YAML keys but collide in JS.
  function uniqueKeys(value: unknown) {
    if (value instanceof Map) {
      const seen = new Set<string>();
      for (const [key, child] of value) {
        const normalized = String(key);
        if (seen.has(normalized)) throw new Error(`Duplicate spawn key ${normalized}`);
        seen.add(normalized); uniqueKeys(child);
      }
    } else if (Array.isArray(value)) value.forEach(uniqueKeys);
  }
  uniqueKeys(document.toJS({ mapAsMap: true }));
  const result = spawnConfigSchema.safeParse(document.toJS());
  if (!result.success) throw new Error(result.error.issues.map(issue => `${issue.path.join(".") || "spawn"}: ${issue.message}`).join("; "));
  if (content) validateSpawnContent(result.data, content);
  return result.data;
}

/** Entity references appear in both values and map keys; resource IDs are untouched. */
export function renameSpawnEntity(config: SpawnConfig, oldId: string, newId: string): SpawnConfig {
  const rename = (value: string) => value === oldId ? newId : value;
  const keys = <T>(map: Record<string,T>) => Object.fromEntries(Object.entries(map).map(([k,v]) => [rename(k),v]));
  return { ...config,
    loadouts: config.loadouts.map(keys), resource_amounts: keys(config.resource_amounts),
    starting_resources_recipient_type: rename(config.starting_resources_recipient_type),
    global_neutral_fields: config.global_neutral_fields.map(f => ({ ...f,type: rename(f.type) })),
    neutrals_near_spawn: config.neutrals_near_spawn.map(f => ({ ...f,type: rename(f.type) })),
    exposure: { ...config.exposure, sources: keys(config.exposure.sources) },
    solar_systems: { ...config.solar_systems, anchor_type: rename(config.solar_systems.anchor_type),
      planets: { ...config.solar_systems.planets, type_weights: { ...config.solar_systems.planets.type_weights,
        points: config.solar_systems.planets.type_weights.points.map(p => ({ ...p,weights: keys(p.weights) })) } },
      populations: config.solar_systems.populations.map(p => ({ ...p,type: rename(p.type) })) },
    player_starts: { ...config.player_starts,planet_type: rename(config.player_starts.planet_type) },
  };
}

const fieldHelp: Record<string, string> = {
  min_entity_spawn_distance: "Minimum spacing between newly spawned player units.",
  max_entity_spawn_distance: "Maximum sampling distance from previously placed player units.",
  max_raiders: "Maximum number of living raiders.",
  loadouts: "Pool of player loadouts; select one once per pending join.",
  global_neutral_fields: "Gaussian populations generated once, with exposure sources placed first.",
  type: "Content entity type to generate.", count: "Number of objects, or inclusive random count bounds for a local population.",
  origin: "Gaussian field center as [x, y] in game units.", standard_deviation: "Per-axis Gaussian field spread in game units.",
  neutrals_near_spawn: "Optional neutral entities generated for each player start; exposure sources are prohibited.",
  min_distance_from_spawn: "Minimum radius from the player-start origin.", max_distance_from_spawn: "Maximum radius from the player-start origin.",
  starting_resources: "Resource amounts granted to the selected loadout's recipient inventory.",
  starting_resources_recipient_type: "Entity type receiving starting stock; must occur exactly once in every loadout.",
  resource_amounts: "Per-entity overrides for initial finite deposits, sampled once from a clamped normal distribution.",
  average: "Mean before clamping to the configured bounds.", sd: "Standard deviation; zero gives a fixed amount.",
  min: "Inclusive minimum bound for this range.", max: "Inclusive maximum bound for this range.",
  exposure: "Combined dimensionless heating exposure from all configured sources, separate from collectable energy.",
  reference_distance: "A strength-1 source contributes exposure 1 at this distance.",
  minimum_distance: "Positive denominator clamp preventing singular exposure at a source.",
  sources: "Entity-type heating strengths summed using inverse-square distance.",
  solar_systems: "Populations generated around every initial system anchor.",
  anchor_type: "Exposure-source entity type around which solar systems are generated.",
  planets: "Random planet count, placement and exposure-dependent type selection.",
  count_weights: "Relative weights keyed by target planet count, including zero for barren systems.",
  placement: "Geometry, radiation exclusions and bounded placement attempts.",
  min_distance: "Minimum radius from the system anchor.", max_distance: "Maximum radius from the system anchor.",
  sampling: "Choose uniform radial distance or uniform annulus area.", min_separation: "Minimum center separation, in addition to preventing hull overlap.",
  max_attempts_per_object: "Maximum placement attempts before skipping this object.",
  avoid_damaging_radiation: "Reject objects whose hulls intersect damaging radiation zones.",
  type_weights: "Planet selection weights based on combined exposure from every source.",
  interpolation: "Linearly interpolate each type's weight between exposure points; clamp beyond endpoints.",
  points: "Strictly increasing exposure control points, each with positive total type weight.",
  weights: "Relative entity-type selection weights; omitted types have zero weight.",
  populations: "Independent local populations, rolled once per system and distributed through their annuli.",
  probability: "Probability from zero to one that this population occurs in a system.",
  player_starts: "Safe, resource-supported starts selected near eligible planets, with persistent reservations.",
  planet_type: "Eligible starting planet type; must have finite food stock.",
  min_planet_food_fraction: "Minimum remaining divided by sampled initial food stock; depleted planets are excluded.",
  max_starts_per_planet: "Maximum historical committed starts per planet, retained across disconnects and depletion.",
  min_distance_from_planet: "Minimum player-start radius from its associated planet.",
  max_distance_from_planet: "Maximum player-start radius from its associated planet.",
  max_attempts_per_planet: "Maximum complete start-placement attempts for each eligible planet.",
  radiation_clearance_multiplier: "Expand damaging-source exclusion radii by this factor, at least one, for player units.",
  min_distance_between_starts: "Minimum distance between historical committed start origins.",
  enemy_clearance: "Minimum clearance from hostile players and NPCs.",
  minerals: "Minimum nearby mineral stock and safe harvesting approach required for a start.",
  search_radius: "Maximum distance from the start origin to a usable mineral node.",
  min_remaining: "Minimum remaining mineral stock for a node to qualify.",
  create_if_missing: "Stage a mineral node if none qualifies; failed starts leave no staged objects behind.",
  fallback: "Bounded creation of an additional system when ordinary start selection fails.",
  generate_additional_systems: "Allow expansion systems to provide a blue planet while preserving all start safety requirements.",
  max_additional_systems: "Maximum tentative expansion attempts per relevant eligibility revision; failed systems are discarded.",
};

/** Generate the Monaco schema with documentation for every configured field. */
export function spawnJsonSchema() {
  const schema = z.toJSONSchema(spawnConfigSchema, { target: "draft-7" });
  function document(node: unknown) {
    if (!node || typeof node !== "object") return;
    const value = node as { properties?: Record<string, { description?: string }> };
    for (const [key, child] of Object.entries(value.properties ?? {})) {
      if (!child.description) {
        if (!fieldHelp[key]) throw new Error(`Missing spawn field help: ${key}`);
        child.description = fieldHelp[key];
      }
    }
    for (const child of Object.values(node)) if (typeof child === "object") {
      if (Array.isArray(child)) child.forEach(document); else document(child);
    }
  }
  document(schema);
  return schema;
}
