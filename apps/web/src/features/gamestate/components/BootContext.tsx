"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  useCallback,
} from "react";
import { contentManager } from "@/features/content/contentManager";
import { useSession } from "@/features/users/components/identity/SessionContext";
import { useHUD } from "@/features/hud/components/HUDContext";
import { gameConnection } from "../connection";

type Milestone = { label: string; done: boolean; running: boolean };
type Boot = {
  ready: boolean;
  visible: boolean;
  busy: boolean;
  recovering: boolean;
  milestones: Milestone[];
  error: string | null;
  retry: () => void;
  attempt: number;
  definitionsLoaded: () => void;
  definitionsFailed: (message: string) => void;
};
const Context = createContext<Boot | null>(null);

export function BootProvider({ children }: { children: React.ReactNode }) {
  const { status, effectivePlayerId } = useSession();
  const { actions } = useHUD();
  const connection = useSyncExternalStore(
    gameConnection.subscribe,
    gameConnection.getSnapshot,
    gameConnection.getSnapshot,
  );
  const progress = useSyncExternalStore(
    gameConnection.subscribe,
    gameConnection.getProgress,
    gameConnection.getProgress,
  );
  const content = useSyncExternalStore(
    contentManager.subscribeSyncState,
    contentManager.getSyncState,
    contentManager.getSyncState,
  );
  const [attempt, setAttempt] = useState(0);
  const [definitions, setDefinitions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [identity, setIdentity] = useState(effectivePlayerId);
  const [visible, setVisible] = useState(false);
  const [recoveryPending, setRecovering] = useState(false);
  const recovering = recoveryPending || (visible && connection !== "live");
  const [completed, setCompleted] = useState<string[]>([]);
  const active = status === "active" && identity === effectivePlayerId;
  const ready =
    active &&
    definitions &&
    connection === "live" &&
    content.status === "synchronized";
  const busy = status === "logging-in" || (status === "active" && !ready);
  // Identity changes start a fresh boot, even when the transport singleton was live.
  // Reset before committing children for a new identity. A mount effect here
  // would race a child that synchronously acknowledges cached definitions.
  if (identity !== effectivePlayerId) {
    setIdentity(effectivePlayerId);
    setDefinitions(false);
    setError(null);
    setVisible(false);
    setRecovering(false);
    setCompleted([]);
  }
  useEffect(() => {
    if (status !== "active") return;
    if (visible && connection !== "live") setRecovering(true);
    if (!ready) return;
    if (!visible || recovering) {
      const labels = recovering
        ? ["Reconnect transport", "Synchronize world", "Connection restored."]
        : [
            "Authentication",
            "Load definitions",
            "Prepare graphics",
            "Synchronize world",
            "Battlefield ready.",
          ];
      actions.pushCommandHistory({
        command: "",
        output: labels.map((label) => `[OK] ${label}`).join("\n"),
      });
    }
    setVisible(true);
    setRecovering(false);
    setCompleted([]);
  }, [ready, visible, recovering, connection, status, actions]);
  const milestones = recovering
    ? [
        { label: "Reconnect transport", done: progress.transport },
        { label: "Synchronize world", done: ready },
      ]
    : [
        { label: "Authentication", done: status === "active" },
        { label: "Load definitions", done: active && definitions },
        {
          label: "Prepare graphics",
          done: active && definitions && content.status === "synchronized",
        },
        {
          label: "Synchronize world",
          done: active && definitions && connection === "live",
        },
      ];
  const doneKey = milestones
    .filter((item) => item.done)
    .map((item) => item.label)
    .join("|");
  useEffect(() => {
    if (busy)
      setCompleted((previous) => [
        ...new Set([...previous, ...doneKey.split("|").filter(Boolean)]),
      ]);
  }, [doneKey, busy]);
  const definitionsLoaded = useCallback(() => setDefinitions(true), []);
  const definitionsFailed = useCallback(
    (message: string) => setError(message),
    [],
  );
  const retry = useCallback(() => {
    setError(null);
    setDefinitions(false);
    setAttempt((value) => value + 1);
  }, []);
  return (
    <Context.Provider
      value={{
        ready,
        visible: active && visible,
        busy,
        recovering,
        milestones: milestones.map((item) => ({
          ...item,
          done: item.done || completed.includes(item.label),
          running:
            item.label === "Authentication"
              ? status === "logging-in"
              : item.label === "Load definitions"
                ? active
                : active && definitions,
        })),
        error:
          error ??
          (active && definitions && content.status === "failed"
            ? (content.error?.message ?? "Graphics preparation failed.")
            : null),
        retry,
        attempt,
        definitionsLoaded,
        definitionsFailed,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useBoot() {
  const value = useContext(Context);
  if (!value) throw new Error("BootProvider required");
  return value;
}
