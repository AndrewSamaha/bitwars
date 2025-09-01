import { NextResponse } from "next/server";
import type { PlayerLogin } from "@/features/users/schema/player/playerLogin";
import type { Player } from "@/features/users/schema/player/player";
import { PLAYER_COLORS, PLAYER_NAME_PARTS } from "@/lib/constants";
import { loginToPlayer } from "@/features/users/schema/player/mappers";
import { createPlayer } from "@/features/users/queries/create";

const randomColor = (): string => {
  const colors = PLAYER_COLORS;
  const randomIndex = Math.floor(Math.random() * colors.length);
  return colors[randomIndex];
}

const randomPlayerName = (): string => {
  const names = PLAYER_NAME_PARTS;
  const randomIndex = Math.floor(Math.random() * names.length);
  return names[randomIndex];
}

const createLogin  = (): PlayerLogin => {
  return {
    name: randomPlayerName(),
    color: randomColor(),
  }
}

const createPlayerFromLogin = (login: PlayerLogin): Player => {
  const player = loginToPlayer(login);
  return player;
}

export async function POST() {
  const players = Array.from({ length: 5 }, (_, i) => createPlayerFromLogin(createLogin()));
  await Promise.all(players.map((player) => createPlayer(player)));

  return NextResponse.json({ players }, { status: 200 });
}
