"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function EntitiesStreamCounter() {
  const [snapshotCount, setSnapshotCount] = useState(0);
  const [deltaCount, setDeltaCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const errorCountRef = useRef(0);
  const router = useRouter();

  useEffect(() => {
    // Use the v2 SSE endpoint which emits named events: 'snapshot' and 'delta'
    const es = new EventSource("/api/v2/gamestate/stream");
    esRef.current = es;

    const onOpen = () => {
      setConnected(true);
      errorCountRef.current = 0;
    };
    const onError = async () => {
      setConnected(false);
      errorCountRef.current += 1;
      // Probe auth status to distinguish between transient network errors and 401
      try {
        const resp = await fetch('/api/players/me', { method: 'GET', headers: { Accept: 'application/json' } });
        if (resp.status === 401 || resp.status === 403) {
          // Not authenticated -> navigate to login
          router.push('/');
          return;
        }
      } catch {
        // network hiccup; fall through and let EventSource retry
      }
      // If EventSource has definitively closed, navigate to login as a fallback
      if (es.readyState === EventSource.CLOSED && errorCountRef.current > 1) {
        router.push('/');
      }
    };
    // Count both snapshot (bootstrap) and delta (live/gap) events separately
    const onSnapshot = () => setSnapshotCount((c) => c + 1);
    const onDelta = () => setDeltaCount((c) => c + 1);
    // Fallback for any default 'message' events if server ever sends them
    const onMessage = () => setDeltaCount((c) => c + 1);

    es.addEventListener("open", onOpen as EventListener);
    es.addEventListener("error", onError as EventListener);
    // v2 server emits named events: 'snapshot' and 'delta'
    es.addEventListener("snapshot", onSnapshot as EventListener);
    es.addEventListener("delta", onDelta as EventListener);
    // If server ever falls back to default 'message' events, count them too
    es.addEventListener("message", onMessage as EventListener);

    return () => {
      es.removeEventListener("open", onOpen as EventListener);
      es.removeEventListener("error", onError as EventListener);
      es.removeEventListener("snapshot", onSnapshot as EventListener);
      es.removeEventListener("delta", onDelta as EventListener);
      es.removeEventListener("message", onMessage as EventListener);
      es.close();
      esRef.current = null;
    };
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
      <span>Stream events: {snapshotCount}/{deltaCount}</span>
    </div>
  );
}
