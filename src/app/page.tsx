import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sword, Shield, Zap, Users } from "lucide-react"
import { getSuggestedLoginDetails } from "@/features/users/server-functions/getSuggestedLogin"
import { Suspense } from "react"
import LoginForm from "@/features/users/components/login/LoginForm"

export default function BitWarsLanding() {
  const suggestedLoginDetailsPromise = getSuggestedLoginDetails();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">BitWars</h1>
              <p className="text-muted-foreground">Engage in Tactical Warfare</p>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-4 text-balance">Command Your Forces</h2>
          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
            Enter the battlefield where strategy meets action. Build your army, forge alliances, and dominate the
            digital warzone in real-time tactical combat.
          </p>

          {/* Join Game Form */}
          <Card className="max-w-md mx-auto mb-12">
            <CardHeader>
              <CardTitle>Join the Battle</CardTitle>
              <CardDescription>Choose your commander name and battle colors</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Suspense fallback={<div className="text-sm text-muted-foreground">Loading suggestions…</div>}>
                <LoginForm suggestedLoginDetailsPromise={suggestedLoginDetailsPromise} />
              </Suspense>
            </CardContent>
          </Card>
        </div>

        {/* Game Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center">
            <CardHeader>
              <Sword className="w-12 h-12 mx-auto text-primary mb-2" />
              <CardTitle>Real-Time Combat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Engage in fast-paced battles where every second counts and tactical decisions determine victory.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Shield className="w-12 h-12 mx-auto text-primary mb-2" />
              <CardTitle>Strategic Defense</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Build fortifications and defensive structures to protect your base from enemy assaults.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Zap className="w-12 h-12 mx-auto text-primary mb-2" />
              <CardTitle>Power Upgrades</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Research advanced technologies and upgrade your units to gain the upper hand in battle.
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="w-12 h-12 mx-auto text-primary mb-2" />
              <CardTitle>Multiplayer Warfare</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Form alliances or wage war against players worldwide in massive multiplayer battles.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            <p>&copy; 2024 BitWars. All rights reserved. Prepare for digital warfare.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
