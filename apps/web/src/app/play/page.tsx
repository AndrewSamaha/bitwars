"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import EntitiesStreamCounter from "@/features/gamestate/components/EntitiesStreamCounter"
import GameStage from "@/features/pixijs/components/GameStage"

interface CommandHistory {
  command: string
  output: string
}

export default function GamePage() {
  const [isTerminalOpen, setIsTerminalOpen] = useState(true)
  const [currentCommand, setCurrentCommand] = useState("")
  const [commandHistory, setCommandHistory] = useState<CommandHistory[]>([
    { command: "", output: "BitWars Terminal v1.0.0\nType 'help' for available commands.\n" },
  ])
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [commandHistory])

  useEffect(() => {
    if (isTerminalOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isTerminalOpen])

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentCommand.trim()) return

    const newEntry: CommandHistory = {
      command: currentCommand,
      output: `${currentCommand}: command not found`,
    }

    setCommandHistory((prev) => [...prev, newEntry])
    setCurrentCommand("")
  }

  const handleTerminalClick = () => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Floating Terminal */}
      <div
        className={`fixed left-4 top-4 bottom-4 z-50 ${isTerminalOpen ? "w-96" : "w-12"}`}
      >
        {/* Toggle Button */}
        <Button
          onClick={() => setIsTerminalOpen(!isTerminalOpen)}
          size="sm"
          variant="outline"
          className="absolute right-0 mr-1 top-2 z-10 bg-card border-border hover:bg-accent"
        >
          {isTerminalOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </Button>

        {/* Terminal Window */}
        {isTerminalOpen && (
          <div className="h-full bg-opacity-95 border border-border rounded-lg shadow-2xl flex flex-col">
            {/* Terminal Header */}
            <div className="flex items-center justify-between gap-2 p-3 border-b border-border bg-muted/50 rounded-t-lg">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">BitWars Terminal</span>
                <EntitiesStreamCounter />
              </div>
              
            </div>

            {/* Terminal Content */}
            <div
              ref={terminalRef}
              onClick={handleTerminalClick}
              className="flex-1 bg-transparent p-4 overflow-y-auto font-mono text-sm bg-black bg-opacity-90 text-green-400 cursor-text"
            >
              {commandHistory.map((entry, index) => (
                <div key={index} className="mb-2">
                  {entry.command && (
                    <div className="flex">
                      <span className="text-blue-400">user@bitwars:~$ </span>
                      <span className="ml-2 text-white">{entry.command}</span>
                    </div>
                  )}
                  {entry.output && <div className="whitespace-pre-line text-green-400 mb-1">{entry.output}</div>}
                </div>
              ))}

              {/* Current Input Line */}
              <form onSubmit={handleCommand} className="flex">
                <span className="text-blue-400">user@bitwars:~$ </span>
                <Input
                  ref={inputRef}
                  value={currentCommand}
                  onChange={(e) => setCurrentCommand(e.target.value)}
                  className="flex-1 ml-2 -mt-2 bg-transparent border-none p-0 text-white font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder=""
                  autoComplete="off"
                />
              </form>
            </div>
          </div>
        )}

        {/* Collapsed Terminal Icon */}
        {!isTerminalOpen && (
          <div className="h-12 w-12 bg-card border border-border rounded-lg flex items-center justify-center shadow-lg">
            {/* <Terminal className="w-5 h-5 text-primary" /> */}
          </div>
        )}
      </div>
      <GameStage />
    </div>
  )
}
