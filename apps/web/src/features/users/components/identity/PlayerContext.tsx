'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { PlayerSchema, type Player } from '@/features/users/schema/player/player'; // <-- adjust path if needed

type PlayerContextValue = {
  player: Player | null;
  loading: boolean;
  error: string | null;
  /** Refetch from the server (GET meEndpoint). */
  refresh: (opts?: { signal?: AbortSignal }) => Promise<Player | null>;
  /** Imperatively set/clear the current player (e.g., after login/logout). */
  setPlayer: (p: Player | null) => void;
};

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

type PlayerProviderProps = {
  children: React.ReactNode;

  /**
   * Optional server-provided initial value (e.g., from a server component).
   * It will be validated with PlayerSchema. If validation fails, it’s ignored.
   */
  initialPlayer?: unknown;

  /**
   * Endpoint that returns the current player JSON.
   * Should respond with 200 + Player or 204/404 when not logged in.
   * Default: /api/players/me
   */
  meEndpoint?: string;

  /**
   * Optional polling interval (ms) to auto-refresh the player (e.g., keep lastSeen fresh).
   * Omit/0 to disable polling. Example: 30_000 for 30s.
   */
  pollMs?: number;
};

export function PlayerProvider({
  children,
  initialPlayer,
  meEndpoint = '/api/players/me',
  pollMs = 0,
}: PlayerProviderProps) {
  const parsed = useMemo(() => PlayerSchema.safeParse(initialPlayer), [initialPlayer]);
  const [player, setPlayer] = useState<Player | null>(parsed.success ? parsed.data : null);
  const [loading, setLoading] = useState<boolean>(!parsed.success); // if no valid initial value, we’ll fetch
  const [error, setError] = useState<string | null>(null);

  const endpointRef = useRef(meEndpoint);
  endpointRef.current = meEndpoint;

  const refresh = useCallback(async (opts?: { signal?: AbortSignal }) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(endpointRef.current, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
        signal: opts?.signal,
      });

      if (res.status === 204 || res.status === 404) {
        console.log('[PlayerContext] /me returned', res.status, '-> setPlayer(null)');
        setPlayer(null);
        setLoading(false);
        return null;
      }

      if (!res.ok) {
        console.log('[PlayerContext] /me non-ok', { status: res.status });
        throw new Error(`Fetch failed (${res.status})`);
      }

      const data = await res.json();
      const check = PlayerSchema.safeParse(data);
      if (!check.success) {
        throw new Error('Invalid player payload');
      }

      console.log('[PlayerContext] /me success', { id: check.data.id });
      setPlayer(check.data);
      setLoading(false);
      return check.data;
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        // ignore cancellation noise
      } else {
        console.log('[PlayerContext] /me fetch failed', e?.message ?? e);
        setError(e?.message ?? 'Failed to load player');
      }
      setLoading(false);
      return null;
    }
  }, []);

  // Initial fetch if we didn’t get a valid initial player from the server.
  useEffect(() => {
    if (parsed.success) return;
    const ctrl = new AbortController();
    refresh({ signal: ctrl.signal });
    return () => ctrl.abort();
  }, [parsed.success, refresh]);

  // Optional polling to keep the player fresh (e.g., to reflect lastSeen updates).
  useEffect(() => {
    if (!pollMs) return;
    let cancelled = false;

    const tick = async () => {
      if (cancelled) return;
      await refresh();
      if (cancelled) return;
      timer = window.setTimeout(tick, pollMs);
    };

    let timer = window.setTimeout(tick, pollMs);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [pollMs, refresh]);

  const value = useMemo<PlayerContextValue>(
    () => ({ player, loading, error, refresh, setPlayer }),
    [player, loading, error, refresh]
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

/** Hook to read the current player (can be null), plus loading/error/refresh. */
export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within a PlayerProvider');
  return ctx;
}

/** Convenience hook that throws if there is no logged-in player. */
export function useRequiredPlayer() {
  const ctx = usePlayer();
  if (!ctx.player) throw new Error('No player in context');
  return ctx.player;
}

/** M6: Current player id for ownership checks (null when not logged in). */
export function useCurrentPlayerId(): string | null {
  const ctx = usePlayer();
  return ctx.player?.id ?? null;
}
