// schema/entityDoc.ts
import { z } from "zod";
import { EntitySchema } from "./entity";

export const EntityDocSchema = EntitySchema.extend({
  // overwrite date types for storage:
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // add index-only field:
  pos_str: z.string(), // "lon,lat"
}).strict();

export type EntityDoc = z.infer<typeof EntityDocSchema>;
