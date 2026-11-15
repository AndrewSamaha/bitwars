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
  expect(capacityMessage.focusLabel).toBe("Worker 973");
});

it("formats a reroute with its worker as the focus and both depot IDs", () => {
  const message = formatMessage({ kind: "collection-rerouted", detail: { entityId: 847, fromDepotId: 964, toDepotId: 947 } });
  expect(message.message).toContain("depot #964 to depot #947");
  expect(message.focusEntityId).toBe("847");
});
