"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function EntitiesStreamCounter() {
  const [count, setCount] = useState(0);
  const [connected, setConnected] = useState(false);
  const esRef = useRef<EventSource | null>(null);
  const errorCountRef = useRef(0);
  const router = useRouter();

  useEffect(() => {
    const es = new EventSource("/api/gamestate/stream");
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
    const onEntities = () => setCount((c) => c + 1);

    es.addEventListener("open", onOpen as EventListener);
    es.addEventListener("error", onError as EventListener);
    // Server emits named event: 'entities'
    es.addEventListener("entities", onEntities as EventListener);
    // If server ever falls back to default 'message' events, count them too
    es.addEventListener("message", onEntities as EventListener);

    return () => {
      es.removeEventListener("open", onOpen as EventListener);
      es.removeEventListener("error", onError as EventListener);
      es.removeEventListener("entities", onEntities as EventListener);
      es.removeEventListener("message", onEntities as EventListener);
      es.close();
      esRef.current = null;
    };
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <span className={`h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
      <span>Stream events: {count}</span>
    </div>
  );
}
