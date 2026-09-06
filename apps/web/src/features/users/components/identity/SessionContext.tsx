"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { PlayerSchema } from "@/features/users/schema/player/player";
import { usePlayer } from "./PlayerContext";

export type SessionStatus = "logged-out" | "logging-in" | "active" | "logging-out";

type SessionContextValue = {
  status: SessionStatus;
  /** Owner whose world and controls are currently being viewed. */
  effectivePlayerId: string | null;
  actingAsId: string | null;
  login: (name: string) => Promise<string>;
  logout: (onStarted?: () => void) => Promise<string>;
  su: (playerId: string) => void;
  exitSu: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { player, setPlayer } = usePlayer();
  const [status, setStatus] = useState<SessionStatus>(player ? "active" : "logged-out");
  const [actingAsId, setActingAsId] = useState<string | null>(null);
  const effectivePlayerId = actingAsId ?? player?.id ?? null;

  const login = useCallback(async (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) throw new Error("Login name is required.");

    setStatus("logging-in");
    try {
      const response = await fetch("/api/players/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name: trimmedName, color: "" }),
      });
      if (!response.ok) throw new Error(`Login failed (${response.status})`);

      const payload = (await response.json()) as { player?: unknown };
      const parsed = PlayerSchema.safeParse(payload.player);
      if (!parsed.success) throw new Error("Login returned an invalid player.");

      setPlayer(parsed.data);
      setActingAsId(null);
      setStatus("active");
      return `Welcome, ${parsed.data.name}.`;
    } catch (error) {
      setStatus("logged-out");
      throw error;
    }
  }, [setPlayer]);

  const logout = useCallback(async (onStarted?: () => void) => {
    if (!player) throw new Error("Not authenticated.");

    const startResponse = await fetch("/api/players/start-logout", { method: "POST" });
    if (!startResponse.ok) throw new Error(`Logout failed (${startResponse.status})`);

    setStatus("logging-out");
    onStarted?.();
    await new Promise((resolve) => window.setTimeout(resolve, 500));

    const response = await fetch("/api/players/logout", { method: "POST" });
    if (!response.ok) {
      setStatus("active");
      throw new Error(`Logout failed (${response.status})`);
    }

    setPlayer(null);
    setActingAsId(null);
    setStatus("logged-out");
    return "Logged out.";
  }, [player, setPlayer]);

  const su = useCallback((playerId: string) => setActingAsId(playerId), []);
  const exitSu = useCallback(() => setActingAsId(null), []);
  const value = useMemo(
    () => ({ status, effectivePlayerId, actingAsId, login, logout, su, exitSu }),
    [status, effectivePlayerId, actingAsId, login, logout, su, exitSu],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used within a SessionProvider");
  return session;
}
