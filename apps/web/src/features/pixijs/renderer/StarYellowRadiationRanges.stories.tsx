import { Container } from "pixi.js";
import { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { EntityTypeDef } from "@/features/content/contentManager";
import { createPixiStoryApplication } from "../../../../.storybook/pixi";
import { getGameEntityTexture, loadGameEntityTextures } from "./entityVisuals";
import { createStarVisual } from "./entities/starVisual";

const STORY_WIDTH = 960;
const STORY_HEIGHT = 720;
type StarYellowRadiationRangesProps = {
  zoom: number;
  visualScale: number;
  minEffectiveDistance: number;
  fullDamageDistance: number;
  maxEffectiveDistance: number;
  minEffectiveDistanceFillColor: string;
  fullDamageDistanceFillColor: string;
  maxEffectiveDistanceFillColor: string;
};

function StarYellowRadiationRanges({
  zoom,
  visualScale,
  minEffectiveDistance,
  fullDamageDistance,
  maxEffectiveDistance,
  minEffectiveDistanceFillColor,
  fullDamageDistanceFillColor,
  maxEffectiveDistanceFillColor,
}: StarYellowRadiationRangesProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let app: Awaited<ReturnType<typeof createPixiStoryApplication>> | undefined;

    const start = async () => {
      app = await createPixiStoryApplication({
        width: STORY_WIDTH,
        height: STORY_HEIGHT,
        background: 0x05_08_10,
      });
      if (disposed) {
        app.destroy({ removeView: true }, { children: true });
        return;
      }
      host.appendChild(app.canvas);

      const textureCache = await loadGameEntityTextures(["star_yellow"]);
      if (disposed) return;

      const worldContainer = new Container();
      worldContainer.position.set(STORY_WIDTH / 2, STORY_HEIGHT / 2);
      worldContainer.scale.set(zoom);
      app.stage.addChild(worldContainer);

      const radiationSources: NonNullable<EntityTypeDef["radiation_sources"]> = [{
        radiation_type: "stellar_heat",
        min_effective_distance_fill_color: minEffectiveDistanceFillColor,
        full_damage_distance_fill_color: fullDamageDistanceFillColor,
        max_effective_distance_fill_color: maxEffectiveDistanceFillColor,
        min_effective_distance: minEffectiveDistance,
        full_damage_distance: fullDamageDistance,
        max_effective_distance: maxEffectiveDistance,
      }];
      const starVisual = createStarVisual({
        texture: getGameEntityTexture(textureCache, "star_yellow"),
        radiationSources,
        showRadiationRanges: true,
      });
      // Ranges are expressed in world units; only the painted star responds to visual scale.
      starVisual.sprite.scale.set(visualScale);
      worldContainer.addChild(starVisual.container);
      app.ticker.add(() => starVisual.update(performance.now()));
    };

    void start();
    return () => {
      disposed = true;
      app?.destroy({ removeView: true }, { children: true });
    };
  }, [
    fullDamageDistance,
    fullDamageDistanceFillColor,
    maxEffectiveDistance,
    maxEffectiveDistanceFillColor,
    minEffectiveDistance,
    minEffectiveDistanceFillColor,
    visualScale,
    zoom,
  ]);

  return <div ref={hostRef} style={{ border: "1px solid #263244", lineHeight: 0, width: STORY_WIDTH }} />;
}

const meta = {
  title: "PoC Pixi/Entities/Star yellow radiation ranges",
  component: StarYellowRadiationRanges,
  args: {
    zoom: 0.42,
    visualScale: 5,
    minEffectiveDistance: 0,
    fullDamageDistance: 400,
    maxEffectiveDistance: 900,
    minEffectiveDistanceFillColor: "#ef4444",
    fullDamageDistanceFillColor: "#f97316",
    maxEffectiveDistanceFillColor: "#facc15",
  },
  argTypes: {
    zoom: { control: { type: "range", min: 0.1, max: 0.7, step: 0.01 } },
    visualScale: { control: { type: "range", min: 1, max: 12, step: 0.25 } },
    minEffectiveDistance: { control: { type: "range", min: 0, max: 1200, step: 25 } },
    fullDamageDistance: { control: { type: "range", min: 0, max: 1200, step: 25 } },
    maxEffectiveDistance: { control: { type: "range", min: 0, max: 1200, step: 25 } },
    minEffectiveDistanceFillColor: { control: "color" },
    fullDamageDistanceFillColor: { control: "color" },
    maxEffectiveDistanceFillColor: { control: "color" },
  },
} satisfies Meta<typeof StarYellowRadiationRanges>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
