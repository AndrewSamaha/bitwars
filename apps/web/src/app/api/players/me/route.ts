// app/api/players/me/route.ts
import { NextResponse } from 'next/server';
import { getPlayerById } from '@/features/users/queries/read/getPlayerById';
import { PlayerSchema } from '@/features/users/schema/player/player';
import { requireAuthOr401 } from '@/features/users/utils/auth';
import { redis } from '@/lib/db/connection';
import { decodeSnapshotBinary } from '@/lib/db/utils/binary-encoding';
import { getEnv } from '@/lib/utils';

const DEFAULT_GAME_ID = 'demo-001';

/** Build resource_ledger map for one player from decoded snapshot (M7). */
function getResourceLedgerForPlayer(
  snapshot: { playerLedgers?: Array<{ playerId: string; resources: Array<{ resourceType: string; amount: bigint }> }> },
  playerId: string
): Record<string, number> {
  const ledger: Record<string, number> = {};
  const pl = (snapshot.playerLedgers ?? []).find((p) => p.playerId === playerId);
  if (!pl?.resources) return ledger;
  for (const r of pl.resources) {
    const key = r.resourceType ?? '';
    if (key) ledger[key] = Number(r.amount ?? 0);
  }
  return ledger;
}

export async function GET() {
  const { auth, res } = await requireAuthOr401();
  if (res) return res; // 401 when not authenticated

  try {
    const playerId = auth?.playerId as string | undefined;
    if (!playerId) return NextResponse.json(null, { status: 401 });

    const player = await getPlayerById(playerId);
    if (!player) return NextResponse.json(null, { status: 401 });

    const parse = PlayerSchema.safeParse(player);
    if (!parse.success) return NextResponse.json(null, { status: 401 });

    const payload = parse.data as Record<string, unknown>;

    // M7: Attach resource ledger from latest snapshot so client has single source for identity + resources.
    try {
      const GAME_ID = getEnv('GAME_ID', DEFAULT_GAME_ID);
      const snapshotKey = `snapshot:${GAME_ID}`;
      const snapshotBuf = await (redis as any).getBuffer?.(snapshotKey);
      if (snapshotBuf && Buffer.isBuffer(snapshotBuf)) {
        const snapshot = decodeSnapshotBinary(snapshotBuf);
        const resource_ledger = getResourceLedgerForPlayer(snapshot, playerId);
        if (Object.keys(resource_ledger).length > 0) payload.resource_ledger = resource_ledger;
      }
    } catch {
      // Snapshot missing or decode error: omit resource_ledger
    }

    return NextResponse.json(payload, { status: 200 });
  } catch {
    return NextResponse.json(null, { status: 401 });
  }
}
