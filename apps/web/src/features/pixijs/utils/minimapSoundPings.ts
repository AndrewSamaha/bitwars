import type { Entity } from "@/features/gamestate/world";
import { BUILD_COMPLETED_EVENT, ENTITY_DETECTED_EVENT, ENTITY_EXPLODED_EVENT, ENTITY_UNDER_ATTACK_EVENT } from "@/features/gamestate/events";

type Position = { x: number; y: number };
const ENTITY_SOUND_EVENTS = [ENTITY_DETECTED_EVENT, BUILD_COMPLETED_EVENT, ENTITY_EXPLODED_EVENT, ENTITY_UNDER_ATTACK_EVENT];

/** Use the same semantic events as AudioEventBridge; the laser origin is its firing source. */
export function subscribeToMinimapSoundPings(notify: (position: Position, entityId?: number | string) => void): () => void {
  const onEntitySound = (event: Event) => {
    const entity = (event as CustomEvent<Entity>).detail;
    if (entity?.pos) notify(entity.pos, entity.id);
  };
  const onLaserShot = (event: Event) => {
    const shot = (event as CustomEvent<{ origin?: Position; target?: Position }>).detail;
    if (shot?.origin && shot.target) notify(shot.origin);
  };
  for (const name of ENTITY_SOUND_EVENTS) {
    window.addEventListener(name, onEntitySound);
  }
  window.addEventListener("bitwars:laser-shot", onLaserShot);
  return () => {
    for (const name of ENTITY_SOUND_EVENTS) {
      window.removeEventListener(name, onEntitySound);
    }
    window.removeEventListener("bitwars:laser-shot", onLaserShot);
  };
}
