import { PLAYER_NAME_PARTS } from "@/lib/constants";

export const getRandomNamePart = (): string => {
    const names = PLAYER_NAME_PARTS;
    const randomIndex = Math.floor(Math.random() * names.length);
    return names[randomIndex];
}

export const createRandomName = (): string => {
    const name = getRandomNamePart() + getRandomNamePart();
    return name;
}