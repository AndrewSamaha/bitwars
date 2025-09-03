// schema/mappers.ts
import type { Entity } from "./entity";
import type { EntityDoc } from "./entityDoc";

export const toEntityDoc = (e: Entity): EntityDoc => ({
  ...e,
  createdAt: e.createdAt.toISOString(),
  updatedAt: e.updatedAt.toISOString(),
});

export const fromEntityDoc = (d: EntityDoc): Entity => {
  return {
    ...d,
    createdAt: new Date(d.createdAt),
    updatedAt: new Date(d.updatedAt),
  };
};
