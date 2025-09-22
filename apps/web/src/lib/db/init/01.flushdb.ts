import { redis } from "../connection";

export async function flushdb() {
  await redis.flushdb();
}
