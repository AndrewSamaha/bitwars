import { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { createPixiStoryApplication } from "../../../../.storybook/pixi";
import {
  createGameEntityVisual,
  loadGameEntityTextures,
  updateGameEntityVisual,
} from "./entityVisuals";

const STORY_SIZE = 360;

function StarYellowEffect() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
    let app: Awaited<ReturnType<typeof createPixiStoryApplication>> | undefined;

    const start = async () => {
      app = await createPixiStoryApplication({
        width: STORY_SIZE,
        height: STORY_SIZE,
        background: 0x05_08_10,
      });
      if (disposed) {
        app.destroy({ removeView: true }, { children: true });
        return;
      }
      host.appendChild(app.canvas);
      const textureCache = await loadGameEntityTextures(["star_yellow"]);
      if (disposed) return;

      const visual = createGameEntityVisual(textureCache, "star_yellow");
      visual.container.position.set(STORY_SIZE / 2, STORY_SIZE / 2);
      visual.container.scale.set(1.5);
      app.stage.addChild(visual.container);
      app.ticker.add(() => updateGameEntityVisual(visual, "star_yellow", performance.now()));
    };

    void start();
    return () => {
      disposed = true;
      app?.destroy({ removeView: true }, { children: true });
    };
  }, []);

  return <div ref={hostRef} style={{ border: "1px solid #263244", lineHeight: 0, width: STORY_SIZE }} />;
}

const meta = {
  title: "PoC Pixi/Entities/Star yellow effect",
  component: StarYellowEffect,
} satisfies Meta<typeof StarYellowEffect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Alive: Story = {};
