"use client";

import { useHUD } from "@/features/hud/components/HUDContext";
import { contentManager } from "@/features/content/contentManager";

/**
 * M7: Resource HUD — displays current resources from server-driven state.
 * Always visible on play screen: uses content-defined resource types (with 0 when no data),
 * or keys from state.resources; shows "Resources: —" when neither is available.
 */
export function ResourceHUD() {
  const { state } = useHUD();
  const resources = state.resources;
  const content = contentManager.getContent();
  const resourceTypes = content?.resource_types ?? {};

  const contentKeys = Object.keys(resourceTypes).sort(
    (a, b) => (resourceTypes[a]?.order ?? 999) - (resourceTypes[b]?.order ?? 999)
  );
  const stateKeys = Object.keys(resources).filter((k) => typeof resources[k] === "number");

  const sortedKeys =
    contentKeys.length > 0
      ? contentKeys
      : [...stateKeys].sort((a, b) => a.localeCompare(b));

  // Diagnostic: confirm render and data (remove once resource HUD visibility is resolved)
  console.log("[ResourceHUD] render", {
    sortedKeysLength: sortedKeys.length,
    contentKeysLength: contentKeys.length,
    stateKeysLength: stateKeys.length,
    hasContent: !!content,
    resourceTypesKeys: Object.keys(resourceTypes),
    resourcesSnapshot: { ...resources },
  });

  if (sortedKeys.length === 0) {
    return (
      <div
        className="pointer-events-none absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded bg-black/70 px-3 py-2 font-sans text-sm text-white/80"
        role="status"
        aria-label="Resources loading"
      >
        Resources: —
      </div>
    );
  }

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-4 z-50 -translate-x-1/2 flex flex-wrap items-center gap-3 rounded bg-black/70 px-3 py-2 font-sans text-sm text-white/95"
      role="status"
      aria-label={`Resources: ${sortedKeys.map((k) => `${resourceTypes[k]?.display_name ?? k} ${resources[k] ?? 0}`).join(", ")}`}
    >
      {sortedKeys.map((key) => (
        <span key={key} className="flex items-center gap-1.5">
          <span className="text-white/80">
            {resourceTypes[key]?.display_name ?? (key.charAt(0).toUpperCase() + key.slice(1))}
          </span>
          <span className="font-medium tabular-nums">{Number(resources[key] ?? 0)}</span>
        </span>
      ))}
    </div>
  );
}
