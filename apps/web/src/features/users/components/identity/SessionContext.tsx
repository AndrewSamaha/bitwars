"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { PlayerSchema } from "@/features/users/schema/player/player";
import { usePlayer } from "./PlayerContext";

export type SessionStatus = "logged-out" | "logging-in" | "active" | "logging-out";

type SessionContextValue = {
  status: SessionStatus;
  login: (name: string) => Promise<string>;
  logout: (onStarted?: () => void) => Promise<string>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const { player, setPlayer } = usePlayer();
  const [status, setStatus] = useState<SessionStatus>(player ? "active" : "logged-out");

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
    setStatus("logged-out");
    return "Logged out.";
  }, [player, setPlayer]);

  const value = useMemo(() => ({ status, login, logout }), [status, login, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used within a SessionProvider");
  return session;
}
