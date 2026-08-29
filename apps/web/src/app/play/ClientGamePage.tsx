"use client";

import GameStage from "@/features/pixijs/components/GameStage";
import AudioEventBridge from "@/features/audio/components/AudioEventBridge";
import GameStateStreamBridge from "@/features/gamestate/components/GameStateStreamBridge";
import GameStreamGate from "@/features/gamestate/components/GameStreamGate";
import { HUDProvider } from "@/features/hud/components/HUDContext";
import { PlayerProvider } from "@/features/users/components/identity/PlayerContext";
import TerminalPanel from "@/features/hud/components/TerminalPanel";
import EntityDetailPanel from "@/features/hud/components/EntityDetailPanel";
import IntentQueuePanel from "@/features/intent-queue/IntentQueuePanel";
import { ResourceHUD } from "@/features/hud/components/ResourceHUD";
import { SessionProvider, useSession } from "@/features/users/components/identity/SessionContext";

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
          <EntityDetailPanel />
          <IntentQueuePanel />
          <GameStage />
        </GameStreamGate>
      </div>
      <TerminalPanel />
    </div>
  );
}
