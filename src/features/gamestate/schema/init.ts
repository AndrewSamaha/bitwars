import { redis } from "../../../lib/db/connection";
import { ENTITY_INDEX, ENTITY_PREFIX } from "@/features/gamestate/schema/keys";

export async function createEntityIndex() {
  return redis.sendCommand([
    "FT.CREATE", ENTITY_INDEX,
    "ON", "JSON",
    "PREFIX", "1", ENTITY_PREFIX,
    "SCHEMA",
    "$.gameId",   "AS", "gameId", "TAG",
    "$.x",        "AS", "x",      "NUMERIC",
    "$.y",        "AS", "y",      "NUMERIC"
  ]);
}