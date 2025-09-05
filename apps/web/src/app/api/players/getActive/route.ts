import { getActivePlayers } from "@/features/users/queries/read/getActivePlayers";
import { NextResponse } from "next/server";

export async function GET() {
  const players = await getActivePlayers()
  return NextResponse.json(players, { status: 200 });
}
