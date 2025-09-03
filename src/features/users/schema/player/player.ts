// zod schema + helpers
import { z } from "zod";

export const PlayerSchema = z.object({
  id: z.uuid(),
  gameId: z.string(),
  name: z.string(),
  normalizedName: z.string(),
  color: z.string(),
  createdAt: z.date(),
  lastSeen: z.date(),
  createdAtMs: z.number(),
  lastSeenMs: z.number(),
  detail: z.record(z.string(), z.unknown()).optional(),
  detailVersion: z.tuple([z.number(), z.number(), z.number()]).optional(),
});

export type Player = z.infer<typeof PlayerSchema>;

export const semVer = (version: [number, number, number]) => `${version[0]}.${version[1]}.${version[2]}`;
