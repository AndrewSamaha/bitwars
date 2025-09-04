import type { Player } from "./player";
import type { PlayerDoc } from "./playerDoc";
import type { PlayerLogin } from "./playerLogin";
import { v5 as uuidv5 } from 'uuid';
import { normalizeString } from "@/lib/utils";
import { PLAYER_NAMESPACE } from "@/lib/constants";

export const loginToPlayer = (login: PlayerLogin): Player => {
  const gameId = process.env.GAME_ID;
  if (!gameId) throw new Error("GAME_ID not set");
  const normalized = normalizeString(login.name);
  const id = uuidv5(normalized, PLAYER_NAMESPACE);
  const createdAt = new Date();
  const lastSeen = createdAt;
  const createdAtMs = createdAt.getTime();
  const lastSeenMs = lastSeen.getTime();
  return {
    id,
    gameId,
    name: login.name,
    normalizedName: normalizeString(login.name),
    color: login.color,
    createdAt,
    lastSeen,
    createdAtMs,
    lastSeenMs,
  };
};

export const playerToPlayerDoc = (p: Player): PlayerDoc => ({
  ...p,
  createdAt: p.createdAt.toISOString(),
  lastSeen: p.lastSeen.toISOString(),
});

export const playerDocToPlayer = (d: PlayerDoc): Player => {
  return {
    ...d,
    createdAt: new Date(d.createdAt),
    lastSeen: new Date(d.lastSeen),
  };
};
