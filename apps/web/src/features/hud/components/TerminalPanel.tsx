"use client"

import { useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EntitiesStreamCounter from "@/features/gamestate/components/EntitiesStreamCounter";
import EcsEntityCount from "@/features/gamestate/components/EcsEntityCount";
import { useHUD } from "@/features/hud/components/HUDContext";

export default function TerminalPanel() {
  const { selectors, actions, refs } = useHUD();
  const { isTerminalOpen, currentCommand, commandHistory } = selectors;
  const { terminalRef, inputRef } = refs;

  // Scroll to bottom when history changes
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commandHistory, terminalRef]);

  // Focus input when terminal opens
  useEffect(() => {
    if (isTerminalOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isTerminalOpen, inputRef]);

  const handleCommand = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const cmd = currentCommand.trim();
      if (!cmd) return;

      actions.pushCommandHistory({ command: cmd, output: `${cmd}: command not found` });
      actions.setTerminalInput("");
    },
    [currentCommand, actions]
  );

  const handleTerminalClick = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  return (
    <div className={`fixed left-4 top-4 bottom-4 z-50 ${isTerminalOpen ? "w-96" : "w-12"}`}>
      {/* Toggle Button */}
      <Button
        onClick={() => actions.toggleTerminal()}
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
              <EcsEntityCount />
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
                {entry.output && (
                  <div className="whitespace-pre-line text-green-400 mb-1">{entry.output}</div>
                )}
              </div>
            ))}

            {/* Current Input Line */}
            <form onSubmit={handleCommand} className="flex">
              <span className="text-blue-400">user@bitwars:~$ </span>
              <Input
                ref={inputRef}
                value={currentCommand}
                onChange={(e) => actions.setTerminalInput(e.target.value)}
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
  );
}
