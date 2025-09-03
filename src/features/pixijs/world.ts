// Singleton miniplex world
import { World } from "miniplex";
import * as PIXI from "pixi.js";

export type Position = { x: number; y: number };
export type Velocity = { vx: number; vy: number };
export type SpriteRef = { sprite: PIXI.Sprite };

export type Entity = Partial<Position & Velocity & SpriteRef & { selectable?: true }>;

class GameWorld {
  world = new World<Entity>();
  last = performance.now();

  tick(now: number) {
    const dt = (now - this.last) / 1000; // seconds
    this.last = now;

    // movement
    for (const e of this.world.with("x", "y", "vx", "vy")) {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
    }
  }
}

export const game = new GameWorld(); // module-singleton
