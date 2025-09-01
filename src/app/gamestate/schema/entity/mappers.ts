// schema/mappers.ts
import type { Entity } from "./entity";
import type { EntityDoc } from "./entityDoc";

export const toEntityDoc = (e: Entity): EntityDoc => ({
  ...e,
  pos_str: `${e.pos[0]},${e.pos[1]}`,
  createdAt: e.createdAt.toISOString(),
  updatedAt: e.updatedAt.toISOString(),
});

export const fromEntityDoc = (d: EntityDoc): Entity => {
  const { pos_str, ...rest } = d;
  return {
    ...rest,
    createdAt: new Date(d.createdAt),
    updatedAt: new Date(d.updatedAt),
  };
};
