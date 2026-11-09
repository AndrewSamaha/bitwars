import { create, toBinary } from "@bufbuild/protobuf";
import { BuildRejectionDetailSchema, BuildResourceShortfallSchema, EventsStreamRecordSchema, LifecycleEventSchema, LifecycleReason, LifecycleState } from "@bitwars/shared/gen/intent_pb";
import { Vec2Schema } from "@bitwars/shared/gen/vec2_pb";
import { parse as parseUuid } from "uuid";
import { expect, it, vi } from "vitest";
import { emitEventFromBuffer } from "../src/lib/db/utils/delta";
import type { SseChannel } from "../src/lib/db/utils/sse-channel";
import type { VisibilityFilter } from "../src/lib/db/utils/visibility";

it("delivers complete build rejection details only to the issuing player", async () => {
  const commandId = "019a3781-715a-7c01-8db3-fb730dd36a00";
  const intentId = "019a3781-715a-7c01-8db3-fb730dd36a01";
  const lifecycle = create(LifecycleEventSchema, {
    entityId: 882n,
    playerId: "player-a",
    clientCmdId: parseUuid(commandId),
    intentId: parseUuid(intentId),
    serverTick: 43n,
    state: LifecycleState.REJECTED,
    reason: LifecycleReason.MISSING_TECHNOLOGY,
    protocolVersion: 22,
    buildRejection: create(BuildRejectionDetailSchema, {
      blueprintId: "battleship",
      missingTechnologyIds: ["neutrino_sensors"],
      resourceShortfalls: [create(BuildResourceShortfallSchema, {
        resourceTypeId: "minerals", required: 2005, available: 1200,
      })],
      requestedLocation: create(Vec2Schema, { x: 80, y: 90 }),
    }),
  });
  const data = Buffer.from(toBinary(EventsStreamRecordSchema, create(EventsStreamRecordSchema, {
    record: { case: "lifecycle", value: lifecycle },
  })));
  const write = vi.fn(async (_frame: string) => {});
  const channel = { write } as unknown as SseChannel;
  const visibility = (playerId: string) => ({ playerId }) as VisibilityFilter;

  await emitEventFromBuffer(channel, "4-0", data, vi.fn(), visibility("player-b"));
  expect(write).not.toHaveBeenCalled();
  await emitEventFromBuffer(channel, "4-0", data, vi.fn(), visibility("player-a"));
  expect(write).toHaveBeenCalledOnce();
  const frame = write.mock.calls[0]![0];
  expect(frame).toContain("event: lifecycle");
  const payload = JSON.parse(frame.split("\n").find(line => line.startsWith("data: "))!.slice(6));
  expect(payload).toMatchObject({
    entityId: "882", clientCmdId: commandId, intentId, playerId: "player-a", serverTick: "43",
    state: LifecycleState.REJECTED, reason: LifecycleReason.MISSING_TECHNOLOGY,
    buildRejection: {
      blueprintId: "battleship", missingTechnologyIds: ["neutrino_sensors"],
      resourceShortfalls: [{ resourceTypeId: "minerals", required: 2005, available: 1200 }],
      requestedLocation: { x: 80, y: 90 },
    },
  });
});
