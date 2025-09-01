// zod schema + helpers
import { z } from "zod";
export const EntitySchema = z.object({
  id: z.uuid(),
  gameId: z.string(),
  ownerId: z.uuid(),
  name: z.string(),
  pos: z.tuple([z.number(), z.number()]), // [x, y]
  dir: z.number(), // radians
  speed: z.number(),
  createdAt: z.date(),
  updatedAt: z.date(),
  detail: z.record(z.string(), z.unknown()).optional(),
  detailVersion: z.tuple([z.number(), z.number(), z.number()]).optional(),
});
export type Entity = z.infer<typeof EntitySchema>;

export const posToGeo = (pos: [number, number]) => `${pos[0]},${pos[1]}`; // "x,y"
export const semVer = (version: [number, number, number]) => `${version[0]}.${version[1]}.${version[2]}`;
