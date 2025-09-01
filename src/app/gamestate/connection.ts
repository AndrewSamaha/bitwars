import { createClient } from "redis";

export const redis = createClient({ url: process.env.GAMESTATE_REDIS_URL });
await redis.connect();