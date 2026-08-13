import { redis } from "@/lib/db/connection";

export type PlayerSessionState = "active" | "logging-out";

const LOGOUT_TRANSITION_TTL_SECONDS = 30;

const sessionStateKey = (playerId: string) => `player:${playerId}:session_state`;

export async function getPlayerSessionState(playerId: string): Promise<PlayerSessionState> {
  const state = await redis.get(sessionStateKey(playerId));
  return state === "logging-out" ? "logging-out" : "active";
}

export async function startPlayerLogout(playerId: string): Promise<void> {
  await redis.set(
    sessionStateKey(playerId),
    "logging-out",
    "EX",
    LOGOUT_TRANSITION_TTL_SECONDS,
  );
}

export async function finishPlayerLogout(playerId: string): Promise<void> {
  await redis.del(sessionStateKey(playerId));
}
