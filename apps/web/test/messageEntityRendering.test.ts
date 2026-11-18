import React, { act } from "react";
import { create, type ReactTestRenderer } from "react-test-renderer";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { EntityLinkedText } from "@/features/hud/components/EntityLinkedText";
import { formatMessage, type MessageInput } from "@/features/hud/messages";
import { appendMessageLog, messageEntityLinks, type MessageLogEntry } from "@/features/hud/messageLog";
import { executeTerminalCommand } from "@/features/hud/terminal/commands";
import { CENTER_CAMERA_ON_ENTITY_EVENT } from "@/features/gamestate/events";

let root: ReactTestRenderer;
const dispatch = vi.fn();
beforeEach(() => {
  vi.stubGlobal("React", React);
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("window", { dispatchEvent: dispatch });
  dispatch.mockClear();
});
afterEach(async () => {
  if (root) await act(async () => root.unmount());
  vi.unstubAllGlobals();
});
const inputs: MessageInput[] = [
  { kind: "laser-fired", origin: { x: 1, y: 2 }, target: { x: 3, y: 4 }, attacker: { label: "laser frigate #7", entityId: "7" }, targetEntity: { label: "Entity #18446744073709551615", entityId: "18446744073709551615" } },
  { kind: "laser-fired", origin: { x: 1, y: 2 }, target: { x: 3, y: 4 }, targetEntity: { label: "Entity #8", entityId: "8" }, count: 3 },
  { kind: "collection-rerouted", detail: { entityId: 7, fromDepotId: 8, toDepotId: 8 } },
  { kind: "collection-spacing-blocked", detail: { collectorEntityId: "7", blockingEntityId: "8", actualDistance: 8, requiredDistance: 42 } },
  { kind: "collection-rejected", detail: { actorEntityId: "7", code: "bad_source", sourceEntityId: "8", depotEntityId: "9" } },
  { kind: "collection-delivering-cargo", entityId: 7, resourceTypeId: "ore42", target: "Worker 7", targetEntityId: "9" },
  { kind: "collection-delivering-cargo", entityId: 7, resourceTypeId: "ore42", target: "nearest depot #42" },
  { kind: "collection-spacing-waiting", collectorEntityId: "7" },
  { kind: "waypoints-cleared", message: "42 waypoints cleared" },
];
const expected = [ ["7", "18446744073709551615"], ["8"], ["7", "8", "8"], ["7", "8"], ["7", "8", "9"], ["7", "9"], ["7"], ["7"], [] ];
it.each(["toast", "log", "log -ts"])("dispatches each occurrence's own ID in %s, without needing a live entity", async (surface) => {
  const entries: MessageLogEntry[] = [];
  for (const input of inputs) entries.push({ kind: input.kind, ...formatMessage(input), timestamp: 123 });
  const stored = entries.reduce((log, entry) => appendMessageLog(log, entry), [] as MessageLogEntry[]);
  const renderings = surface === "toast"
    ? stored.map(entry => ({ text: entry.message, links: messageEntityLinks(entry) }))
    : [await executeTerminalCommand(surface, {
      realPlayerId: "p", effectivePlayerId: "p", actingAsId: null, sessionStatus: "active", messageLog: stored,
      logout: async () => "", su: () => {}, exitSu: () => {},
    }).then(result => ({ text: result.output, links: result.links }))];
  const clicked: string[] = [];
  for (const rendering of renderings) {
    await act(async () => { root = create(React.createElement(EntityLinkedText, rendering)); });
    for (const button of root!.root.findAllByType("button")) {
      const event = { stopPropagation: vi.fn() };
      await act(async () => button.props.onClick(event));
      expect(event.stopPropagation).toHaveBeenCalledOnce();
      const dispatched = dispatch.mock.lastCall![0] as CustomEvent<string>;
      expect(dispatched.type).toBe(CENTER_CAMERA_ON_ENTITY_EVENT);
      expect(button.props.title).toBe(`Focus entity ${dispatched.detail}`);
      clicked.push(dispatched.detail);
    }
    await act(async () => root.unmount());
  }
  expect(clicked).toEqual(expected.flat());
});
it("respects the Terminal readiness guard", async () => {
  await act(async () => { root = create(React.createElement(EntityLinkedText, {
    text: "Worker 7", links: [{ start: 0, end: 8, entityId: "7" }], enabled: false,
  })); });
  await act(async () => root.root.findByType("button").props.onClick({ stopPropagation: vi.fn() }));
  expect(dispatch).not.toHaveBeenCalled();
});
