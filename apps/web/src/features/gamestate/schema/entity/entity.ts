// zod schema + helpers
import { z } from "zod";
export const EntitySchema = z.object({
  id: z.uuid(),
  gameId: z.string(),
  ownerId: z.uuid(),
  name: z.string(),
  // Position Info
  x: z.number(),
  y: z.number(),
  dir: z.number(), // radians
  speed: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  // Unit-specific info; non-indexed
  detail: z.record(z.string(), z.unknown()).optional(),
  detailVersion: z.tuple([z.number(), z.number(), z.number()]).optional(),
});
export type Entity = z.infer<typeof EntitySchema>;

export const semVer = (version: [number, number, number]) => `${version[0]}.${version[1]}.${version[2]}`;
