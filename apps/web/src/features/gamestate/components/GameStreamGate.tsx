"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/features/users/components/identity/PlayerContext";
import { useBoot } from "./BootContext";
import { useSession } from "@/features/users/components/identity/SessionContext";
import { contentManager, type ContentData } from "@/features/content/contentManager";

/** Wait for player identity and content before starting the world stream and renderer. */
export default function GameStreamGate({ children }: { children: React.ReactNode }) {
  const { player, loading } = usePlayer();
  const { status, effectivePlayerId } = useSession();
  const router = useRouter();
  const [contentReady, setContentReady] = useState(false);
  const [loadedKey, setLoadedKey] = useState("");
  const { attempt, definitionsLoaded, definitionsFailed } = useBoot();
  const playerId = player?.id;

  useEffect(() => {
    if (loading || player != null || status !== "active") return;
    console.log('[GameStreamGate] redirect: !loading && !player');
    router.replace("/");
  }, [loading, player, router, status]);

  useEffect(() => {
    if (loading || !playerId) return;
    const controller = new AbortController();
    setContentReady(false);

    // A clean browser has no cached content. Load it before either the stream
    // or Pixi mounts, so the first snapshot has entity presentation metadata.
    void (async () => {
      try {
        const response = await fetch("/api/v2/content", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Content request failed: ${response.status}`);
        const content = await response.json() as ContentData;
        if (controller.signal.aborted) return;
        contentManager.loadBundle(content);
        setLoadedKey(`${effectivePlayerId}:${attempt}`);
        setContentReady(true);
        definitionsLoaded();
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("[GameStreamGate] content load failed", error);
        definitionsFailed(error instanceof Error ? error.message : String(error));
      }
    })();

    return () => controller.abort();
  }, [loading, playerId, effectivePlayerId, attempt, definitionsLoaded, definitionsFailed]);

  if (loading || !player || !contentReady || loadedKey !== `${effectivePlayerId}:${attempt}`) return null;
  return <>{children}</>;
}
