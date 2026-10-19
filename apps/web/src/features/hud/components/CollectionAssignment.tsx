import { contentManager } from "@/features/content/contentManager";
import { game, type Entity } from "@/features/gamestate/world";

/** Keep collection destinations distinct from the depot that funds operations. */
export function CollectionAssignment({ entity, tooltip = false }: { entity: Entity; tooltip?: boolean }) {
  const definition = contentManager.getEntityType(entity.entity_type_id ?? "");
  if (!definition?.collector) return null;
  const state = entity.collector_state;
  const resourceId = state?.assigned_resource_type || state?.resource_type;
  const resource = state?.assigned_nearest_compatible ? "nearest compatible resource"
    : resourceId ? contentManager.getResourceType(resourceId)?.display_name ?? resourceId
    : (definition.collector.collects ?? []).map(id => contentManager.getResourceType(id)?.display_name ?? id).join(", ");
  const assignedId = entity.supply?.delivery_depot_id;
  const manual = assignedId != null && String(assignedId) !== "0";
  const automaticId = (definition.collector.transport_rate_per_second ?? 8) > 0
    ? state?.receiving_entity_id : entity.supply?.depot_id;
  const destinationId = manual ? assignedId : automaticId;
  const destination = destinationId != null && String(destinationId) !== "0"
    ? Array.from(game.world.with("id")).find(e => String(e.id) === String(destinationId)) : undefined;
  const destinationLabel = destinationId != null && String(destinationId) !== "0"
    ? `${destination?.entity_type_id?.replaceAll("_", " ") ?? "depot"} #${destinationId}`
    : (definition.collector.transport_rate_per_second ?? 8) > 0 ? "nearest depot with room" : "no depot in range";

  const destinationText = `${destinationLabel} (${manual ? "assigned" : "automatic"})`;
  if (tooltip) return <>
    <div><b>collecting:</b> {resource || "not selected"}</div>
    <div><b>collection destination:</b> {destinationText}</div>
  </>;

  return <>
    <span className="font-mono text-muted-foreground">collecting: {resource || "not selected"}</span>
    <span className="font-mono text-muted-foreground">collection destination: {destinationText}</span>
  </>;
}
