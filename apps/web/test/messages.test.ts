import { expect, it } from "vitest";
import { formatMessage, type MessageInput } from "@/features/hud/messages";

it("keeps different collection failures distinguishable despite their shared display title", () => {
  const spacing: MessageInput = { kind: "collection-spacing-waiting", collectorEntityId: "973" };
  const capacity: MessageInput = { kind: "collection-capacity-blocked", entityId: 973, resourceTypeId: "minerals" };
  const spacingMessage = formatMessage(spacing);
  const capacityMessage = formatMessage(capacity);

  expect(spacing.kind).not.toBe(capacity.kind);
  expect(spacingMessage.title).toBe(capacityMessage.title);
  expect(spacingMessage.focusLabel).toBe("Collector 973");
  expect(capacityMessage.focusLabel).toBe("Collector #973");
});

it("formats a reroute with its worker as the focus and both depot IDs", () => {
  const message = formatMessage({ kind: "collection-rerouted", detail: { entityId: 847, fromDepotId: 964, toDepotId: 947 } });
  expect(message.message).toContain("depot #964 to depot #947");
  expect(message.focusEntityId).toBe("847");
});

import { messageEntityLinks } from "@/features/hud/messageLog";

it.each([
  [{ kind: "collection-rerouted", detail: { entityId: 7, fromDepotId: 8, toDepotId: 8 } }, [["Worker 7", "7"], ["depot #8", "8"], ["depot #8", "8"]]],
  [{ kind: "collection-spacing-blocked", detail: { collectorEntityId: "7", blockingEntityId: "8", actualDistance: 8, requiredDistance: 42 } }, [["Collector 7", "7"], ["collector 8", "8"]]],
  [{ kind: "collection-rejected", detail: { actorEntityId: "7", code: "bad_source", resourceTypeId: "ore42", sourceEntityId: "8", depotEntityId: "9" } }, [["Worker 7", "7"], ["source #8", "8"], ["depot #9", "9"]]],
  // Target deliberately has the same label as the worker, but a different ID.
  [{ kind: "collection-delivering-cargo", entityId: 7, resourceTypeId: "ore42", target: "Worker 7", targetEntityId: "9" }, [["Worker 7", "7"], ["Worker 7", "9"]]],
  [{ kind: "collection-delivering-cargo", entityId: 7, resourceTypeId: "ore42", target: "nearest depot #42" }, [["Worker 7", "7"]]],
  [{ kind: "collection-rejected", detail: { actorEntityId: "7", code: "bad_source" } }, [["Worker 7", "7"]]],
  [{ kind: "waypoints-cleared", message: "42 waypoints cleared" }, []],
] satisfies [MessageInput, string[][]][])("records exact entity occurrences for %j", (input, expected) => {
  const content = formatMessage(input);
  expect(messageEntityLinks(content).map(link => [content.message.slice(link.start, link.end), link.entityId])).toEqual(expected);
});
