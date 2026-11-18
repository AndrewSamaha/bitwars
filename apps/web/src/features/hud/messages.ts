import { LifecycleReason } from "@bitwars/shared/gen/intent_pb";
import type {
  BuildRejectedDetail, CollectionDestinationChangedDetail, CollectionRejectedDetail,
  CollectionRoutingBlockedDetail, MinimumDistanceViolationDetail,
} from "@/features/gamestate/events";
import type { MessageLogEntry } from "./messageLog";

export const WAYPOINT_MIGRATION_MESSAGE = "Saved waypoints were cleared during this update. Reissue any remaining destinations.";

/** Each case represents a distinct source event, not a display title or delivery channel. */
export type MessageInput =
  | { kind: "entity-under-attack" | "entity-detected" | "build-completed" | "entity-exploded"; entityId?: string; label: string; count?: number }
  | { kind: "laser-fired"; origin: { x: number; y: number }; target: { x: number; y: number }; count?: number }
  | { kind: "waypoints-cleared"; message: string }
  | { kind: "collection-spacing-blocked"; detail: MinimumDistanceViolationDetail }
  | { kind: "build-rejected"; detail: BuildRejectedDetail }
  | { kind: "collection-rejected"; detail: CollectionRejectedDetail }
  | { kind: "collection-route-blocked"; detail: CollectionRoutingBlockedDetail }
  | { kind: "collection-rerouted"; detail: CollectionDestinationChangedDetail }
  | { kind: "collection-spacing-waiting"; collectorEntityId: string }
  | { kind: "collection-dropoff-blocked"; entityId: string; cargo: string }
  | { kind: "collection-capacity-blocked"; entityId: number; resourceTypeId: string }
  | { kind: "collection-delivering-cargo"; entityId: number; resourceTypeId: string; target: string; targetEntityId?: string }
  | { kind: "transport-endpoint-lost"; carrierEntityId: string }
  | { kind: "resource-starvation"; entityId: string; entityTypeId?: string }
  | { kind: "move-route-unavailable" }
  | { kind: "move-route-blocked"; reason: string }
  | { kind: "escort-invalid-target" };

export type MessageKind = MessageInput["kind"];
export type CommandFeedback = Extract<MessageInput, { kind: "move-route-unavailable" | "move-route-blocked" | "escort-invalid-target" }>;

type MessageContent = Omit<MessageLogEntry, "timestamp" | "kind">;

type EntityMention = { label: string; entityId: string };
const entity = (entityId: string | number, label: string): EntityMention => ({ entityId: String(entityId), label });

/** Build text and exact occurrence spans together, without parsing IDs from prose. */
function linked(strings: TemplateStringsArray, ...parts: (string | number | EntityMention)[]): Pick<MessageContent, "message" | "entityLinks"> {
  let message = strings[0];
  const entityLinks: NonNullable<MessageContent["entityLinks"]> = [];
  parts.forEach((part, index) => {
    if (typeof part === "object") {
      const start = message.length;
      message += part.label;
      entityLinks.push({ start, end: message.length, entityId: part.entityId });
    } else message += part;
    message += strings[index + 1];
  });
  return { message, entityLinks };
}

export function formatMessage(input: MessageInput): MessageContent {
  switch (input.kind) {
    case "entity-under-attack":
    case "entity-detected":
    case "build-completed":
    case "entity-exploded": {
      const titles = { "entity-under-attack": "Under attack", "entity-detected": "Entity detected", "build-completed": "Build completed", "entity-exploded": "Entity destroyed" };
      const verbs = { "entity-under-attack": "is under attack", "entity-detected": "entered sensor coverage", "build-completed": "completed construction", "entity-exploded": "was destroyed" };
      const mention = input.entityId ? entity(input.entityId, input.label) : input.label;
      const prefix = (input.count ?? 1) > 1 ? `${input.count} detections; latest: ` : "";
      return { title: titles[input.kind], ...linked`${prefix}${mention} ${verbs[input.kind]}.`, focusEntityId: input.entityId, focusLabel: input.label };
    }
    case "laser-fired": {
      const point = (p: { x: number; y: number }) => `(${Math.round(p.x)}, ${Math.round(p.y)})`;
      return { title: "Laser fire", message: `${input.count ?? 1} laser shot${(input.count ?? 1) === 1 ? "" : "s"}; ${(input.count ?? 1) > 1 ? "latest " : ""}from ${point(input.origin)} to ${point(input.target)}.` };
    }
    case "waypoints-cleared":
      return { title: "Saved waypoints cleared", message: input.message };
    case "collection-spacing-blocked": {
      const { collectorEntityId, blockingEntityId, actualDistance, requiredDistance } = input.detail;
      return { title: "Collection blocked",
        ...linked`${entity(collectorEntityId, `Collector ${collectorEntityId}`)} is ${Math.round(actualDistance)} units from ${entity(blockingEntityId, `collector ${blockingEntityId}`)}; ${Math.round(requiredDistance)} required. Click to focus it.`,
        focusEntityId: blockingEntityId };
    }
    case "build-rejected": {
      const { actorEntityId, blueprintId, missingTechnologyIds, resourceShortfalls, reason } = input.detail;
      const missingTech = missingTechnologyIds.length
        ? `Missing technology: ${missingTechnologyIds.join(", ")}.`
        : "";
      const shortfalls = resourceShortfalls.length
        ? `Insufficient resources: ${resourceShortfalls.map(({ resourceTypeId, required, available }) =>
            `${resourceTypeId} (required ${required}, available ${available})`).join("; ")}.`
        : "";
      const explanation = [missingTech, shortfalls].filter(Boolean).join(" ")
        || (reason === LifecycleReason.INVALID_TARGET
          ? "Invalid builder, blueprint, or build configuration."
          : reason === LifecycleReason.ENTITY_BUSY
            ? "The builder is busy."
            : reason === LifecycleReason.NOT_OWNED
              ? "You do not own this builder."
              : "The build request was rejected.");
      return { title: "Build rejected", message: `Builder ${actorEntityId} cannot build ${blueprintId}. ${explanation}`,
        focusEntityId: actorEntityId, focusLabel: `Builder ${actorEntityId}` };
    }
    case "collection-rejected": {
      const { actorEntityId, code, resourceTypeId, sourceEntityId, depotEntityId } = input.detail;
      const context: (string | EntityMention)[] = [];
      if (resourceTypeId) context.push(`resource ${resourceTypeId}`);
      if (sourceEntityId) context.push(entity(sourceEntityId, `source #${sourceEntityId}`));
      if (depotEntityId) context.push(entity(depotEntityId, `depot #${depotEntityId}`));
      const content = linked`${entity(actorEntityId, `Worker ${actorEntityId}`)}: ${code.replaceAll("_", " ")}`;
      for (const [index, part] of context.entries()) {
        content.message += index === 0 ? " (" : ", ";
        if (typeof part === "string") content.message += part;
        else {
          const start = content.message.length;
          content.message += part.label;
          content.entityLinks!.push({ start, end: content.message.length, entityId: part.entityId });
        }
      }
      content.message += context.length ? ")." : ".";
      return { title: "Collection rejected", ...content,
        focusEntityId: actorEntityId, focusLabel: `Worker ${actorEntityId}` };
    }
    case "collection-route-blocked": {
      const { entityId, reason } = input.detail;
      return { title: "Collection route blocked", message: `Worker ${entityId}: ${reason}`,
        focusEntityId: String(entityId), focusLabel: `Worker ${entityId}` };
    }
    case "collection-rerouted": {
      const { entityId, fromDepotId, toDepotId } = input.detail;
      return { title: "Collection rerouted", ...linked`${entity(entityId, `Worker ${entityId}`)} is routing from ${entity(fromDepotId, `depot #${fromDepotId}`)} to ${entity(toDepotId, `depot #${toDepotId}`)}.`,
        focusEntityId: String(entityId), focusLabel: `Worker ${entityId}` };
    }
    case "collection-spacing-waiting": {
      const label = `Collector ${input.collectorEntityId}`;
      return { title: "Collection blocked", message: `${label} is too close to another active collector. Move it farther away and restart, or wait for an automatic retry.`,
        focusEntityId: input.collectorEntityId, focusLabel: label };
    }
    case "collection-dropoff-blocked": {
      const { entityId, cargo } = input;
      return { title: "Collection waiting", message: `Worker ${entityId} cannot unload its ${cargo} at the current depot. Checking linked drop-offs; if none has room, it will wait here until capacity opens.`,
        focusEntityId: entityId, focusLabel: `Worker ${entityId}` };
    }
    case "collection-capacity-blocked": {
      const { entityId, resourceTypeId } = input;
      return { title: "Collection blocked", message: `Worker ${entityId} has no capacity for ${resourceTypeId} and cannot collect it.`,
        focusEntityId: String(entityId), focusLabel: `Worker ${entityId}` };
    }
    case "collection-delivering-cargo": {
      const { entityId, resourceTypeId, target, targetEntityId } = input;
      return { title: "Delivering cargo", ...linked`${entity(entityId, `Worker ${entityId}`)} delivering its ${resourceTypeId} to ${targetEntityId ? entity(targetEntityId, target) : target} before going to collecting more.`,
        focusEntityId: String(entityId), focusLabel: `Worker ${entityId}` };
    }
    case "transport-endpoint-lost":
      return { title: "Resource transport canceled", message: "The donor or recipient is no longer available or compatible. Resources still aboard the worker are retained. Click to focus it.",
        focusEntityId: input.carrierEntityId };
    case "resource-starvation": {
      const label = `${input.entityTypeId ?? "Entity"} ${input.entityId}`;
      return { title: "Resource starvation", message: `${label} is taking damage because it lacks resources for maintenance.`,
        focusEntityId: input.entityId, focusLabel: label };
    }
    case "move-route-unavailable":
      return { title: "Escort", message: "Move routing unavailable: wait for the live world and content." };
    case "move-route-blocked":
      return { title: "Escort", message: input.reason };
    case "escort-invalid-target":
      return { title: "Escort", message: "Choose another owned mobile ship to escort." };
  }
}
