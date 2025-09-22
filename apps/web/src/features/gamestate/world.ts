// Singleton miniplex world
import { World } from "miniplex";
import * as PIXI from "pixi.js";

export type SpriteRef = { sprite: PIXI.Sprite };
export type Scale = { scale: number };
 
 // Proto-compatible component shapes coming from the stream
 export type ProtoPosition = { pos: { x: number; y: number } };
 export type ProtoVelocity = { vel: { x: number; y: number } };
 export type EntityId = { id: number | string };
 
 // Entity uses proto-shaped components (pos, vel, id) and render extras
 export type Entity = Partial<
   ProtoPosition &
   ProtoVelocity &
   EntityId &
   SpriteRef &
   Scale &
   { selectable?: true }
 >;

class GameWorld {
  world = new World<Entity>();
  last = performance.now();
  // Render/tick should wait until the first snapshot has been applied
  ready = false;

  tick(now: number) {
    const dt = (now - this.last) / 1000; // seconds
    this.last = now;

    // Proto-shaped movement (pos: {x,y}, vel: {x,y})
    for (const e of this.world.with("pos", "vel")) {
      if (e.pos && e.vel) {
        e.pos.x += e.vel.x * dt;
        e.pos.y += e.vel.y * dt;
      }
    }
  }
}

export const game = new GameWorld(); // module-singleton

