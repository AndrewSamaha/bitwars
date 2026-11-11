import { expect, it, vi } from "vitest";
import { create, toBinary } from "@bufbuild/protobuf";
import { parse as parseUuid } from "uuid";
import { EventsStreamRecordSchema, LifecycleEventSchema, LifecycleState } from "@bitwars/shared/gen/intent_pb";
import { emitEventFromBuffer } from "../src/lib/db/utils/delta";
import type { SseChannel } from "../src/lib/db/utils/sse-channel";
import type { VisibilityFilter } from "../src/lib/db/utils/visibility";

it("delivers a collection rejection only to its player with dashed command ID and structured context", async () => {
  const commandId = "0199aabb-ccdd-7ee1-8abc-0123456789ab";
  const record = create(EventsStreamRecordSchema, {
    record: { case: "lifecycle", value: create(LifecycleEventSchema, {
      entityId: 1006n, playerId: "owner", clientCmdId: parseUuid(commandId),
      serverTick: 42n, state: LifecycleState.REJECTED,
      collectionRejection: { code: "source_depleted", resourceTypeId: "minerals", sourceEntityId: 844n, depotEntityId: 463n },
    }) },
  });
  const bytes = Buffer.from(toBinary(EventsStreamRecordSchema, record));
  const write = vi.fn(async (_value: string) => {});
  const channel = { write } as unknown as SseChannel;
  const logError = vi.fn();

  await emitEventFromBuffer(channel, "42-0", bytes, logError, { playerId: "other" } as VisibilityFilter);
  expect(write).not.toHaveBeenCalled();

  await emitEventFromBuffer(channel, "42-0", bytes, logError, { playerId: "owner" } as VisibilityFilter);
  expect(logError).not.toHaveBeenCalled();
  expect(write).toHaveBeenCalledTimes(1);
  const event = write.mock.calls[0]![0];
  expect(event).toContain("event: lifecycle\n");
  expect(event).toContain("id: 42-0\n");
  const payload = JSON.parse(event.match(/^data: (.*)$/m)![1]);
  expect(payload).toMatchObject({ clientCmdId: commandId, entityId: "1006", playerId: "owner",
    state: LifecycleState.REJECTED, collectionRejection: {
      code: "source_depleted", resourceTypeId: "minerals", sourceEntityId: "844", depotEntityId: "463",
    } });
});
