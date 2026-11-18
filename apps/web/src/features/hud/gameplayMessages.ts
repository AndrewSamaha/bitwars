import { BUILD_COMPLETED_EVENT, ENTITY_DETECTED_EVENT, ENTITY_EXPLODED_EVENT, ENTITY_UNDER_ATTACK_EVENT } from "@/features/gamestate/events";
import type { Entity } from "@/features/gamestate/world";
import type { MessageInput } from "./messages";

type Detection = Extract<MessageInput, { label: string }>;
type Laser = Extract<MessageInput, { kind: "laser-fired" }>;

/** One immediate entry, then counted batches. Critical lifecycle alerts never share a throttle. */
export function subscribeGameplayMessages(target: EventTarget, publish: (input: MessageInput) => void) {
  const cleanups: (() => void)[] = [];
  const listen = (name: string, handler: (event: Event) => void) => {
    target.addEventListener(name, handler);
    cleanups.push(() => target.removeEventListener(name, handler));
  };
  function batch<T extends Detection | Laser>(interval: number) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let pending: T | undefined;
    let count = 0;
    const flush = () => {
      timer = undefined;
      if (!pending) return;
      publish({ ...pending, count });
      pending = undefined;
      count = 0;
      timer = setTimeout(flush, interval);
    };
    cleanups.push(() => { if (timer !== undefined) clearTimeout(timer); });
    return (input: T) => {
      if (timer === undefined) {
        publish(input);
        timer = setTimeout(flush, interval);
      } else {
        pending = input;
        count++;
      }
    };
  }
  const detection = batch<Detection>(1_000);
  const laser = batch<Laser>(2_000);
  for (const [name, kind] of [
    [ENTITY_UNDER_ATTACK_EVENT, "entity-under-attack"],
    [ENTITY_DETECTED_EVENT, "entity-detected"],
    [BUILD_COMPLETED_EVENT, "build-completed"],
    [ENTITY_EXPLODED_EVENT, "entity-exploded"],
  ] as const) {
    listen(name, event => {
      const entity = (event as CustomEvent<Entity>).detail;
      if (!entity) return;
      const entityId = entity.id == null ? undefined : String(entity.id);
      const label = `${entity.entity_type_id?.replaceAll("_", " ") ?? "Entity"}${entityId ? ` #${entityId}` : ""}`;
      const input: Detection = { kind, entityId, label };
      if (kind === "entity-detected") detection(input);
      else publish(input);
    });
  }
  listen("bitwars:laser-shot", event => {
    const detail = (event as CustomEvent<Laser>).detail;
    if (!detail?.origin || !detail.target) return;
    laser({ kind: "laser-fired", origin: detail.origin, target: detail.target });
  });
  return () => { for (const cleanup of cleanups) cleanup(); };
}
