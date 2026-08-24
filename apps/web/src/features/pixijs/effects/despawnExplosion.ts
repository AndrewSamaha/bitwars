import { Container, Rectangle, Sprite, Texture } from "pixi.js";
import type { Entity } from "@/features/gamestate/world";

type Fragment = {
  sprite: Sprite;
  velocityX: number;
  velocityY: number;
  angularVelocity: number;
};

type Explosion = {
  container: Container;
  fragments: Fragment[];
  startedAt: number;
  lastUpdatedAt: number;
  lifetimeMs: number;
};

type FragmentFrame = { x: number; y: number; width: number; height: number };

const MIN_FRAGMENT_COUNT = 4;
const MAX_FRAGMENT_COUNT = 8;

/**
 * Splits a frame by repeatedly cutting one of its largest pieces. This yields
 * exactly 4–8 non-overlapping rectangular fragments without requiring masks.
 */
function splitFrame(frame: FragmentFrame, count: number): FragmentFrame[] {
  const pieces = [frame];
  while (pieces.length < count) {
    let largestIndex = 0;
    let largestArea = 0;
    for (let index = 0; index < pieces.length; index += 1) {
      const piece = pieces[index];
      const area = piece.width * piece.height;
      if (area > largestArea) {
        largestArea = area;
        largestIndex = index;
      }
    }

    const piece = pieces[largestIndex];
    const splitVertically = piece.width >= piece.height;
    const ratio = 0.35 + Math.random() * 0.3;
    const first = splitVertically
      ? { ...piece, width: Math.max(1, Math.round(piece.width * ratio)) }
      : { ...piece, height: Math.max(1, Math.round(piece.height * ratio)) };
    const second = splitVertically
      ? { x: piece.x + first.width, y: piece.y, width: piece.width - first.width, height: piece.height }
      : { x: piece.x, y: piece.y + first.height, width: piece.width, height: piece.height - first.height };
    pieces.splice(largestIndex, 1, first, second);
  }
  return pieces;
}

/** Client-only sprite breakup shown whenever an entity is removed by the stream. */
export function createDespawnExplosionSystem(worldContainer: Container) {
  const effectContainer = new Container();
  effectContainer.label = "despawnExplosions";
  effectContainer.eventMode = "none";
  effectContainer.zIndex = 999_999;
  worldContainer.addChild(effectContainer);
  const explosions: Explosion[] = [];

  const explode = (entity: Entity) => {
    const sourceContainer = entity.pixiContainer;
    const sourceSprite = sourceContainer?.children.find((child): child is Sprite => child instanceof Sprite);
    if (!sourceContainer || !sourceSprite || !entity.pos) return;

    const sourceTexture = sourceSprite.texture;
    const frame = sourceTexture.frame;
    if (frame.width < 2 || frame.height < 2) return;

    const container = new Container();
    container.position.copyFrom(sourceContainer.position);
    container.scale.copyFrom(sourceContainer.scale);
    container.rotation = sourceContainer.rotation;
    container.eventMode = "none";
    effectContainer.addChild(container);

    const fragmentCount = MIN_FRAGMENT_COUNT + Math.floor(Math.random() * (MAX_FRAGMENT_COUNT - MIN_FRAGMENT_COUNT + 1));
    const fragments = splitFrame({ x: frame.x, y: frame.y, width: frame.width, height: frame.height }, fragmentCount)
      .map((fragmentFrame) => {
        const texture = new Texture({
          source: sourceTexture.source,
          frame: new Rectangle(fragmentFrame.x, fragmentFrame.y, fragmentFrame.width, fragmentFrame.height),
        });
        const sprite = new Sprite(texture);
        sprite.anchor.set(0.5);
        sprite.position.set(
          fragmentFrame.x - frame.x + fragmentFrame.width / 2 - sourceTexture.orig.width / 2,
          fragmentFrame.y - frame.y + fragmentFrame.height / 2 - sourceTexture.orig.height / 2,
        );
        container.addChild(sprite);

        const direction = Math.random() * Math.PI * 2;
        const speed = 75 + Math.random() * 370;
        return {
          sprite,
          velocityX: Math.cos(direction) * speed,
          velocityY: Math.sin(direction) * speed,
          angularVelocity: (Math.random() - 0.5) * 14,
        };
      });
    const startedAt = performance.now();
    explosions.push({ container, fragments, startedAt, lastUpdatedAt: startedAt, lifetimeMs: 500 + Math.random() * 1300 });
  };

  const update = (nowMs: number) => {
    for (let index = explosions.length - 1; index >= 0; index -= 1) {
      const explosion = explosions[index];
      const elapsedMs = nowMs - explosion.startedAt;
      const progress = elapsedMs / explosion.lifetimeMs;
      if (progress >= 1) {
        explosion.container.destroy({ children: true, texture: true, textureSource: false });
        explosions.splice(index, 1);
        continue;
      }
      const elapsedSeconds = (nowMs - explosion.lastUpdatedAt) / 1000;
      explosion.lastUpdatedAt = nowMs;
      for (const fragment of explosion.fragments) {
        fragment.sprite.position.x += fragment.velocityX * elapsedSeconds;
        fragment.sprite.position.y += fragment.velocityY * elapsedSeconds;
        fragment.sprite.rotation += fragment.angularVelocity * elapsedSeconds;
        fragment.sprite.alpha = 1 - progress;
      }
    }
  };

  const destroy = () => {
    explosions.length = 0;
    effectContainer.destroy({ children: true, texture: true, textureSource: false });
  };

  return { explode, update, destroy };
}
