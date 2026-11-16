/** Transport health is separate from an intentional server pause. */
export class GameConnection {
  private listeners = new Set<() => void>();
  private state: "connecting" | "live" | "reconnecting" = "connecting";
  private snapshot = false;
  private reconciled = false;
  private healthyAt = -Infinity;
  private hasLoaded = false;
  private transportOpen = false;
  private progress = { transport: false, snapshot: false, reconciled: false, healthy: false };
  getProgress = () => this.progress;
  opened() { this.transportOpen = true; this.update(performance.now()); }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private update(now: number) {
    const next = this.snapshot && this.reconciled && now - this.healthyAt < 2500
      ? "live" : this.hasLoaded ? "reconnecting" : "connecting";
    if (next === "live") this.hasLoaded = true;
    const progress = { transport: this.transportOpen, snapshot: this.snapshot, reconciled: this.reconciled, healthy: now - this.healthyAt < 2500 };
    const changed = Object.keys(progress).some(key => progress[key as keyof typeof progress] !== this.progress[key as keyof typeof progress]);
    if (next === this.state && !changed) return;
    this.progress = progress;
    this.state = next;
    for (const listener of this.listeners) listener();
  }
  reset() {
    this.hasLoaded = false;
    this.begin();
  }
  begin() {
    this.transportOpen = false;
    this.snapshot = false;
    this.reconciled = false;
    this.healthyAt = -Infinity;
    this.update(performance.now());
  }
  receivedSnapshot() { this.snapshot = true; this.update(performance.now()); }
  reconciledIntents() { this.reconciled = true; this.update(performance.now()); }
  health(healthy: boolean, now = performance.now()) {
    this.healthyAt = healthy ? now : -Infinity;
    this.update(now);
  }
  check(now = performance.now()) { this.update(now); return this.state === "live"; }
  disconnect() { this.begin(); }
}
export const gameConnection = new GameConnection();
