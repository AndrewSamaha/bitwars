import { z } from "zod";

export const SuggestedLoginDetailsSchema = z.object({
    suggestedName: z.string(),
    availableColors: z.string().array(),
});

export type SuggestedLoginDetails = z.infer<typeof SuggestedLoginDetailsSchema>;
