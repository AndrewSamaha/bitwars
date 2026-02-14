"use client";

import GameStage from "@/features/pixijs/components/GameStage";
import GameStateStreamBridge from "@/features/gamestate/components/GameStateStreamBridge";
import GameStreamGate from "@/features/gamestate/components/GameStreamGate";
import { HUDProvider } from "@/features/hud/components/HUDContext";
import { PlayerProvider } from "@/features/users/components/identity/PlayerContext";
import TerminalPanel from "@/features/hud/components/TerminalPanel";
import EntityDetailPanel from "@/features/hud/components/EntityDetailPanel";
import IntentQueuePanel from "@/features/intent-queue/IntentQueuePanel";
import { ResourceHUD } from "@/features/hud/components/ResourceHUD";

/** Server passes serialized player (dates as ISO strings); PlayerProvider parses with PlayerSchema. */
type ClientGamePageProps = {
  initialPlayer: unknown;
};

export default function ClientGamePage({ initialPlayer }: ClientGamePageProps) {
  return (
    <PlayerProvider initialPlayer={initialPlayer}>
      <HUDProvider>
        <GameStreamGate>
          <div className="min-h-screen bg-black relative overflow-hidden">
            <GameStateStreamBridge />
            <ResourceHUD />
            <TerminalPanel />
            <EntityDetailPanel />
            <IntentQueuePanel />
            <GameStage />
          </div>
        </GameStreamGate>
      </HUDProvider>
    </PlayerProvider>
  );
}
