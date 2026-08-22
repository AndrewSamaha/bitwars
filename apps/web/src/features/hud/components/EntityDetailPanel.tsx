"use client"

import { useEffect, useMemo, useState } from "react";
import { useHUD } from "@/features/hud/components/HUDContext";
import { getEntityDetailLeftOffset } from "@/features/hud/layout/constants";
import { game } from "@/features/gamestate/world";
import { contentManager } from "@/features/content/contentManager";
import AvailableAction, { ActionDef } from "@/features/hud/components/AvailableAction";
import { intentQueue } from "@/features/intent-queue/intentQueueManager";
import { GAMESTATE_UPDATED_EVENT, type GameStateUpdatedDetail } from "@/features/gamestate/events";

const GAMESTATE_UI_REFRESH_INTERVAL_MS = 100;
type BuildState = { blueprint_id?: string; progress?: number };
type BuildStateById = Record<string, BuildState>;

function sameBuildStates(left: BuildStateById, right: BuildStateById): boolean {
  const leftIds = Object.keys(left);
  const rightIds = Object.keys(right);
  if (leftIds.length !== rightIds.length) return false;
  return leftIds.every((id) =>
    right[id]?.blueprint_id === left[id]?.blueprint_id &&
    right[id]?.progress === left[id]?.progress,
  );
}

export default function EntityDetailPanel() {
  const { selectors, actions } = useHUD();
  const { selectedEntities, selectedAction } = selectors;
  const selectedIdsKey = selectedEntities.join(",");
  const [, forceRerender] = useState(0);
  const [buildMenuOpen, setBuildMenuOpen] = useState(false);
  const [buildStateById, setBuildStateById] = useState<BuildStateById>({});

  // The ECS changes when the authoritative game stream applies a snapshot or
  // delta. Do not make the DOM follow Pixi's render loop; coalesce stream
  // bursts to a modest UI refresh rate instead.
  useEffect(() => {
    let lastRefreshAt = 0;
    let trailingRefresh: number | undefined;
    const refresh = () => {
      trailingRefresh = undefined;
      lastRefreshAt = performance.now();
      forceRerender((n) => (n + 1) % 1_000_000);
    };
    const onGameStateUpdated = (event: Event) => {
      const changedIds = (event as CustomEvent<GameStateUpdatedDetail>).detail?.entityIds;
      if (changedIds && !selectedEntities.some((id) => changedIds.includes(id))) return;
      const remaining = GAMESTATE_UI_REFRESH_INTERVAL_MS - (performance.now() - lastRefreshAt);
      if (remaining <= 0) {
        refresh();
      } else if (trailingRefresh === undefined) {
        trailingRefresh = window.setTimeout(refresh, remaining);
      }
    };
    window.addEventListener(GAMESTATE_UPDATED_EVENT, onGameStateUpdated);
    return () => {
      window.removeEventListener(GAMESTATE_UPDATED_EVENT, onGameStateUpdated);
      if (trailingRefresh !== undefined) window.clearTimeout(trailingRefresh);
    };
  }, [selectedEntities, selectedIdsKey]);

  useEffect(() => {
    setBuildMenuOpen(false);
  }, [selectedIdsKey]);

  // Position the detail panel so it never overlaps the TerminalPanel
  // TerminalPanel uses w-96 (24rem) when open and w-12 (3rem) when closed, with left-4 (1rem) margin
  // Add a 1rem gutter between panels for visual separation
  const { isTerminalOpen } = selectors;
  const leftOffsetRem = getEntityDetailLeftOffset(isTerminalOpen);

  // Build a quick lookup of current positions and entity_type_id by entity id (stringified)
  const idToPos = new Map<string, { x: number; y: number }>();
  const idToType = new Map<string, string>();
  const idToHealth = new Map<string, number>();
  const idToActiveIntent = new Map<
    string,
    {
      kind?: string;
      intentId?: string;
      startedTick?: number;
      moveTarget?: { x: number; y: number };
    }
  >();
  const idToCollectorState = new Map<
    string,
    {
      activity: string;
      resource_type: string;
      carry_amount: number;
      carry_capacity: number;
      effective_rate_per_second: number;
    }
  >();
  if (selectedEntities.length > 0) {
    try {
      for (const e of game.world.with("pos", "id")) {
        const id = String((e as any).id);
        const pos = (e as any).pos as { x: number; y: number } | undefined;
        const entityTypeId = (e as any).entity_type_id as string | undefined;
        const health = Number((e as any).health);
        const activeIntentKind = (e as any).active_intent_kind as string | undefined;
        const activeIntentId = (e as any).active_intent_id as string | undefined;
        const activeIntentStartedTick = (e as any).active_intent_started_tick as number | undefined;
        const activeIntentMoveTarget = (e as any).active_intent_move_target as { x: number; y: number } | undefined;
        const collectorState = (e as any).collector_state as
          | {
              activity?: string;
              resource_type?: string;
              carry_amount?: number;
              carry_capacity?: number;
              effective_rate_per_second?: number;
            }
          | undefined;
        if (id != null && pos) {
          idToPos.set(id, pos);
        }
        if (id != null) {
          idToType.set(id, entityTypeId ?? "—");
          if (Number.isFinite(health)) idToHealth.set(id, health);
          if (activeIntentKind) {
            idToActiveIntent.set(id, {
              kind: activeIntentKind,
              intentId: activeIntentId,
              startedTick: activeIntentStartedTick,
              moveTarget: activeIntentMoveTarget,
            });
          }
          if (collectorState) {
            idToCollectorState.set(id, {
              activity: String(collectorState.activity ?? "idle"),
              resource_type: String(collectorState.resource_type ?? ""),
              carry_amount: Number(collectorState.carry_amount ?? 0),
              carry_capacity: Number(collectorState.carry_capacity ?? 0),
              effective_rate_per_second: Number(collectorState.effective_rate_per_second ?? 0),
            });
          }
        }
      }
    } catch {}
  }

  // Dynamic actions for a given entity.
  const getActionsForEntity = (entityId: string): ActionDef[] => {
    const entityTypeId = idToType.get(entityId) ?? "";
    const canBuild = selectedEntities.length === 1 && (contentManager.getEntityType(entityTypeId)?.builds?.length ?? 0) > 0;
    return [
      { key: "m", name: "move", enabled: true, value: "Move" },
      { key: "c", name: "collect", enabled: true, value: "Collect" },
      { key: "b", name: "build", enabled: canBuild, value: "Build" },
    ];
  };
  // Intersect actions across all selected entities (simple approach: show those enabled for first)
  const firstId = selectedEntities[0] ?? "";
  const availableActions = getActionsForEntity(firstId);
  const isCollectActiveForSelection = selectedEntities.length > 0 && selectedEntities.every((id) => {
    const ai = idToActiveIntent.get(id);
    return (ai?.kind ?? "").toLowerCase() === "collect";
  });
  const isSelectedEntityBuilding = selectedEntities.length === 1 &&
    (idToActiveIntent.get(firstId)?.kind ?? "").toLowerCase() === "build";

  useEffect(() => {
    if (!isSelectedEntityBuilding) {
      setBuildStateById({});
      return;
    }
    let mounted = true;
    let timer: number | undefined;
    let requestInFlight = false;
    const refresh = async () => {
      if (requestInFlight) return;
      requestInFlight = true;
      try {
        const response = await fetch(`/api/v2/build-state?ids=${encodeURIComponent(firstId)}`, {
          cache: "no-store",
        });
        if (!response.ok || !mounted) return;
        const data = (await response.json()) as {
          build_state_by_entity?: BuildStateById;
        };
        const nextState = data.build_state_by_entity ?? {};
        setBuildStateById((current) =>
          sameBuildStates(current, nextState) ? current : nextState,
        );
      } catch {
        // Keep build details resilient on transient fetch failures.
      } finally {
        requestInFlight = false;
      }
    };
    void refresh();
    timer = window.setInterval(() => void refresh(), 500);
    return () => {
      mounted = false;
      if (timer !== undefined) window.clearInterval(timer);
    };
  }, [firstId, isSelectedEntityBuilding]);

  const onClickAction = (val: "Move" | "Collect" | "Build") => {
    if (val === "Build") {
      setBuildMenuOpen((open) => !open);
      return;
    }
    if (val === "Collect") {
      for (const id of selectedEntities) {
        const entityIdNum = Number(id);
        if (Number.isFinite(entityIdNum)) {
          intentQueue.handleCollectCommand(entityIdNum, "REPLACE_ACTIVE");
        }
      }
      return;
    }
    // Toggle Move mode selection
    actions.setSelectedAction(selectedAction === "Move" ? null : "Move");
  };

  const selectedType = idToType.get(firstId) ?? "";
  const buildOptions = useMemo(
    () => selectedEntities.length === 1
      ? contentManager.getEntityType(selectedType)?.builds ?? []
      : [],
    [selectedEntities.length, selectedType],
  );
  const buildKeys = "qwertasdfgzxcvb";
  const canAfford = (entityTypeId: string) => {
    const costs = contentManager.getEntityType(entityTypeId)?.build_cost ?? {};
    return Object.entries(costs).every(([resource, cost]) => selectors.getResource(resource) >= cost);
  };
  const startBuild = (entityTypeId: string) => {
    if (!canAfford(entityTypeId)) return;
    const entityId = Number(firstId);
    if (Number.isFinite(entityId)) intentQueue.handleBuildCommand(entityId, entityTypeId);
    setBuildMenuOpen(false);
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
      if (event.key === "Escape" && buildMenuOpen) {
        event.preventDefault();
        setBuildMenuOpen(false);
        return;
      }
      if (!buildMenuOpen && (event.key === "b" || event.key === "B") && buildOptions.length > 0) {
        event.preventDefault();
        setBuildMenuOpen(true);
        return;
      }
      if (buildMenuOpen) {
        const index = buildKeys.indexOf(event.key.toLowerCase());
        const option = index >= 0 ? buildOptions[index] : undefined;
        if (option) {
          event.preventDefault();
          startBuild(option.entity_type_id);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [buildMenuOpen, buildOptions, firstId, selectedIdsKey]);

  if (!selectedEntities?.length) return null;

  return (
    <div
      className="fixed bottom-4 z-50"
      style={{ left: `${leftOffsetRem}rem`, right: "1rem" }}
    >
      <div className="flex h-full w-full flex-col rounded-lg border border-white/15 bg-black/88 shadow-2xl backdrop-blur-sm">
        {selectedEntities.length > 0 ? (
          <div className="p-3">
            <ul className="text-xs space-y-1">
              {selectedEntities.length > 1
                ? selectedEntities.map((id) => (
                    <li key={id} className="flex items-center gap-3">
                      <span className="font-mono">{idToType.get(id) ?? "—"}</span>
                      <span className="font-mono text-muted-foreground">id: {id}</span>
                    </li>
                  ))
                : selectedEntities.map((id) => {
                const pos = idToPos.get(id);
                const entityTypeId = idToType.get(id) ?? "—";
                const health = idToHealth.get(id);
                const maxHealth = contentManager.getEntityType(entityTypeId)?.health;
                const activeIntent = idToActiveIntent.get(id);
                const collectorState = idToCollectorState.get(id);
                const buildState = buildStateById[id];
                const shortIntentId = activeIntent?.intentId
                  ? `${activeIntent.intentId.slice(0, 8)}...`
                  : "—";
                const startedTick = Number.isFinite(activeIntent?.startedTick as number)
                  ? String(activeIntent?.startedTick)
                  : "—";
                const moveTarget = activeIntent?.moveTarget
                  ? `${activeIntent.moveTarget.x.toFixed(1)}, ${activeIntent.moveTarget.y.toFixed(1)}`
                  : "—";
                return (
                  <li key={id} className="flex items-center justify-between gap-4">
                    <span className="font-mono">{entityTypeId}</span>
                    <span className="font-mono">id: {id}</span>
                    <span className="font-mono text-muted-foreground">
                      {pos ? `x: ${pos.x.toFixed(1)}, y: ${pos.y.toFixed(1)}` : "pos: —"}
                    </span>
                    {health !== undefined && typeof maxHealth === "number" && maxHealth > 0 && (
                      <span className="font-mono text-muted-foreground">
                        health: {health.toFixed(1)} / {maxHealth.toFixed(1)}
                      </span>
                    )}
                    <span className="font-mono text-muted-foreground">
                      intent: {activeIntent?.kind ?? "idle"}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      iid: {shortIntentId}
                    </span>
                    <span className="font-mono text-muted-foreground">
                      tick: {startedTick}
                    </span>
                    {activeIntent?.kind === "move" && (
                      <span className="font-mono text-muted-foreground">
                        target: {moveTarget}
                      </span>
                    )}
                    {activeIntent?.kind === "build" && (
                      <span className="font-mono text-muted-foreground">
                        building {buildState?.blueprint_id ?? ""} {typeof buildState?.progress === "number" ? `${(buildState.progress * 100).toFixed(0)}%` : ""}
                      </span>
                    )}
                    {collectorState && collectorState.carry_capacity > 0 && (
                      <span className="font-mono text-muted-foreground">
                        carry: {collectorState.carry_amount.toFixed(1)} / {collectorState.carry_capacity.toFixed(1)}
                      </span>
                    )}
                    {collectorState && collectorState.carry_capacity <= 0 && (
                      <span className="font-mono text-muted-foreground">
                        rate: {collectorState.effective_rate_per_second.toFixed(1)}/s
                      </span>
                    )}
                  </li>
                );
                })}
            </ul>
            {/* Actions row */}
            <div className="mt-2 flex items-center gap-2">
              {availableActions.map((a) => (
                <AvailableAction
                  key={a.value}
                  action={a}
                  active={
                    a.value === "Move"
                      ? selectedAction === "Move"
                      : a.value === "Collect"
                        ? isCollectActiveForSelection
                        : buildMenuOpen
                  }
                  onClick={(action) => action.enabled !== false && onClickAction(action.value)}
                />
              ))}
            </div>
            {buildMenuOpen && (
              <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-white/10 pt-2 text-xs">
                <span className="text-muted-foreground">Build:</span>
                {buildOptions.map((option, index) => {
                  const costs = contentManager.getEntityType(option.entity_type_id)?.build_cost ?? {};
                  const enabled = canAfford(option.entity_type_id);
                  const costText = Object.entries(costs).map(([resource, amount]) => `${amount} ${resource}`).join(", ");
                  return (
                    <button
                      key={option.entity_type_id}
                      type="button"
                      disabled={!enabled}
                      onClick={() => startBuild(option.entity_type_id)}
                      className={enabled ? "rounded border border-border bg-muted px-2 py-1 hover:bg-accent" : "cursor-not-allowed rounded border border-border bg-muted/50 px-2 py-1 text-muted-foreground"}
                    >
                      [{buildKeys[index]?.toUpperCase()}] {option.entity_type_id} — {costText}
                    </button>
                  );
                })}
                <span className="text-muted-foreground">[Esc] cancel</span>
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 text-xs">No entities selected</div>
        )}
      </div>
    </div>
  );
}
