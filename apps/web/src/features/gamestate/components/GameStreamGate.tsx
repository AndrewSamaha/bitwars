"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/features/users/components/identity/PlayerContext";
import LoadingAnimation from "@/components/LoadingAnimation";
import { useSession } from "@/features/users/components/identity/SessionContext";
import { contentManager, type ContentData } from "@/features/content/contentManager";

/** Wait for player identity and content before starting the world stream and renderer. */
export default function GameStreamGate({ children }: { children: React.ReactNode }) {
  const { player, loading } = usePlayer();
  const { status } = useSession();
  const router = useRouter();
  const [contentReady, setContentReady] = useState(false);
  const [contentError, setContentError] = useState(false);
  const [retry, setRetry] = useState(0);
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
    setContentError(false);

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
        setContentReady(true);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("[GameStreamGate] content load failed", error);
        setContentError(true);
      }
    })();

    return () => controller.abort();
  }, [loading, playerId, retry]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingAnimation />
      </div>
    );
  }

  if (!player) {
    return null;
  }

  if (contentError) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4 text-white">
        <p>Unable to load game content.</p>
        <button className="rounded border border-white px-4 py-2" onClick={() => setRetry((value) => value + 1)} type="button">
          Retry
        </button>
      </div>
    );
  }

  if (!contentReady) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingAnimation />
      </div>
    );
  }

  return <>{children}</>;
}
