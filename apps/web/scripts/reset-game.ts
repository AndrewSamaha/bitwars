import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { redis, streamRedis } from "@/lib/db/connection";
import init from "@/lib/db/init/init";

function displayRedisTarget(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    if (url.password) url.password = "***";
    return url.toString();
  } catch {
    return "(invalid GAMESTATE_REDIS_URL)";
  }
}

async function confirmReset(target: string): Promise<boolean> {
  if (process.argv.includes("--yes")) return true;
  if (!stdin.isTTY || !stdout.isTTY) {
    throw new Error("Non-interactive reset requires the --yes flag.");
  }

  const prompt = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await prompt.question(
      `This will permanently delete every key in ${target}.\nType "reset" to continue: `,
    );
    return answer.trim().toLowerCase() === "reset";
  } finally {
    prompt.close();
  }
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("game:reset is disabled when NODE_ENV=production.");
  }

  const redisUrl = process.env.GAMESTATE_REDIS_URL || "redis://127.0.0.1:6379";
  const target = displayRedisTarget(redisUrl);
  console.log(`Redis database: ${target}`);
  console.log("Stop the RTS engine before continuing so it cannot repopulate stale state.");

  if (!(await confirmReset(target))) {
    console.log("Reset cancelled.");
    return;
  }

  await redis.flushdb();
  console.log("Redis database cleared.");

  await init();
  console.log("Required indexes recreated.");
  console.log("Game reset complete.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => {
    redis.disconnect();
    streamRedis.disconnect();
  });
