import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SESSION = "bitwars_battle_developer";
const SESSION_SECONDS = 12 * 60 * 60;
export const DASHED_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
export const REVISION_HASH = /^[0-9a-f]{64}$/;
const NO_STORE = { "Cache-Control": "private, no-store" };

interface Config { key: string; origin: string; secure: boolean }

export function developerConfig(): Config | null {
  const key = process.env.BATTLE_DEV_KEY;
  if (process.env.NODE_ENV !== "development" || !key || Buffer.byteLength(key) < 32 || Buffer.byteLength(key) > 4096) return null;
  try {
    const url = new URL(process.env.BATTLE_ORIGIN ?? `http://localhost:${process.env.PORT || "3000"}`);
    if (!["http:", "https:"].includes(url.protocol) || url.href !== `${url.origin}/`) return null;
    return { key, origin: url.origin, secure: url.protocol === "https:" };
  } catch { return null; }
}

function sign(config: Config, data: string) {
  return createHmac("sha256", config.key).update("bitwars/battle/developer/v1\0").update(config.origin).update("\0").update(data).digest();
}

export async function developerOwner(config = developerConfig()) {
  if (!config) return null;
  const value = (await cookies()).get(SESSION)?.value;
  const parts = value?.split(".");
  if (!parts || parts.length !== 3) return null;
  const [owner, expires, mac] = parts;
  if (!DASHED_ID.test(owner) || !/^\d{10,12}$/.test(expires) || !REVISION_HASH.test(mac)) return null;
  const expiry = Number(expires);
  if (expiry <= Date.now() / 1000 || expiry > Date.now() / 1000 + SESSION_SECONDS) return null;
  return timingSafeEqual(sign(config, `${owner}.${expires}`), Buffer.from(mac, "hex")) ? owner : null;
}

export function sameOrigin(request: Request, config: Config) {
  return request.headers.get("origin") === config.origin
    && request.headers.get("sec-fetch-site") !== "cross-site";
}

export function battleError(status: number, code: string, message: string) {
  return Response.json({ code, message }, { status, headers: NO_STORE });
}

export const battleDisabled = () => battleError(404, "battle_unavailable", "Battle is available only in configured development mode.");

export async function authorizeBattle(request?: Request) {
  const config = developerConfig();
  if (!config) return battleDisabled();
  if (request && !sameOrigin(request, config)) return battleError(403, "wrong_origin", `Open Battle at ${config.origin} to make this request.`);
  return await developerOwner(config) ?? battleError(401, "unauthorized", "Unlock the developer session on the Battle page, then retry.");
}

export async function unlockBattle(config: Config, candidate: string) {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  if (!timingSafeEqual(digest(candidate), digest(config.key))) return false;
  // Keep an existing valid identity so signing in again doesn't orphan its runs.
  const owner = await developerOwner(config) ?? randomUUID();
  const data = `${owner}.${Math.floor(Date.now() / 1000) + SESSION_SECONDS}`;
  (await cookies()).set(SESSION, `${data}.${sign(config, data).toString("hex")}`, {
    httpOnly: true, sameSite: "strict", secure: config.secure, path: "/", maxAge: SESSION_SECONDS,
  });
  return true;
}
