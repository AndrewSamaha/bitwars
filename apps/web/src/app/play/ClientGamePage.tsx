"use client";

import dynamic from "next/dynamic";
import AudioEventBridge from "@/features/audio/components/AudioEventBridge";
import GameStateStreamBridge from "@/features/gamestate/components/GameStateStreamBridge";
import GameStreamGate from "@/features/gamestate/components/GameStreamGate";
import { HUDProvider } from "@/features/hud/components/HUDContext";
import { PlayerProvider } from "@/features/users/components/identity/PlayerContext";
import TerminalPanel from "@/features/hud/components/TerminalPanel";
import EntityDetailPanel from "@/features/hud/components/EntityDetailPanel";
import IntentQueuePanel from "@/features/intent-queue/IntentQueuePanel";
import { ResourceHUD } from "@/features/hud/components/ResourceHUD";
import LifecycleToasts from "@/features/hud/components/LifecycleToasts";
import { SessionProvider, useSession } from "@/features/users/components/identity/SessionContext";

// Pixi accesses browser globals while its modules are initialized, so it must
// never be included in Next's server-rendered bundle.
const GameStage = dynamic(() => import("@/features/pixijs/components/GameStage"), {
  ssr: false,
});

/** Server passes serialized player (dates as ISO strings); PlayerProvider parses with PlayerSchema. */
type ClientGamePageProps = {
  initialPlayer: unknown;
};

export default function ClientGamePage({ initialPlayer }: ClientGamePageProps) {
  return (
    <PlayerProvider initialPlayer={initialPlayer}>
      <SessionProvider>
        <HUDProvider>
          <GameClientShell />
        </HUDProvider>
      </SessionProvider>
    </PlayerProvider>
  );
}

function GameClientShell() {
  const { status } = useSession();
  const fading = status !== "active";

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div
        className={`min-h-screen transition-opacity duration-500 ${fading ? "pointer-events-none opacity-0" : "opacity-100"}`}
        aria-hidden={fading}
      >
        <GameStreamGate>
          <AudioEventBridge />
          <GameStateStreamBridge />
          <ResourceHUD />
          <LifecycleToasts />
          <EntityDetailPanel />
          <IntentQueuePanel />
          <GameStage />
        </GameStreamGate>
      </div>
      <TerminalPanel />
    </div>
  );
}
