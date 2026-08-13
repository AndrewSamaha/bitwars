"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePlayer } from "@/features/users/components/identity/PlayerContext";
import LoadingAnimation from "@/components/LoadingAnimation";
import { useSession } from "@/features/users/components/identity/SessionContext";

/**
 * Solution D: Only mount children (including GameStateStreamBridge) after /me has
 * returned. Ensures current player id (and resource_ledger) are available before
 * the EventSource opens and the first snapshot is applied.
 */
export default function GameStreamGate({ children }: { children: React.ReactNode }) {
  const { player, loading } = usePlayer();
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (loading || player != null || status !== "active") return;
    console.log('[GameStreamGate] redirect: !loading && !player');
    router.replace("/");
  }, [loading, player, router, status]);

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

  return <>{children}</>;
}
