import { Graphics } from "pixi.js";
import { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  reconcileEntityRenderEffects,
  RADIATION_SHED_DURATION_MS,
  type RenderEffectsWorld,
} from "./renderEffects";
import { createPixiStoryApplication } from "../../../../.storybook/pixi";
import {
  createGameEntityVisual,
  createGameWorldContainer,
  loadGameEntityTextures,
} from "@/features/pixijs/renderer/entityVisuals";
import type { Entity } from "@/features/gamestate/world";

type ShipType = "collector_solar" | "worker";

type RadiationShedLabProps = {
  angleDegrees: number;
  distance: number;
  shipType: ShipType;
};

const LAB_WIDTH = 760;
const LAB_HEIGHT = 560;
function createRangeGuides() {
  const guides = new Graphics();
  guides.circle(0, 0, 80).stroke({
    width: 1,
    color: 0xff_8b_3d,
    alpha: 0.34,
  });
  guides.circle(0, 0, 180).stroke({
    width: 1,
    color: 0xff_c8_51,
    alpha: 0.28,
  });
  return guides;
}

function RadiationShedLab({ angleDegrees, distance, shipType }: RadiationShedLabProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let app: Awaited<ReturnType<typeof createPixiStoryApplication>> | undefined;
    let disposed = false;

    const start = async () => {
      app = await createPixiStoryApplication({
        width: LAB_WIDTH,
        height: LAB_HEIGHT,
        background: 0x05_08_10,
      });
      if (disposed) {
        app.destroy({ removeView: true }, { children: true });
        return;
      }
      host.appendChild(app.canvas);

      const textureCache = await loadGameEntityTextures(["star_yellow", shipType]);
      if (disposed) return;

      const worldContainer = createGameWorldContainer();
      worldContainer.position.set(LAB_WIDTH / 2, LAB_HEIGHT / 2);
      app.stage.addChild(worldContainer);
      worldContainer.addChild(createRangeGuides());

      const starVisual = createGameEntityVisual(textureCache, "star_yellow");
      worldContainer.addChild(starVisual.container);

      const angleRadians = angleDegrees * Math.PI / 180;
      const shipVisual = createGameEntityVisual(textureCache, shipType);
      shipVisual.container.position.set(
        Math.cos(angleRadians) * distance,
        Math.sin(angleRadians) * distance,
      );
      shipVisual.container.rotation = angleRadians + Math.PI / 2;
      worldContainer.addChild(shipVisual.container);

      const starEntity: Entity = {
        id: "storybook-star",
        entity_type_id: "star_yellow",
        pos: { x: 0, y: 0 },
      };
      const shipEntity: Entity = {
        id: "storybook-ship",
        entity_type_id: shipType,
        pos: { x: shipVisual.container.x, y: shipVisual.container.y },
        health: 90,
      };
      const renderWorld: RenderEffectsWorld = {
        entities: () => [starEntity, shipEntity],
        getEntityType: (entityTypeId) => {
          if (entityTypeId === "star_yellow") {
            return { radiation_sources: [{ max_effective_distance: 180 }] };
          }
          return undefined;
        },
      };

      const tick = () => {
        const nowMs = performance.now();
        shipEntity.damage_flash_started_at = nowMs - (nowMs % RADIATION_SHED_DURATION_MS);
        reconcileEntityRenderEffects(shipVisual.container, shipEntity, nowMs, renderWorld);
      };
      app.ticker.add(tick);
    };

    void start();
    return () => {
      disposed = true;
      app?.destroy({ removeView: true }, { children: true });
    };
  }, [angleDegrees, distance, shipType]);

  return (
    <div style={{ color: "#dbeafe", fontFamily: "monospace" }}>
      <div ref={hostRef} style={{ border: "1px solid #263244", lineHeight: 0 }} />
      <p style={{ lineHeight: 1.5 }}>
        {shipType === "collector_solar" ? "Solar collector" : "Worker"} · {distance.toFixed(0)} units · {angleDegrees.toFixed(0)}°
      </p>
    </div>
  );
}

const meta = {
  title: "PoC Pixi/VFX/Radiation shedding",
  component: RadiationShedLab,
  args: {
    angleDegrees: 25,
    distance: 45,
    shipType: "worker",
  },
  argTypes: {
    angleDegrees: { control: { type: "range", min: 0, max: 360, step: 5 } },
    distance: { control: { type: "range", min: 0, max: 220, step: 5 } },
    shipType: { control: "radio", options: ["worker", "collector_solar"] },
  },
} satisfies Meta<typeof RadiationShedLab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WorkerNearStar: Story = {};

export const ShieldedCollector: Story = {
  args: { angleDegrees: 145, distance: 30, shipType: "collector_solar" },
};

export const SafeCollectionBand: Story = {
  args: { angleDegrees: 250, distance: 120, shipType: "collector_solar" },
};
