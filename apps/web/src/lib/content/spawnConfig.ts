import { z } from "zod";
import { parseDocument } from "yaml";

const amount = z.number().finite().nonnegative();
const count = amount.int().safe();
const id = z.string().regex(/^[a-z][a-z0-9_]*$/);
const distribution = z.object({ average: amount, sd: amount, min: amount, max: amount }).strict()
  .refine(value => value.min <= value.average && value.average <= value.max, {
    message: "Require min <= average <= max",
  });

const spawnConfigSchema = z.object({
  min_entity_spawn_distance: amount.optional(),
  max_entity_spawn_distance: amount.optional(),
  max_raiders: count.optional(),
  loadouts: z.array(z.record(id, count)).min(1),
  global_neutral_fields: z.array(z.object({
    type: id,
    count,
    origin: z.tuple([z.number().finite(), z.number().finite()]),
    standard_deviation: amount,
  }).strict()).default([]),
  neutrals_near_spawn: z.array(z.object({
    type: id,
    count,
    min_distance_from_spawn: amount.optional(),
    max_distance_from_spawn: amount.optional(),
  }).strict()).optional(),
  starting_resources: z.record(id, count).optional(),
  starting_resources_recipient_type: id.optional(),
  resource_amounts: z.record(id, distribution).optional(),
}).strict().refine(config => config.global_neutral_fields.some(field => field.type === "star_yellow" && field.count >= 2), {
  path: ["global_neutral_fields"],
  message: "Include a star_yellow field with at least two stars so players can spawn near a planet",
});

export function parseSpawnConfig(yaml: unknown) {
  if (typeof yaml !== "string") throw new Error("Provide spawn configuration YAML");
  const document = parseDocument(yaml);
  if (document.errors.length) throw new Error(document.errors.map(error => error.message).join("; "));
  const result = spawnConfigSchema.safeParse(document.toJS());
  if (!result.success) throw new Error(result.error.issues.map(issue => `${issue.path.join(".") || "spawn"}: ${issue.message}`).join("; "));
  return result.data;
}
