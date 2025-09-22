import { redis } from "../../../lib/db/connection";
import { ENTITY_INDEX, ENTITY_PREFIX } from "@/features/gamestate/schema/keys";
import { Command } from "ioredis";

export async function createEntityIndex(): Promise<string> {
  const args = [
    ENTITY_INDEX,
    "ON", "JSON",
    "PREFIX", "1", ENTITY_PREFIX,
    "SCHEMA",
    "$.gameId",   "AS", "gameId", "TAG",
    "$.x",        "AS", "x",      "NUMERIC",
    "$.y",        "AS", "y",      "NUMERIC",
  ];
  return (await redis.sendCommand(new Command("FT.CREATE", args))) as string;
}