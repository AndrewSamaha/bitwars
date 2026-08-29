import { Container, Graphics, Sprite, type Texture } from "pixi.js";
import { drawRadiationRanges, type RadiationSource } from "../radiationRanges";
import { createStarYellowFilter, setStarYellowFilterTime } from "../shaders/starYellow";

const ENABLE_SHADERS = process.env.NEXT_PUBLIC_ENABLE_SHADERS === "1";

export type StarVisualProps = {
  /** The already-loaded star texture to render. */
  texture: Texture;
  /** Content-shaped sources, exposed for prototype range visualization. */
  radiationSources?: readonly RadiationSource[];
  /** Render the supplied radiation bands beneath the star. Defaults to false for gameplay. */
  showRadiationRanges?: boolean;
};

export type StarVisual = {
  container: Container;
  sprite: Sprite;
  update: (elapsedMs: number) => void;
};

/** Creates the persistent visual treatment for a star entity. */
export function createStarVisual({
  texture,
  radiationSources,
  showRadiationRanges = false,
}: StarVisualProps): StarVisual {
  const container = new Container();

  if (showRadiationRanges) {
    const ranges = new Graphics();
    drawRadiationRanges(ranges, radiationSources, 0, 0);
    container.addChild(ranges);
  }

  const sprite = Sprite.from(texture);
  sprite.anchor.set(0.5);
  const filter = ENABLE_SHADERS ? createStarYellowFilter() : undefined;
  if (filter) sprite.filters = [filter];
  container.addChild(sprite);

  return {
    container,
    sprite,
    update: (elapsedMs) => {
      if (filter) setStarYellowFilterTime(filter, elapsedMs);
    },
  };
}
