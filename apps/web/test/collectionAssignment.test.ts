import React from "react";
import type * as ReactModule from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import type { Entity } from "../src/features/gamestate/world";

const state = vi.hoisted(() => ({ effective: 1001 }));
vi.mock("react", async (importOriginal) => ({
  ...await importOriginal<typeof ReactModule>(),
  useSyncExternalStore: (_subscribe: unknown, snapshot: () => unknown) => snapshot(),
}));
vi.mock("@/features/content/contentManager", () => ({ contentManager: {
  subscribe: () => () => {}, getContentVersion: () => "test",
  getEntityType: () => ({ collector: { collects: ["minerals"], transport_rate_per_second: 8 } }),
  getResourceType: () => ({ display_name: "Minerals" }),
} }));
vi.mock("@/features/collection-routing/collectionRouting", () => ({ collectionRouting: {
  subscribe: () => () => {}, getStatus: () => "", getEffectiveDestinationId: () => state.effective,
} }));
vi.mock("@/features/gamestate/world", () => ({ game: { world: { with: () => [
  { id: 1002, entity_type_id: "food_storage_container" },
  { id: 1001, entity_type_id: "mineral_storage_container" },
] } } }));

import { CollectionAssignment } from "../src/features/hud/components/CollectionAssignment";

it("distinguishes a retained manual assignment from its automatically rerouted physical drop-off", () => {
  const worker: Entity = { id: 974, entity_type_id: "worker", supply: {
    depot_id: 937, delivery_depot_id: 1002, missing_resources: [], operational: true, waiting_for: "",
  } };
  const render = () => renderToStaticMarkup(React.createElement(CollectionAssignment, { entity: worker }));
  expect(render()).toContain("food storage container #1002 (assigned); delivering to mineral storage container #1001");
  state.effective = 1002;
  expect(render()).toContain("food storage container #1002 (assigned)");
  expect(render()).not.toContain("delivering to");
});
