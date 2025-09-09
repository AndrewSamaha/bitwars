import { createClient, type RedisClientType } from "redis";

export const redis = createClient({ url: process.env.GAMESTATE_REDIS_URL }) as RedisClientType;
await redis.connect();