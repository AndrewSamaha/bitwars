"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useHUD } from "@/features/hud/components/HUDContext";
import { contentManager } from "@/features/content/contentManager";
import { AudioToggle } from "@/features/audio/components/AudioToggle";

const HUD_BASE =
  "pointer-events-none absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded bg-black/70 px-3 py-2 font-sans text-sm";
const HUD_EMPTY = "text-white/80";
const HUD_FULL = "flex flex-wrap items-center gap-3 text-white/95";

const formatKey = (key: string) => key.charAt(0).toUpperCase() + key.slice(1);

const subscribeToContent = (notify: () => void) => contentManager.subscribe(notify);
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

  const sortedKeys = useMemo(() => {
    const hasContentTypes = Object.keys(resourceTypes).length > 0;

    if (hasContentTypes) {
      return Object.keys(resourceTypes).sort(
        (a, b) => (resourceTypes[a]?.order ?? 999) - (resourceTypes[b]?.order ?? 999)
      );
    }

    return Object.keys(resources)
      .filter((k) => typeof resources[k] === "number")
      .sort((a, b) => a.localeCompare(b));
  }, [resourceTypes, resources]);

  const labelFor = (key: string) => resourceTypes[key]?.display_name ?? formatKey(key);

  const ariaLabel = useMemo(() => {
    if (sortedKeys.length === 0) return "Resources loading";
    return `Resources: ${sortedKeys
      .map((k) => `${labelFor(k)} ${Number(resources[k] ?? 0)}`)
      .join(", ")}`;
  }, [sortedKeys, resources, resourceTypes]);

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
        <div className={HUD_EMPTY} role="status" aria-label={ariaLabel}>Resources: —</div>
      </div>
    );
  }

  return (
    <div className={`${HUD_BASE} flex items-center gap-2`}>
      <AudioToggle />
      <div className={HUD_FULL} role="status" aria-label={ariaLabel}>
        {sortedKeys.map((key) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className="text-white/80">{labelFor(key)}</span>
            <span className="font-medium tabular-nums">{Number(resources[key] ?? 0)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
