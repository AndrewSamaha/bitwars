"use client";

import { ArrowDown, ArrowUp, ChevronDown, ChevronUp } from "lucide-react";
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
  RESOURCE_TREND_WINDOW,
  resourceChanges,
} from "@/features/hud/resourceChanges";

const HUD_BASE =
  "pointer-events-none absolute left-1/2 top-4 z-50 -translate-x-1/2 rounded bg-black/70 px-3 py-2 font-sans text-sm";
const HUD_EMPTY = "text-white/80";

const formatKey = (key: string) => key.charAt(0).toUpperCase() + key.slice(1);
const formatChange = (change: number) => Math.round(Math.abs(change));

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
  const [flowTrends, setFlowTrends] = useState<Record<string, { gain: ResourceTrend; spend: ResourceTrend }>>({});
  const previousFlowTotals = useRef<Record<string, { gain: number; spend: number }>>({});
  const [expanded, setExpanded] = useState(false);

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

  useEffect(() => {
    const onFlowTotals = (event: Event) => {
      const totals = (event as CustomEvent<Record<string, { gain: number; spend: number }>>).detail;
      const previous = previousFlowTotals.current;
      previousFlowTotals.current = totals;
      setFlowTrends((current) => Object.fromEntries(Object.entries(totals).map(([key, total]) => [
        key,
        {
          gain: addResourceChange(current[key]?.gain.changes ?? [], Math.max(0, total.gain - (previous[key]?.gain ?? total.gain))),
          spend: addResourceChange(current[key]?.spend.changes ?? [], Math.max(0, total.spend - (previous[key]?.spend ?? total.spend))),
        },
      ])));
    };
    window.addEventListener("bitwars:resource-flow-totals", onFlowTotals);
    return () => window.removeEventListener("bitwars:resource-flow-totals", onFlowTotals);
  }, []);


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
  const resourceGridStyle = {
    // Keep the gain/spend label column reserved while collapsed too. Otherwise
    // opening the ledger lets the longer "spend" label widen the whole HUD.
    gridTemplateColumns: `3rem repeat(${sortedKeys.length}, minmax(4rem, max-content)) auto`,
  };

  const ariaLabel =
    sortedKeys.length === 0
      ? "Resources loading"
      : `Resources: ${sortedKeys
          .map((k) => {
            const change = trends[k]?.average ?? 0;
            const trend =
              change > 0
                ? `, up ${formatChange(change)}`
                : change < 0
                  ? `, down ${formatChange(change)}`
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
    <div className={`${HUD_BASE} flex items-start gap-2`}>
      <AudioToggle />
      <div
        className="grid min-w-0 items-center gap-x-3 gap-y-1"
        style={resourceGridStyle}
      >
          <output className="contents" aria-label={ariaLabel}>
            <span className="invisible w-12 text-xs" aria-hidden="true">spend</span>
            {sortedKeys.map((key) => {
              const trend = trends[key];
              const change = (flowTrends[key]?.gain.gained ?? 0) - (flowTrends[key]?.spend.gained ?? 0);
              const samples = trend?.changes.length ?? 0;
              const ChangeIcon = change > 0 ? ArrowUp : ArrowDown;
              return (
                <span key={key} className="flex items-center gap-0 text-white/95">
                  <span className="text-white/80 pr-2">{labelFor(key)}</span>
                  <span className="font-medium tabular-nums">
                    {Number(resources[key] ?? 0)}
                  </span>
                  <span
                    className={`inline-flex size-3.5 shrink-0 items-center justify-center pointer-events-auto ${
                      change === 0
                        ? "invisible"
                        : change > 0
                          ? "text-emerald-400"
                          : "text-red-400"
                    }`}
                    title={`Net ${change > 0 ? "+" : change < 0 ? "−" : ""}${formatChange(change)} over the last ${samples} update${samples === 1 ? "" : "s"}`}
                  >
                    <ChangeIcon
                      aria-hidden="true"
                      className="size-3.5"
                      strokeWidth={2.5}
                    />
                  </span>
                </span>
              );
            })}
          </output>
          <button
            type="button"
            className="pointer-events-auto inline-flex size-4 items-center justify-center text-white/70 hover:text-white"
            aria-label={`${expanded ? "Hide" : "Show"} resource gains and costs`}
            aria-expanded={expanded}
            title={`${expanded ? "Hide" : "Show"} gains and costs over the last ${RESOURCE_TREND_WINDOW} updates`}
            onClick={() => setExpanded((value) => !value)}
          >
            {expanded ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
          </button>
        {expanded && (
          <>
            <span className="col-span-full h-px bg-white/15" aria-hidden="true" />
            <span className="w-12 text-xs text-white/80">gain</span>
            {sortedKeys.map((key) => {
              const trend = trends[key];
              const gained = flowTrends[key]?.gain.gained ?? 0;
              const samples = trend?.changes.length ?? 0;
              return (
                <span
                  key={key}
                  title={`Total gain over the last ${samples} update${samples === 1 ? "" : "s"}`}
                  className="text-xs tabular-nums text-emerald-400"
                >
                  +{formatChange(gained)}
                </span>
              );
            })}
            <span aria-hidden="true" />
            <span className="w-12 text-xs text-white/80">spend</span>
            {sortedKeys.map((key) => {
              const trend = trends[key];
              const spent = flowTrends[key]?.spend.gained ?? 0;
              const samples = trend?.changes.length ?? 0;
              return (
                <span
                  key={key}
                  title={`Total spend over the last ${samples} update${samples === 1 ? "" : "s"}`}
                  className="text-xs tabular-nums text-red-400"
                >
                  −{formatChange(spent)}
                </span>
              );
            })}
            <span aria-hidden="true" />
            <span className="col-span-full h-px bg-white/15" aria-hidden="true" />
            <span className="text-xs text-white/80">net</span>
            {sortedKeys.map((key) => {
              const trend = trends[key];
              const gained = flowTrends[key]?.gain.gained ?? 0;
              const spent = flowTrends[key]?.spend.gained ?? 0;
              const net = gained - spent;
              return (
                <span
                  key={key}
                  title="Total gain minus total spend over the rolling window"
                  className={`text-xs tabular-nums ${net > 0 ? "text-emerald-400" : net < 0 ? "text-red-400" : "text-white/80"}`}
                >
                  {net > 0 ? "+" : net < 0 ? "−" : ""}{formatChange(net)}
                </span>
              );
            })}
            <span aria-hidden="true" />
          </>
        )}
      </div>
    </div>
  );
}
