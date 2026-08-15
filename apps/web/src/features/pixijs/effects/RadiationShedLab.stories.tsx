import { Assets, Container, Graphics, Sprite } from "pixi.js";
import { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  drawRadiationShedEffect,
  RADIATION_SHED_DURATION_MS,
  type RadiationShedEffect,
} from "./renderEffects";
import { createPixiStoryApplication } from "../../../../.storybook/pixi";

type ShipType = "collector_solar" | "worker";

type RadiationShedLabProps = {
  angleDegrees: number;
  distance: number;
  shipType: ShipType;
};

const LAB_WIDTH = 760;
const LAB_HEIGHT = 560;
const GAME_WORLD_SCALE = 0.5;
const DEFAULT_ENTITY_SCALE = 0.5;

function radiationDamagePerSecond(distance: number, shipType: ShipType): number {
  const effectiveDistance = distance + (shipType === "collector_solar" ? 90 : 0);
  if (effectiveDistance > 180) return 0;
  const rawDamage = effectiveDistance <= 80
    ? 24
    : 24 * (180 - effectiveDistance) / 100;
  return rawDamage * (shipType === "collector_solar" ? 0.35 : 1);
}

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

      const [starTexture, shipTexture] = await Promise.all([
        Assets.load("/assets/star_yellow/idle.png"),
        Assets.load(`/assets/${shipType}/idle.png`),
      ]);
      if (disposed) return;

      // This hierarchy matches GameStage exactly: world positions are scaled
      // by the camera container, while sprites/effects are scaled by their
      // entity container. Together, default unit art renders at 0.25x.
      const worldContainer = new Container();
      worldContainer.position.set(LAB_WIDTH / 2, LAB_HEIGHT / 2);
      worldContainer.scale.set(GAME_WORLD_SCALE);
      app.stage.addChild(worldContainer);
      worldContainer.addChild(createRangeGuides());

      const starEntity = new Container();
      starEntity.scale.set(DEFAULT_ENTITY_SCALE);
      const star = new Sprite(starTexture);
      star.anchor.set(0.5);
      starEntity.addChild(star);
      worldContainer.addChild(starEntity);

      const angleRadians = angleDegrees * Math.PI / 180;
      const ship = new Container();
      ship.position.set(
        Math.cos(angleRadians) * distance,
        Math.sin(angleRadians) * distance,
      );
      ship.scale.set(DEFAULT_ENTITY_SCALE);
      ship.rotation = angleRadians + Math.PI / 2;
      const shipSprite = new Sprite(shipTexture);
      shipSprite.anchor.set(0.5);
      ship.addChild(shipSprite);
      worldContainer.addChild(ship);

      const particles = new Graphics();
      particles.eventMode = "none";
      ship.addChild(particles);

      const tick = () => {
        const nowMs = performance.now();
        const effect: RadiationShedEffect = {
          key: "radiation-shed-lab",
          kind: "radiation_shed",
          startedAtMs: nowMs - (nowMs % RADIATION_SHED_DURATION_MS),
          sourceWorldPos: { x: 0, y: 0 },
        };
        drawRadiationShedEffect(particles, ship, effect, nowMs);
      };
      app.ticker.add(tick);
    };

    void start();
    return () => {
      disposed = true;
      app?.destroy({ removeView: true }, { children: true });
    };
  }, [angleDegrees, distance, shipType]);

  const damage = radiationDamagePerSecond(distance, shipType);
  return (
    <div style={{ color: "#dbeafe", fontFamily: "monospace" }}>
      <div ref={hostRef} style={{ border: "1px solid #263244", lineHeight: 0 }} />
      <p style={{ lineHeight: 1.5 }}>
        {shipType === "collector_solar" ? "Solar collector" : "Worker"} · {distance.toFixed(0)} units · {angleDegrees.toFixed(0)}° · expected stellar heat: {damage.toFixed(2)} DPS
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
