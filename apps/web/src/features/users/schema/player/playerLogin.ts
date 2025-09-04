import { z } from "zod";

export const PlayerLoginSchema = z.object({
    name: z.string(),
    color: z.string(),
});

export type PlayerLogin = z.infer<typeof PlayerLoginSchema>;
