import { z } from "zod";
import { PlayerSchema } from "./player";

export const PlayerDocSchema = PlayerSchema.extend({
  // overwrite date types for storage:
  createdAt: z.iso.datetime(),
  lastSeen: z.iso.datetime(),
}).strict();

export type PlayerDoc = z.infer<typeof PlayerDocSchema>;
