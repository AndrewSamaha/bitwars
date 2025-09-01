import { NextResponse, NextRequest } from "next/server";
import { getNearbyEntities } from "@/app/gamestate/queries/read/getNearbyEntities";
import { getAllEntitiesFromIndex } from "@/app/gamestate/queries/read/getAllEntities";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const xParam = url.searchParams.get("x");
  const yParam = url.searchParams.get("y");

  // If x or y is missing, return all entities
  if (xParam === null || yParam === null) {
    const entities = await getAllEntitiesFromIndex();
    return NextResponse.json(entities, { status: 200 });
  }

  const x = Number(xParam);
  const y = Number(yParam);
  if (Number.isNaN(x) || Number.isNaN(y)) {
    return NextResponse.json({ error: "x and y must be numbers" }, { status: 400 });
  }

  // Optional radius (defaults to 500 meters/units)
  const radius = Number(url.searchParams.get("radius") ?? "500");
  if (!Number.isFinite(radius) || radius <= 0) {
    return NextResponse.json({ error: "Invalid radius: must be a positive number." }, { status: 400 });
  }

  // Fetch nearby
  const entities = await getNearbyEntities([[x, y]], radius);
  return NextResponse.json(entities, { status: 200 });
}
