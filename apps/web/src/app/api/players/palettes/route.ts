import { NextResponse } from "next/server";
import { getPlayerById } from "@/features/users/queries/read/getPlayerById";
import { PLAYER_PALETTES } from "@/lib/playerPalettes";

const PLAYER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const paletteIds = new Set<string>(PLAYER_PALETTES.map((palette) => palette.id));

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const ids = body?.ids;
  if (!Array.isArray(ids) || ids.length > 100 || !ids.every((id) => typeof id === "string")) {
    return NextResponse.json({ error: "Provide up to 100 player IDs." }, { status: 400 });
  }

  const players = await Promise.all([...new Set<string>(ids.filter((id) => PLAYER_ID.test(id)))].map((id) => getPlayerById(id)));
  const palettes: Record<string, string> = {};
  for (const player of players) {
    if (player && player.gameId === process.env.GAME_ID && paletteIds.has(player.color)) {
      palettes[player.id] = player.color;
    }
  }
  return NextResponse.json({ palettes });
}
