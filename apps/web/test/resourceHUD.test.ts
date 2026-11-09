import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ResourceHUD } from "@/features/hud/components/ResourceHUD";

const hud = vi.hoisted(() => ({ selectedId: null as string | null }));
const world = vi.hoisted(() => ({ entities: [] as Array<{
  id: number;
  entity_type_id?: string;
  owner_player_id?: string;
  pos?: { x: number; y: number };
  health?: number;
  supply?: { depot_id: number; operational: boolean; missing_resources: string[]; waiting_for: string };
  resources?: Array<{ resource_type: string; amount: number }>;
  remembered?: { last_seen_tick: string | number };
}> }));
vi.mock("@/features/hud/components/HUDContext", () => ({
  useHUD: () => ({ selectors: { firstSelectedId: hud.selectedId }, state: { resources: { food: 9999 } } }),
}));
vi.mock("@/features/gamestate/world", () => ({ game: { world: { with: () => world.entities } } }));
vi.mock("@/features/audio/components/AudioToggle", () => ({ AudioToggle: () => null }));
vi.mock("@/features/content/contentManager", () => ({
  contentManager: {
    getContent: () => ({ entity_types: {
      processor: { depot: true, depot_range: 2000 },
      planet_blue_inhabitated: { depot: true, depot_range: 4000 },
      food_storage_container: { depot: true, depot_range: 2000, shareable_with_hub: ["food"] },
      vault: { depot: true, depot_range: 100, shareable_with_hub: ["energy", "crystals"] },
      worker: { collector: { transport_rate_per_second: 8 } },
    }, resource_types: {
      food: { display_name: "Food", order: 1 },
      minerals: { display_name: "Minerals", order: 2 },
      energy: { display_name: "Energy", order: 3 },
    } }),
  },
}));

// The app uses Next's automatic JSX runtime; Vitest uses the classic runtime.
vi.stubGlobal("React", React);
afterAll(() => vi.unstubAllGlobals());

const render = () => renderToStaticMarkup(React.createElement(ResourceHUD));

describe("selected entity resource banner", () => {
  beforeEach(() => {
    hud.selectedId = null;
    world.entities = [];
  });

  it("shows selected inventory, including zero, with no expansion or maximum", () => {
    world.entities = [
      { id: 1, resources: [{ resource_type: "food", amount: 900 }] },
      { id: 2, resources: [{ resource_type: "food", amount: 12.34 }, { resource_type: "energy", amount: 56.5 }] },
    ];
    hud.selectedId = "2";
    const html = render();
    expect(html).toContain('aria-label="Resources: food 12, minerals 0, energy 57"');
    expect(html.match(/w-\[5ch\] shrink-0 text-right font-medium tabular-nums/g)).toHaveLength(3);
    expect(html).not.toContain("9999");
    expect(html).not.toContain("900");
    expect(html).not.toContain("button");
    expect(html).not.toContain("aria-expanded");
    expect(html).not.toContain("max");
  });

  it("shows dashes when nothing is selected or the entity is gone", () => {
    expect(render()).toContain('aria-label="Resources: food —, minerals —, energy —"');
    hud.selectedId = "2";
    expect(render()).toContain('aria-label="Resources: food —, minerals —, energy —"');
  });

  it("does not show stale inventory for a remembered entity", () => {
    hud.selectedId = "2";
    world.entities = [{ id: 2, remembered: { last_seen_tick: 1 }, resources: [{ resource_type: "food", amount: 900 }] }];
    expect(render()).toContain('aria-label="Resources: food —, minerals —, energy —"');
  });

  it("shows separate physical and spendable hub stock, updating from live linked containers", () => {
    hud.selectedId = "1";
    world.entities = [
      { id: 1, entity_type_id: "processor", owner_player_id: "me", pos: { x: 0, y: 0 },
        resources: [{ resource_type: "food", amount: 5 }, { resource_type: "energy", amount: 10 }] },
      { id: 2, entity_type_id: "food_storage_container", owner_player_id: "me", pos: { x: 200, y: 0 },
        resources: [{ resource_type: "food", amount: 30 }, { resource_type: "energy", amount: 100 }] },
    ];
    expect(render()).toContain('aria-label="Resources: food 5, minerals 0, energy 10"');
    expect(render()).toContain('aria-label="Spendable: food 35, minerals 0, energy 10"');
    world.entities[1].resources = [{ resource_type: "food", amount: 7 }];
    expect(render()).toContain('aria-label="Spendable: food 12, minerals 0, energy 10"');
    world.entities[1].health = 0;
    expect(render()).toContain('aria-label="Spendable: food 5, minerals 0, energy 10"');
  });

  it("shows the selected consumer's associated hub rather than its own cargo or a closer container", () => {
    hud.selectedId = "3";
    world.entities = [
      { id: 1, entity_type_id: "planet_blue_inhabitated", owner_player_id: "me", pos: { x: 0, y: 0 },
        resources: [{ resource_type: "food", amount: 5 }] },
      { id: 2, entity_type_id: "food_storage_container", owner_player_id: "me", pos: { x: 200, y: 0 },
        resources: [{ resource_type: "food", amount: 30 }] },
      { id: 3, entity_type_id: "worker", owner_player_id: "me", pos: { x: 201, y: 0 },
        resources: [{ resource_type: "food", amount: 100 }],
        supply: { depot_id: 2, operational: true, missing_resources: [], waiting_for: "" } },
    ];
    expect(render()).toContain("Depot 1 stock");
    expect(render()).toContain('aria-label="Resources: food 5, minerals 0, energy 0"');
    expect(render()).toContain('aria-label="Spendable: food 35, minerals 0, energy 0"');
    world.entities[1].pos = { x: 3900, y: 0 };
    world.entities[2].pos = { x: 4100, y: 0 };
    expect(render()).toContain("Depot 2 stock");
    expect(render()).not.toContain('aria-label="Spendable: food 35, minerals 0, energy 0"');
  });

  it("shows configured multi-resource storage in hub spendable stock but not unlisted stock", () => {
    hud.selectedId = "1";
    world.entities = [
      { id: 1, entity_type_id: "processor", owner_player_id: "me", pos: { x: 0, y: 0 },
        resources: [{ resource_type: "energy", amount: 10 }] },
      { id: 2, entity_type_id: "vault", owner_player_id: "me", pos: { x: 1500, y: 0 },
        resources: [{ resource_type: "energy", amount: 30 }, { resource_type: "crystals", amount: 20 }, { resource_type: "food", amount: 40 }] },
    ];
    expect(render()).toContain('aria-label="Spendable: food 0, minerals 0, energy 40, crystals 20"');
    hud.selectedId = "2";
    expect(render()).not.toContain("Spendable:");
    expect(render()).toContain('aria-label="Resources: food 40, minerals 0, energy 30, crystals 20"');
  });
});
