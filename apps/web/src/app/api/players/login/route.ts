// app/api/players/login/route.ts
import { NextResponse } from 'next/server';
import { sign, SignOptions } from 'jsonwebtoken';
import type { PlayerLogin } from '@/features/users/schema/player/playerLogin';
import { loginToPlayer, playerDocToPlayer } from '@/features/users/schema/player/mappers';
import { createPlayer } from '@/features/users/queries/create';
import { logger, withAxiom } from "@/lib/axiom/server";
import { getPlayerById } from "@/features/users/queries/read/getPlayerById";
import { paletteForOwner } from "@/lib/playerPalettes";

export const POST = withAxiom(async (request: Request) => {
  const body = (await request.json()) as PlayerLogin;
  logger.info("players/login", body);
  let player = loginToPlayer({
    ...body,
    color: "",
  });
  player.color = paletteForOwner(player.id).id;
  const existingPlayer = await getPlayerById(player.id);
  if (existingPlayer) {
    player = {
      ...player,
      createdAt: existingPlayer.createdAt,
      createdAtMs: existingPlayer.createdAtMs,
    };
  }
  const tokenPayload = {
    playerId: player.id,
    name: player.name,
    normalizedName: player.normalizedName,
  };
  const tokenOptions: SignOptions = {
    expiresIn: '1d',
    algorithm: 'HS256',
  };
  const token = sign(tokenPayload, process.env.PLAYER_AUTH_SECRET!, tokenOptions);
  const dbResult = await createPlayer(player);
  const responseBody = { player: playerDocToPlayer(dbResult) };

  const res = NextResponse.json(responseBody, { status: 200 });

  res.cookies.set({
    name: 'player_token',
    value: token,
    httpOnly: true,                // <-- important
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,          // 1 day, match your JWT exp
  });

  return res;
});
