"use client"

import { useEffect, useState } from "react"

export default function BitWarsLoading() {
  const [dots, setDots] = useState("")

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."))
    }, 500)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        {/* Main Logo */}
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-primary mb-2">BitWars</h1>
          <div className="text-muted-foreground text-lg">Initializing Combat Systems</div>
        </div>

        {/* Tactical Grid Animation */}
        <div className="relative w-64 h-64 mx-auto mb-8">
          {/* Grid Background */}
          <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-1 opacity-20">
            {Array.from({ length: 64 }).map((_, i) => (
              <div key={i} className="bg-primary/20 rounded-sm" />
            ))}
          </div>

          {/* Scanning Line */}
          <div className="absolute inset-0">
            <div
              className="w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse"
              style={{
                animation: "scan 2s linear infinite",
                transformOrigin: "center",
              }}
            />
          </div>

          {/* Corner Brackets */}
          <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-primary animate-pulse" />
          <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-primary animate-pulse" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-primary animate-pulse" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-primary animate-pulse" />

          {/* Central Radar Sweep */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-2 border-primary/30 rounded-full relative">
              <div className="absolute inset-0 border-2 border-primary/60 rounded-full animate-ping" />
              <div
                className="absolute top-1/2 left-1/2 w-1 h-16 bg-gradient-to-t from-primary to-transparent origin-bottom transform -translate-x-1/2 -translate-y-full"
                style={{
                  animation: "radar 3s linear infinite",
                }}
              />
            </div>
          </div>

          {/* Tactical Markers */}
          <div className="absolute top-4 left-4 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <div
            className="absolute top-8 right-6 w-2 h-2 bg-blue-500 rounded-full animate-pulse"
            style={{ animationDelay: "0.5s" }}
          />
          <div
            className="absolute bottom-6 left-8 w-2 h-2 bg-green-500 rounded-full animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute bottom-4 right-4 w-2 h-2 bg-yellow-500 rounded-full animate-pulse"
            style={{ animationDelay: "1.5s" }}
          />
        </div>

        {/* Loading Text */}
        <div className="space-y-2">
          <div className="text-primary font-mono text-lg">Loading battlefield{dots}</div>
          <div className="text-muted-foreground text-sm font-mono">
            Deploying tactical systems • Establishing secure connection
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="mt-6 space-y-2 max-w-xs mx-auto">
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span>SYSTEMS</span>
            <span>ONLINE</span>
          </div>
          <div className="w-full bg-muted/20 rounded-full h-1">
            <div className="bg-primary h-1 rounded-full animate-pulse" style={{ width: "85%" }} />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% { transform: translateY(0) scaleX(0.8); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(256px) scaleX(0.8); opacity: 0; }
        }
        
        @keyframes radar {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
