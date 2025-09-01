import { PLAYER_COLORS, PLAYER_NAME_PARTS } from "@/lib/constants";
import { NextResponse } from "next/server";
import { getActivePlayers } from "@/features/users/queries/read/getActivePlayers";
import type { PlayerLogin } from "@/features/users/schema/player/playerLogin";
import { loginToPlayer } from "@/features/users/schema/player/mappers";

const randomColor = (): string => {
  const colors = PLAYER_COLORS;
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
}
const getRandomNamePart = (): string => {
    const names = PLAYER_NAME_PARTS;
    const randomIndex = Math.floor(Math.random() * names.length);
    return names[randomIndex];
}
const createRandomName = (): string => {
    const name = getRandomNamePart() + getRandomNamePart();
    return name;
}
const getSuggestedLogin = async (): Promise<PlayerLogin> => {
    const activePlayers = await getActivePlayers()

    for (let i = 0; i < 10; i++) {
        const name = createRandomName();
        const color = randomColor();
        const candidateLogin = {
            name,
            color,
        }
        const candidatePlayerDoc = loginToPlayer(candidateLogin);
        if (!activePlayers.some((p) => p.name === name || p.color === color)) {
            return {
                name,
                color,
            }
        }
    }
    return {
        name: createRandomName(),
        color: getRandomColor(),
    }
}

export async function GET() {
  
  return NextResponse.json({ players }, { status: 200 });
}
