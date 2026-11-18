"use client";

import { AlertTriangle, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { formatMessage, type CommandFeedback, type MessageInput } from "@/features/hud/messages";
import { useHUD } from "@/features/hud/components/HUDContext";
import { intentQueue } from "@/features/intent-queue/intentQueueManager";
import { contentManager } from "@/features/content/contentManager";
import { game } from "@/features/gamestate/world";
import {
  COMMAND_FEEDBACK_EVENT,
  BUILD_REJECTED_EVENT,
  type BuildRejectedDetail,
  COLLECTION_REJECTED_EVENT,
  COLLECTION_ROUTING_BLOCKED_EVENT,
  type CollectionRejectedDetail,
  type CollectionRoutingBlockedDetail,
  COLLECTION_WAITING_EVENT,
  COLLECTION_DROPOFF_BLOCKED_EVENT,
  COLLECTION_DESTINATION_CHANGED_EVENT,
  type CollectionDestinationChangedDetail,
  COLLECT_COMMAND_EVENT,
  collectionCapacityStatus,
  type CollectCommandDetail,
  TRANSFER_ENDPOINT_LOST_EVENT,
  dispatchCenterCameraOnEntity,
  ENTITY_RESOURCE_STARVATION_EVENT,
  MINIMUM_DISTANCE_VIOLATION_EVENT,
  type CollectionWaitingDetail,
  type MinimumDistanceViolationDetail,
} from "@/features/gamestate/events";

import { messageEntityLinks, type MessageLogEntry } from "../messageLog";
import { EntityLinkedText } from "./EntityLinkedText";

type Toast = Omit<MessageLogEntry, "kind" | "timestamp"> & { id: number; entering?: boolean; leaving?: boolean; leavingTop?: number };

export default function LifecycleToasts() {
  const { actions: { pushMessageLog } } = useHUD();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);
  const toastRefs = useRef(new Map<number, HTMLDivElement>());
  const previousTops = useRef(new Map<number, number>());
  const leavingIds = useRef(new Set<number>());

  const capturePositions = useCallback(() => {
    previousTops.current = new Map(
      Array.from(toastRefs.current, ([id, element]) => [id, element.getBoundingClientRect().top]),
    );
  }, []);

  const dismiss = useCallback((id: number) => {
    if (leavingIds.current.has(id)) return;
    leavingIds.current.add(id);
    capturePositions();
    const leavingTop = toastRefs.current.get(id)?.offsetTop;
    setToasts((current) => current.map((toast) => (toast.id === id ? { ...toast, leaving: true, leavingTop } : toast)));
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      leavingIds.current.delete(id);
    }, 350);
  }, [capturePositions]);

  useLayoutEffect(() => {
    for (const toast of toasts) {
      if (toast.leaving) continue;
      const previousTop = previousTops.current.get(toast.id);
      const element = toastRefs.current.get(toast.id);
      if (previousTop === undefined || !element) continue;
      const delta = previousTop - element.getBoundingClientRect().top;
      if (delta) element.animate([{ transform: `translateY(${delta}px)` }, { transform: "translateY(0)" }], { duration: 350, easing: "ease-out" });
    }
    previousTops.current.clear();
  }, [toasts]);

  useEffect(() => {
    const shownStarvationWarnings = new Set<string>();
    const publishMessage = (input: MessageInput) => {
      const content = formatMessage(input);
      pushMessageLog({ kind: input.kind, ...content, timestamp: Date.now() });
      const toast = { ...content, id: nextId.current++, entering: true };
      setToasts((current) => [...current.slice(-2), toast]);
      window.requestAnimationFrame(() => {
        setToasts((current) => current.map((item) => (item.id === toast.id ? { ...item, entering: false } : item)));
      });
      window.setTimeout(() => dismiss(toast.id), 6_000);
    };
    const showWaypointMigrationNotice = () => {
      const message = intentQueue.getMigrationNotice();
      if (!message) return;
      publishMessage({ kind: "waypoints-cleared", message });
      // Delivery to the toast and message log consumes this one-time notice.
      intentQueue.dismissMigrationNotice();
    };
    const unsubscribeMigrationNotice = intentQueue.subscribe(showWaypointMigrationNotice);
    const migrationNoticeFrame = window.requestAnimationFrame(showWaypointMigrationNotice);
    const onMinimumDistanceViolation = (event: Event) => {
      const detail = (event as CustomEvent<MinimumDistanceViolationDetail>).detail;
      if (detail) publishMessage({ kind: "collection-spacing-blocked", detail });
    };
    const onBuildRejected = (event: Event) => {
      const detail = (event as CustomEvent<BuildRejectedDetail>).detail;
      if (detail) publishMessage({ kind: "build-rejected", detail });
    };
    const onCollectionRejected = (event: Event) => {
      const detail = (event as CustomEvent<CollectionRejectedDetail>).detail;
      if (detail) publishMessage({ kind: "collection-rejected", detail });
    };
    const onCollectionRoutingBlocked = (event: Event) => {
      const detail = (event as CustomEvent<CollectionRoutingBlockedDetail>).detail;
      if (detail) publishMessage({ kind: "collection-route-blocked", detail });
    };
    const onCollectionDestinationChanged = (event: Event) => {
      const detail = (event as CustomEvent<CollectionDestinationChangedDetail>).detail;
      if (detail) publishMessage({ kind: "collection-rerouted", detail });
    };
    const onCollectionWaiting = (event: Event) => {
      const detail = (event as CustomEvent<CollectionWaitingDetail>).detail;
      if (detail) publishMessage({ kind: "collection-spacing-waiting", collectorEntityId: detail.collectorEntityId });
    };
    const showDropoffBlocked = (entityId: string) => {
      const entity = game.world.entities.find((entity) => String(entity.id) === entityId);
      const cargo = entity?.collector_state?.resource_type || "cargo";
      publishMessage({ kind: "collection-dropoff-blocked", entityId, cargo });
    };
    const onDropoffBlocked = (event: Event) => {
      const detail = (event as CustomEvent<CollectionWaitingDetail>).detail;
      if (detail) showDropoffBlocked(detail.collectorEntityId);
    };
    const onCollectCommand = (event: Event) => {
      const detail = (event as CustomEvent<CollectCommandDetail>).detail;
      if (!detail?.resourceTypeId || detail.nearestCompatible) return;
      const entity = game.world.entities.find((entity) => String(entity.id) === String(detail.entityId));
      if (!entity) return;
      const capacities = contentManager.getEntityType(entity.entity_type_id ?? "")?.max_capacity ?? {};
      const capacityStatus = collectionCapacityStatus(entity.resources, capacities, detail.resourceTypeId);
      if (capacityStatus === "unavailable") {
        publishMessage({ kind: "collection-capacity-blocked", entityId: detail.entityId, resourceTypeId: detail.resourceTypeId });
      } else if (capacityStatus === "full" && detail.depotEntityId) {
        const depot = game.world.entities.find((candidate) => Number(candidate.id) === detail.depotEntityId);
        const target = `${depot?.entity_type_id?.replaceAll("_", " ") ?? "depot"} #${detail.depotEntityId}`;
        publishMessage({ kind: "collection-delivering-cargo", entityId: detail.entityId, resourceTypeId: detail.resourceTypeId, target, targetEntityId: String(detail.depotEntityId) });
      }
    };
    const onTransferEndpointLost = (event: Event) => {
      const detail = (event as CustomEvent<{ carrierEntityId: string }>).detail;
      if (detail) publishMessage({ kind: "transport-endpoint-lost", carrierEntityId: detail.carrierEntityId });
    };
    const onResourceStarvation = (event: Event) => {
      const entity = (event as CustomEvent<{ id?: number | string; entity_type_id?: string }>).detail;
      if (entity?.id == null) return;
      const entityId = String(entity.id);
      if (shownStarvationWarnings.has(entityId)) return;
      shownStarvationWarnings.add(entityId);
      dispatchCenterCameraOnEntity(entityId);
      publishMessage({ kind: "resource-starvation", entityId, entityTypeId: entity.entity_type_id });
    };
    const onCommandFeedback = (event: Event) => {
      const detail = (event as CustomEvent<CommandFeedback>).detail;
      if (detail) publishMessage(detail);
    };
    window.addEventListener(COMMAND_FEEDBACK_EVENT, onCommandFeedback);
    window.addEventListener(COLLECTION_DROPOFF_BLOCKED_EVENT, onDropoffBlocked);
    window.addEventListener(COLLECT_COMMAND_EVENT, onCollectCommand);
    window.addEventListener(MINIMUM_DISTANCE_VIOLATION_EVENT, onMinimumDistanceViolation);
    window.addEventListener(BUILD_REJECTED_EVENT, onBuildRejected);
    window.addEventListener(COLLECTION_REJECTED_EVENT, onCollectionRejected);
    window.addEventListener(COLLECTION_ROUTING_BLOCKED_EVENT, onCollectionRoutingBlocked);
    window.addEventListener(COLLECTION_DESTINATION_CHANGED_EVENT, onCollectionDestinationChanged);
    window.addEventListener(COLLECTION_WAITING_EVENT, onCollectionWaiting);
    window.addEventListener(TRANSFER_ENDPOINT_LOST_EVENT, onTransferEndpointLost);
    window.addEventListener(ENTITY_RESOURCE_STARVATION_EVENT, onResourceStarvation);
    return () => {
      unsubscribeMigrationNotice();
      window.cancelAnimationFrame(migrationNoticeFrame);
      window.removeEventListener(COMMAND_FEEDBACK_EVENT, onCommandFeedback);
      window.removeEventListener(COLLECTION_DROPOFF_BLOCKED_EVENT, onDropoffBlocked);
      window.removeEventListener(COLLECT_COMMAND_EVENT, onCollectCommand);
      window.removeEventListener(MINIMUM_DISTANCE_VIOLATION_EVENT, onMinimumDistanceViolation);
      window.removeEventListener(BUILD_REJECTED_EVENT, onBuildRejected);
      window.removeEventListener(COLLECTION_REJECTED_EVENT, onCollectionRejected);
      window.removeEventListener(COLLECTION_ROUTING_BLOCKED_EVENT, onCollectionRoutingBlocked);
      window.removeEventListener(COLLECTION_DESTINATION_CHANGED_EVENT, onCollectionDestinationChanged);
      window.removeEventListener(COLLECTION_WAITING_EVENT, onCollectionWaiting);
      window.removeEventListener(TRANSFER_ENDPOINT_LOST_EVENT, onTransferEndpointLost);
      window.removeEventListener(ENTITY_RESOURCE_STARVATION_EVENT, onResourceStarvation);
    };
  }, [dismiss, pushMessageLog]);

  if (toasts.length === 0) return null;
  return (
    <div aria-live="polite" className="fixed right-3 top-[220px] z-[60] flex w-80 flex-col">
      {toasts.map((toast) => (
        <div
          className={`inset-x-0 transition-[opacity,transform] duration-[350ms] ease-out ${toast.leaving ? "pointer-events-none absolute z-0" : "relative z-10 mb-2"} ${toast.entering || toast.leaving ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"}`}
          key={toast.id}
          ref={(element) => {
            if (element) toastRefs.current.set(toast.id, element);
            else toastRefs.current.delete(toast.id);
          }}
          style={toast.leaving ? { top: toast.leavingTop } : undefined}
        >
          <div className="flex gap-2 rounded border border-amber-400/60 bg-slate-950/95 p-3 text-sm text-slate-100 shadow-xl">
            <AlertTriangle aria-hidden className="mt-0.5 size-4 shrink-0 text-amber-300" />
            {toast.entityLinks?.length ? (
              <div className="min-w-0 flex-1 text-left">
                <button type="button" className="text-left font-medium" onClick={() => {
                  if (toast.focusEntityId) dispatchCenterCameraOnEntity(toast.focusEntityId);
                  dismiss(toast.id);
                }}>{toast.title}</button>
                <p className="mt-1 text-xs text-slate-300">
                  <EntityLinkedText text={toast.message} links={messageEntityLinks(toast)} onFocus={() => dismiss(toast.id)} />
                </p>
              </div>
            ) : (
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => {
                  if (toast.focusEntityId) dispatchCenterCameraOnEntity(toast.focusEntityId);
                  dismiss(toast.id);
                }}
                type="button"
              >
                <p className="font-medium">{toast.title}</p>
                <p className="mt-1 text-xs text-slate-300">{toast.message}</p>
              </button>
            )}
            <button aria-label="Dismiss" className="self-start text-slate-400 hover:text-white" onClick={() => dismiss(toast.id)} type="button">
              <X aria-hidden className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
