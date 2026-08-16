import { Container, Graphics } from "pixi.js";
import { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import type { EntityTypeDef } from "@/features/content/contentManager";
import { createPixiStoryApplication } from "../../../../.storybook/pixi";
import {
  createGameEntityVisual,
  loadGameEntityTextures,
  updateGameEntityVisual,
} from "./entityVisuals";
import { drawRadiationRanges } from "./radiationRanges";

const STORY_WIDTH = 960;
const STORY_HEIGHT = 720;
const STAR_VISUAL_SCALE = 5;

const STAR_RADIATION_SOURCES: NonNullable<EntityTypeDef["radiation_sources"]> = [{
  radiation_type: "stellar_heat",
  min_effective_distance_fill_color: "#ef4444",
  full_damage_distance_fill_color: "#f97316",
  max_effective_distance_fill_color: "#facc15",
  min_effective_distance: 0,
  full_damage_distance: 400,
  max_effective_distance: 900,
}];

type StarYellowRadiationRangesProps = { zoom: number };

function StarYellowRadiationRanges({ zoom }: StarYellowRadiationRangesProps) {
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

      const ranges = new Graphics();
      drawRadiationRanges(ranges, STAR_RADIATION_SOURCES, 0, 0);
      worldContainer.addChild(ranges);

      const starVisual = createGameEntityVisual(textureCache, "star_yellow");
      starVisual.container.scale.set(STAR_VISUAL_SCALE);
      worldContainer.addChild(starVisual.container);
      app.ticker.add(() => updateGameEntityVisual(starVisual, "star_yellow", performance.now()));
    };

    void start();
    return () => {
      disposed = true;
      app?.destroy({ removeView: true }, { children: true });
    };
  }, [zoom]);

  return <div ref={hostRef} style={{ border: "1px solid #263244", lineHeight: 0, width: STORY_WIDTH }} />;
}

const meta = {
  title: "PoC Pixi/Entities/Star yellow radiation ranges",
  component: StarYellowRadiationRanges,
  args: { zoom: 0.42 },
  argTypes: {
    zoom: { control: { type: "range", min: 0.1, max: 0.7, step: 0.01 } },
  },
} satisfies Meta<typeof StarYellowRadiationRanges>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Overview: Story = {};
