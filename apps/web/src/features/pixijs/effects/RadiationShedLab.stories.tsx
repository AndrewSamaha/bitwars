import { Application, Container, Graphics } from "pixi.js";
import { useEffect, useRef } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import {
  drawRadiationShedEffect,
  RADIATION_SHED_DURATION_MS,
  type RadiationShedEffect,
} from "./renderEffects";

type ShipType = "collector_solar" | "worker";

type RadiationShedLabProps = {
  angleDegrees: number;
  distance: number;
  shipType: ShipType;
};

const STAR_X = 380;
const STAR_Y = 280;
const LAB_WIDTH = 760;
const LAB_HEIGHT = 560;

function radiationDamagePerSecond(distance: number, shipType: ShipType): number {
  const effectiveDistance = distance + (shipType === "collector_solar" ? 90 : 0);
  if (effectiveDistance > 180) return 0;
  const rawDamage = effectiveDistance <= 80
    ? 24
    : 24 * (180 - effectiveDistance) / 100;
  return rawDamage * (shipType === "collector_solar" ? 0.35 : 1);
}

function createStar() {
  const star = new Graphics();
  star.circle(0, 0, 64).fill({ color: 0xff_a51f, alpha: 0.13 });
  star.circle(0, 0, 43).fill({ color: 0xff_c43d, alpha: 0.25 });
  star.circle(0, 0, 26).fill({ color: 0xff_d86a, alpha: 0.9 });
  star.circle(-7, -8, 12).fill({ color: 0xff_f4_b5, alpha: 0.9 });
  return star;
}

function createShip(shipType: ShipType) {
  const ship = new Container();
  const hullColor = shipType === "collector_solar" ? 0xff_c84d : 0x85_caff;
  const hull = new Graphics();
  hull.roundRect(-46, -27, 92, 54, 14).fill({ color: 0x19_24_36 });
  hull.roundRect(-40, -21, 80, 42, 10).stroke({ width: 5, color: hullColor, alpha: 0.95 });
  hull.circle(0, 0, 12).fill({ color: 0xe7_f7_ff, alpha: 0.9 });
  ship.addChild(hull);
  return ship;
}

function RadiationShedLab({ angleDegrees, distance, shipType }: RadiationShedLabProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const app = new Application();
    let disposed = false;

    const start = async () => {
      await app.init({
        width: LAB_WIDTH,
        height: LAB_HEIGHT,
        antialias: true,
        background: 0x05_08_10,
      });
      if (disposed) {
        app.destroy();
        return;
      }
      host.appendChild(app.canvas);

      const star = createStar();
      star.position.set(STAR_X, STAR_Y);
      app.stage.addChild(star);

      const angleRadians = angleDegrees * Math.PI / 180;
      // The lab scales game-world range into an inspectable viewport while the
      // readout below retains the real simulation distance in world units.
      const renderDistance = 85 + Math.min(180, Math.max(0, distance)) * 1.55;
      const ship = createShip(shipType);
      ship.position.set(
        STAR_X + Math.cos(angleRadians) * renderDistance,
        STAR_Y + Math.sin(angleRadians) * renderDistance,
      );
      ship.rotation = angleRadians + Math.PI / 2;
      app.stage.addChild(ship);

      const particles = new Graphics();
      particles.eventMode = "none";
      ship.addChild(particles);

      const tick = () => {
        const nowMs = performance.now();
        const effect: RadiationShedEffect = {
          key: "radiation-shed-lab",
          kind: "radiation_shed",
          startedAtMs: nowMs - (nowMs % RADIATION_SHED_DURATION_MS),
          sourceWorldPos: { x: STAR_X, y: STAR_Y },
        };
        drawRadiationShedEffect(particles, ship, effect, nowMs);
      };
      app.ticker.add(tick);
    };

    void start();
    return () => {
      disposed = true;
      app.destroy({ removeView: true }, { children: true });
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
