// schema/entityDoc.ts
import { z } from "zod";
import { EntitySchema } from "./entity";

export const EntityDocSchema = EntitySchema.extend({
  // overwrite date types for storage:
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),

}).strict();

export type EntityDoc = z.infer<typeof EntityDocSchema>;
