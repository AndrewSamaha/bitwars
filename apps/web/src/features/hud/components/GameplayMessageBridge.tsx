"use client";

import { useEffect } from "react";
import { useSession } from "@/features/users/components/identity/SessionContext";
import { useHUD } from "./HUDContext";
import { subscribeGameplayMessages } from "../gameplayMessages";
import { formatMessage } from "../messages";

/** Semantic presentation events reach the Terminal even when audio is unavailable. */
export default function GameplayMessageBridge() {
  const { effectivePlayerId } = useSession();
  const { actions: { pushMessageLog } } = useHUD();
  useEffect(() => {
    if (!effectivePlayerId) return;
    return subscribeGameplayMessages(window, input => {
      pushMessageLog({ kind: input.kind, ...formatMessage(input), timestamp: Date.now() });
    });
  }, [effectivePlayerId, pushMessageLog]);
  return null;
}
