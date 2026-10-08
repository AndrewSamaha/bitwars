import { describe, expect, it } from "vitest";
import { selectEntitiesOfTypeInView } from "@/features/pixijs/utils/typeSelection";

describe("double-click type selection", () => {
  it("selects owned entities of the same type in view, including partially visible sprites", () => {
    const candidate = (id: number, minX: number, minY = 10, type = "worker", owner = "me", remembered = false) => ({
      entity: { id, entity_type_id: type, owner_player_id: owner, ...(remembered ? { remembered: { last_seen_at: 1 } } : {}) },
      bounds: { minX, minY, maxX: minX + 20, maxY: minY + 20 },
    });
    const ids = selectEntitiesOfTypeInView([
      candidate(1, 10), candidate(2, 80), candidate(3, -10),
      candidate(4, -30), candidate(5, 101), candidate(6, 10, 101),
      candidate(7, 10, -30), candidate(8, 10, 10, "habitat"),
      candidate(9, 10, 10, "worker", "other"),
      candidate(10, 10, 10, "worker", "me", true),
    ], "worker", "me", { width: 100, height: 100 });
    expect(ids).toEqual(["1", "2", "3"]);
  });
});
