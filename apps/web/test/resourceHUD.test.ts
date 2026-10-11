import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ResourceHUD } from "@/features/hud/components/ResourceHUD";

const hud = vi.hoisted(() => ({ selectedId: null as string | null }));
const world = vi.hoisted(() => ({ entities: [] as Array<{
  id: number;
  resources?: Array<{ resource_type: string; amount: number }>;
  remembered?: { last_seen_at: number };
}> }));
vi.mock("@/features/hud/components/HUDContext", () => ({
  useHUD: () => ({ selectors: { firstSelectedId: hud.selectedId }, state: { resources: { food: 9999 } } }),
}));
vi.mock("@/features/gamestate/world", () => ({ game: { world: { with: () => world.entities } } }));
vi.mock("@/features/audio/components/AudioToggle", () => ({ AudioToggle: () => null }));

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
    world.entities = [{ id: 2, remembered: { last_seen_at: 1 }, resources: [{ resource_type: "food", amount: 900 }] }];
    expect(render()).toContain('aria-label="Resources: food —, minerals —, energy —"');
  });
});
