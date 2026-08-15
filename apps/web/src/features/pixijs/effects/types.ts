import type { Entity } from "@/features/gamestate/world";

export type Vec2 = { x: number; y: number };

/**
 * The small read-only world surface effects need. GameStage supplies the live
 * ECS world; Storybook supplies deterministic fixtures without server mocks.
 */
export type RenderEffectsWorld = {
  entities: () => Iterable<Entity>;
  getEntityType: (entityTypeId: string) => {
    resource_node?: { resource_type?: string };
    radiation_sources?: Array<{ max_effective_distance?: number }>;
  } | undefined;
};
