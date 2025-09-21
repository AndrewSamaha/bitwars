"use client"

import type React from "react"

import GameStage from "@/features/pixijs/components/GameStage"
import GameStateStreamBridge from "@/features/gamestate/components/GameStateStreamBridge"
import { HUDProvider } from "@/features/hud/components/HUDContext"
import TerminalPanel from "@/features/hud/components/TerminalPanel"

export default function GamePage() {
  return (
    <HUDProvider>
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Bridge SSE stream into ECS */}
        <GameStateStreamBridge />
        {/* Floating Terminal */}
        <TerminalPanel />
        {/* Game Stage */}
        <GameStage />
      </div>
    </HUDProvider>
  )
}
