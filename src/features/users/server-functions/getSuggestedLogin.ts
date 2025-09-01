'use server';

import { PLAYER_COLORS } from "@/lib/constants";
import { getActivePlayers } from "@/features/users/queries/read/getActivePlayers";
import { createRandomName } from "@/features/users/utils/suggestedLogin";

export const getSuggestedLoginDetails = async (): Promise<{suggestedName: string, availableColors: string[]}> => {
    const activePlayers = await getActivePlayers();
    const availableColors = PLAYER_COLORS.filter((color) => !activePlayers.some((p) => p.color === color));
    let suggestedName;
    for (let i = 0; i < 10; i++) {
        const candidateName = createRandomName();
        if (!activePlayers.some((p) => p.name === candidateName)) {
            suggestedName = candidateName;
            break;
        }
    }
    if (!suggestedName) {
        throw new Error("No available player names found");
    }
    return { suggestedName, availableColors};
}