"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { AudioToggle } from "@/features/audio/components/AudioToggle";
import { contentManager } from "@/features/content/contentManager";
import { useHUD } from "@/features/hud/components/HUDContext";
import {
  addResourceChange,
  type ResourceTrend,
  resourceChanges,
} from "@/features/hud/resourceChanges";

const HUD_BASE =
  "pointer-events-none absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded bg-black/70 px-3 py-2 font-sans text-sm";
const HUD_EMPTY = "text-white/80";
const HUD_FULL = "flex flex-wrap items-center gap-3 text-white/95";

const formatKey = (key: string) => key.charAt(0).toUpperCase() + key.slice(1);
const formatChange = (change: number) => Number(Math.abs(change).toFixed(2));

const subscribeToContent = (notify: () => void) =>
  contentManager.subscribe(notify);
const getContentSnapshot = () => contentManager.getContent();
const getServerContentSnapshot = () => null;

export function ResourceHUD() {
  const { state } = useHUD();
  const resources = state.resources;
  const content = useSyncExternalStore(
    subscribeToContent,
    getContentSnapshot,
    getServerContentSnapshot,
  );
  const resourceTypes = content?.resource_types ?? {};
  const previousResources = useRef(resources);
  const [trends, setTrends] = useState<Record<string, ResourceTrend>>({});

  useEffect(() => {
    const changes = resourceChanges(previousResources.current, resources);
    previousResources.current = resources;
    setTrends((previous) =>
      Object.fromEntries(
        Object.entries(changes).map(([key, change]) => [
          key,
          addResourceChange(previous[key]?.changes ?? [], change),
        ]),
      ),
    );
  }, [resources]);

  const sortedKeys = useMemo(() => {
    const hasContentTypes = Object.keys(resourceTypes).length > 0;

    if (hasContentTypes) {
      return Object.keys(resourceTypes).sort(
        (a, b) =>
          (resourceTypes[a]?.order ?? 999) - (resourceTypes[b]?.order ?? 999),
      );
    }

    return Object.keys(resources)
      .filter((k) => typeof resources[k] === "number")
      .sort((a, b) => a.localeCompare(b));
  }, [resourceTypes, resources]);

  const labelFor = (key: string) =>
    resourceTypes[key]?.display_name ?? formatKey(key);

  const ariaLabel =
    sortedKeys.length === 0
      ? "Resources loading"
      : `Resources: ${sortedKeys
          .map((k) => {
            const change = trends[k]?.average ?? 0;
            const trend =
              change > 0
                ? `, up ${formatChange(change)} per update`
                : change < 0
                  ? `, down ${formatChange(change)} per update`
                  : "";
            return `${labelFor(k)} ${Number(resources[k] ?? 0)}${trend}`;
          })
          .join(", ")}`;

  // console.log("[ResourceHUD] render", {
  //   sortedKeysLength: sortedKeys.length,
  //   hasContent: !!content,
  //   resourceTypesKeys: Object.keys(resourceTypes),
  //   resourcesSnapshot: { ...resources },
  // });

  if (sortedKeys.length === 0) {
    return (
      <div className={`${HUD_BASE} flex items-center gap-2`}>
        <AudioToggle />
        <output className={HUD_EMPTY} aria-label={ariaLabel}>
          Resources: —
        </output>
      </div>
    );
  }

  return (
    <div className={`${HUD_BASE} flex items-center gap-2`}>
      <AudioToggle />
      <output className={HUD_FULL} aria-label={ariaLabel}>
        {sortedKeys.map((key) => {
          const trend = trends[key];
          const change = trend?.average ?? 0;
          const samples = trend?.changes.length ?? 0;
          const ChangeIcon = change > 0 ? ArrowUp : ArrowDown;
          return (
            <span key={key} className="flex items-center gap-1.5">
              <span className="text-white/80">{labelFor(key)}</span>
              <span className="font-medium tabular-nums">
                {Number(resources[key] ?? 0)}
              </span>
              {change !== 0 && (
                <span
                  className={`pointer-events-auto ${change > 0 ? "text-emerald-400" : "text-red-400"}`}
                  title={`Average ${change > 0 ? "+" : "-"}${formatChange(change)} per update over the last ${samples} update${samples === 1 ? "" : "s"}`}
                >
                  <ChangeIcon
                    aria-hidden="true"
                    className="size-3.5"
                    strokeWidth={2.5}
                  />
                </span>
              )}
            </span>
          );
        })}
      </output>
    </div>
  );
}
