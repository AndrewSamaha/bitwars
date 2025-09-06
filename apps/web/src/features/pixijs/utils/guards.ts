// helpers/pixiGuards.ts
import * as PIXI from "pixi.js";

export function isLiveSprite(s: PIXI.Sprite | undefined | null): s is PIXI.Sprite {
    // In v8, destroyed sprites set several props to null; they also expose a `destroyed` flag.
    // We guard both.
    return !!s && !(s as any).destroyed && !!s.position && !!s.scale;
}
  