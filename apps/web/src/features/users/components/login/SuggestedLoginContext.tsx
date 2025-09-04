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
import { type SuggestedLoginDetails, SuggestedLoginDetailsSchema } from '@/features/users/schema/player/suggestedLoginDetails';
import { getSuggestedLoginDetails } from '@/features/users/server-functions/getSuggestedLogin';

type SuggestedLoginContextValue = {
  suggestedLoginDetails: SuggestedLoginDetails | null;
  loading: boolean;
  error: string | null;
  /** Refetch from the server (GET meEndpoint). */
  refresh: (opts?: { signal?: AbortSignal }) => Promise<SuggestedLoginDetails | null>;
};

const SuggestedLoginContext = createContext<SuggestedLoginContextValue | undefined>(undefined);

type SuggestedLoginProviderProps = {
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

export function SuggestedLoginProvider({
  children,
  initialPlayer,
  meEndpoint = '/api/players/getSuggestedLoginDetails',
  pollMs = 0,
}: SuggestedLoginProviderProps) {
  const parsed = useMemo(() => SuggestedLoginDetailsSchema.safeParse(getSuggestedLoginDetails()), []);
  const [suggestedLoginDetails, setSuggestedLoginDetails] = useState<SuggestedLoginDetails | null>(parsed.success ? parsed.data : null);
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
        setSuggestedLoginDetails(null);
        setLoading(false);
        return null;
      }

      if (!res.ok) {
        throw new Error(`Fetch failed (${res.status})`);
      }

      const data = await res.json();
      const check = SuggestedLoginDetailsSchema.safeParse(data);
      if (!check.success) {
        throw new Error('Invalid player payload');
      }

      setSuggestedLoginDetails(check.data);
      setLoading(false);
      return check.data;
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        // ignore cancellation noise
      } else {
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

  const value = useMemo<SuggestedLoginContextValue>(
    () => ({ suggestedLoginDetails, loading, error, refresh }),
    [suggestedLoginDetails, loading, error, refresh]
  );

  return <SuggestedLoginContext.Provider value={value}>{children}</SuggestedLoginContext.Provider>;
}

/** Hook to read the current player (can be null), plus loading/error/refresh. */
export function useSuggestedLoginDetails() {
  const ctx = useContext(SuggestedLoginContext);
  if (!ctx) throw new Error('useSuggestedLoginDetails must be used within a SuggestedLoginProvider');
  return ctx;
}

/** Convenience hook that throws if there is no logged-in player. */
export function useRequiredSuggestedLoginDetails() {
  const ctx = useSuggestedLoginDetails();
  if (!ctx.suggestedLoginDetails) throw new Error('No suggested login details in context');
  return ctx.suggestedLoginDetails;
}
