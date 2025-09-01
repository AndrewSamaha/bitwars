import { v4 as uuidv4 } from 'uuid';
import { upsertEntity } from "@/app/gamestate/queries/upsert";
import { Entity } from '@/app/gamestate/schema/entity/entity';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const createEntities = (): Entity[] => {
  const gameId = process.env.GAME_ID ?? 'dev-game';
  const ownerId = (process.env.MOCK_OWNER_ID ?? uuidv4()) as string; // Entity.ownerId is UUID string

  return Array.from({ length: 5 }, (_, i) => ({
    id: uuidv4(),
    gameId,
    ownerId,
    name: `mock entity`,
    x: Math.random() * 100,
    y: Math.random() * 100,
    dir: 0,
    speed: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  } satisfies Entity));
};

export async function POST() {
  const entities = createEntities();
  await Promise.all(entities.map((entity) => upsertEntity(entity)));

  return NextResponse.json({ entities }, { status: 200 });
}
  