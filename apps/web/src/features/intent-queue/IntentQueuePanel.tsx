"use client";

import React, { useEffect, useState } from "react";
import { intentQueue, type PerEntityState } from "@/features/intent-queue/intentQueueManager";
import { useHUD } from "@/features/hud/components/HUDContext";

/** Authoritative active orders and remaining waypoints, with pending edit previews. */
export default function IntentQueuePanel() {
  const { selectors } = useHUD();
  const { selectedEntities } = selectors;
  const [, forceRerender] = useState(0);

  // Subscribe to intentQueue state changes
  useEffect(() => {
    return intentQueue.subscribe(() => {
      forceRerender((n) => (n + 1) % 1_000_000);
    });
  }, []);

  // Gather queue states for selected entities
  const entries: Array<{ entityId: string; state: PerEntityState }> = [];
  for (const id of selectedEntities) {
    const state = intentQueue.getEntityState(Number(id));
    if (state.active || state.pendingMoves.length > 0 || state.queuedOrders?.length) {
      entries.push({ entityId: id, state });
    }
  }

  if (entries.length === 0) return null;

  return (
    <div className="fixed right-4 bottom-28 z-50 w-72 max-h-64 overflow-y-auto bg-opacity-95 border border-border rounded-lg shadow-2xl">
      <div className="px-3 py-2 border-b border-border bg-muted/50 rounded-t-lg">
        <span className="text-xs font-medium">Orders &amp; waypoints</span>
      </div>
      <div className="p-2 space-y-2 text-xs font-mono">
        {entries.map(({ entityId, state }) => (
          <div key={entityId}>
            <div className="text-muted-foreground mb-1">entity {entityId}</div>

            {/* Server active */}
            {state.active && (
              <div className="flex items-start gap-1 ml-2">
                <span className="text-green-400 shrink-0">&gt;</span>
                <div>
                  <span>
                    {state.active.kind === "escort"
                      ? `escort #${state.active.escortTargetId ?? "?"} · ${state.active.escort?.slots.find((slot) => String(slot.entity_id) === entityId)?.status.replaceAll("_", " ") ?? "pending"}`
                      : state.active.kind === "sentry"
                      ? `sentry · ${state.active.sentry?.phase ?? "pending"} · ${(state.active.route?.direction ?? 1) > 0 ? "outbound" : "returning"}`
                      : state.active.kind === "convoy"
                      ? "convoy"
                      : state.active.kind === "collect"
                      ? "collecting"
                      : state.active.kind === "resupply"
                        ? `resupplying at #${state.active.resupply?.depotId ?? "?"}`
                      : state.active.kind === "deliver"
                        ? "delivering"
                      : state.active.kind === "repair"
                        ? "repairing"
                        : state.active.kind === "build"
                          ? "building"
                          : state.active.kind === "upgrade"
                            ? "upgrading"
                            : state.active.kind === "research"
                              ? "researching"
                        : state.active.target
                        ? `(${state.active.target.x.toFixed(0)}, ${state.active.target.y.toFixed(0)})`
                        : "awaiting reconciliation"}
                  </span>
                  {state.active.resupply && <span className="ml-1 text-muted-foreground">
                    {Object.entries(state.active.resupply.targetAmounts).map(([resource, amount]) => `${resource} ${amount}`).join(", ")}
                  </span>}
                  {state.active.intentId && (
                    <span className="text-muted-foreground ml-1">
                      @{state.active.serverTick ?? "?"}
                    </span>
                  )}
                  <span className="text-green-400 ml-1">{state.pendingMoves.some((item) => item.clientCmdId === state.active?.clientCmdId) ? "pending" : "active"}</span>
                </div>
              </div>
            )}

            {/* Server waypoints and pending command previews */}
            {intentQueue.getWaypoints(Number(entityId)).filter((point) => !point.active || point.pending).map((point, idx) => (
              <div key={idx} className="flex items-start gap-1 ml-2 text-muted-foreground">
                <span className="shrink-0">{idx + 1}.</span>
                <span>({point.x.toFixed(0)}, {point.y.toFixed(0)})</span>
                <span className="ml-1 text-yellow-500">{point.pending ? "pending" : "waypoint"}</span>
              </div>
            ))}

            {state.queuedOrders?.map((order, index) => <div key={`queued-${index}`} className="ml-2 text-muted-foreground">
              {index + 1}. {order.kind === "Move" ? `move to (${order.target.x.toFixed(0)}, ${order.target.y.toFixed(0)})`
                : order.kind === "Build" ? `build ${order.blueprintId}` : `resupply at #${order.depotId}`} · queued
            </div>)}
            {!state.active && state.pendingMoves.length === 0 && (
              <div className="ml-2 text-muted-foreground">idle</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
