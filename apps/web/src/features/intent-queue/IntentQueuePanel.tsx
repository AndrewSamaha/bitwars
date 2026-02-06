"use client";

import React, { useEffect, useState } from "react";
import { intentQueue, type PerEntityState } from "@/features/intent-queue/intentQueueManager";
import { useHUD } from "@/features/hud/components/HUDContext";

/**
 * M1 Intent Queue Panel
 *
 * Displays per-entity queue state:
 *   - Server active intent (target, intentId, serverTick)
 *   - Local queued intents (numbered, with targets)
 *
 * Only shows for selected entities that have active or queued intents.
 */
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
    if (state.active || state.queue.length > 0) {
      entries.push({ entityId: id, state });
    }
  }

  if (entries.length === 0) return null;

  return (
    <div className="fixed right-4 bottom-28 z-50 w-72 max-h-64 overflow-y-auto bg-opacity-95 border border-border rounded-lg shadow-2xl">
      <div className="px-3 py-2 border-b border-border bg-muted/50 rounded-t-lg">
        <span className="text-xs font-medium">Intent Queue</span>
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
                    ({state.active.target.x.toFixed(0)}, {state.active.target.y.toFixed(0)})
                  </span>
                  {state.active.intentId && (
                    <span className="text-muted-foreground ml-1">
                      @{state.active.serverTick ?? "?"}
                    </span>
                  )}
                  <span className="text-green-400 ml-1">active</span>
                </div>
              </div>
            )}

            {/* Local queue */}
            {state.queue.map((q, idx) => (
              <div key={q.clientCmdId} className="flex items-start gap-1 ml-2 text-muted-foreground">
                <span className="shrink-0">{idx + 1}.</span>
                <span>
                  ({q.target.x.toFixed(0)}, {q.target.y.toFixed(0)})
                </span>
                <span className="ml-1 text-yellow-500">queued</span>
              </div>
            ))}

            {!state.active && state.queue.length === 0 && (
              <div className="ml-2 text-muted-foreground">idle</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
