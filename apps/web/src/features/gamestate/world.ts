// Singleton miniplex world
import { World } from "miniplex";
import * as PIXI from "pixi.js";

export type Position = { x: number; y: number };
export type Velocity = { vx: number; vy: number };
export type SpriteRef = { sprite: PIXI.Sprite };
export type Scale = { scale: number };
 
 // Proto-compatible component shapes coming from the stream
 export type ProtoPosition = { pos: { x: number; y: number } };
 export type ProtoVelocity = { vel: { x: number; y: number } };
 export type EntityId = { id: number | string };
 
 // Entity now accepts both legacy (x,y,vx,vy) and proto (pos,vel,id) shapes.
 export type Entity = Partial<
   Position &
   Velocity &
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
