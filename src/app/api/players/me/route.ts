// app/api/players/me/route.ts
import { NextResponse } from 'next/server';
import { getPlayerById } from '@/features/users/queries/read/getPlayerById'; // implement this
import { PlayerSchema } from '@/features/users/schema/player/player';
import { requireAuthOr401 } from '@/features/users/utils/auth';

export async function GET() {
  const { auth, res } = await requireAuthOr401();
  if (res) return res; // 401 when not authenticated
  console.log(auth);
  try {
    const playerId = auth?.playerId as string | undefined;
    if (!playerId) return NextResponse.json(null, { status: 401 });

    const player = await getPlayerById(playerId);
    if (!player) return NextResponse.json(null, { status: 401 });

    const parse = PlayerSchema.safeParse(player);
    if (!parse.success) return NextResponse.json(null, { status: 401 });

    return NextResponse.json(parse.data, { status: 200 });
  } catch {
    return NextResponse.json(null, { status: 401 });
  }
}
