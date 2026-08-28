import { describe, expect, it } from "vitest";
import { getOwnedSensorSources } from "@/features/pixijs/renderer/visibilityFog";

describe("getOwnedSensorSources", () => {
  it("uses only the current player's sensor ranges", () => {
    const sources = getOwnedSensorSources(
      [
        { owner_player_id: "me", entity_type_id: "sensor", pos: { x: 10, y: 20 } },
        { owner_player_id: "other", entity_type_id: "sensor", pos: { x: 30, y: 40 } },
        { owner_player_id: "me", entity_type_id: "bright-star", pos: { x: 50, y: 60 } },
      ],
      "me",
      (type) => type === "sensor" ? 4_000 : undefined,
    );

    expect(sources).toEqual([{ x: 10, y: 20, range: 4_000 }]);
  });
});
