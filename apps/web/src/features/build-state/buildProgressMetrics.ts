type RequestSample = {
  durationMs: number;
  bodyBytes: number;
  redisMs?: number;
  routeMs?: number;
};

function percentile(values: number[], fraction: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const value = sorted[Math.ceil(sorted.length * fraction) - 1];
  return value === undefined ? null : Math.round(value * 10) / 10;
}

function timingValue(header: string | null, name: string): number | undefined {
  const match = header?.match(new RegExp(`(?:^|,\\s*)${name};dur=([\\d.]+)`));
  const value = Number(match?.[1]);
  return Number.isFinite(value) && match ? value : undefined;
}

/** Opt-in, in-browser samples for comparing progress transports. */
export class BuildProgressMetrics {
  private startedAt = 0;
  private stoppedAt = 0;
  private requests: RequestSample[] = [];
  private streamEvents = 0;
  private streamBytes = 0;
  private unchangedResponses = 0;
  private appliedResponses = 0;
  private displayedAgesMs: number[] = [];
  private panelAgesMs: number[] = [];
  private frameMs: number[] = [];
  private lastFrameAt: number | undefined;
  private serverClockOffsetMs = 0;
  enabled = false;

  start(): void {
    this.requests = [];
    this.streamEvents = 0;
    this.streamBytes = 0;
    this.unchangedResponses = 0;
    this.appliedResponses = 0;
    this.displayedAgesMs = [];
    this.panelAgesMs = [];
    this.frameMs = [];
    this.lastFrameAt = undefined;
    this.serverClockOffsetMs = 0;
    this.startedAt = performance.now();
    this.stoppedAt = 0;
    this.enabled = true;
  }

  stop() {
    this.stoppedAt = performance.now();
    this.enabled = false;
    return this.summary();
  }

  recordRequest(
    sentAtMs: number,
    receivedAtMs: number,
    durationMs: number,
    bodyBytes: number,
    serverTimeMs: number | undefined,
    serverTiming: string | null,
  ): void {
    if (!this.enabled) return;
    this.requests.push({
      durationMs,
      bodyBytes,
      redisMs: timingValue(serverTiming, "redis"),
      routeMs: timingValue(serverTiming, "route"),
    });
    if (typeof serverTimeMs === "number" && Number.isFinite(serverTimeMs)) {
      this.serverClockOffsetMs = serverTimeMs - (sentAtMs + receivedAtMs) / 2;
    }
  }

  recordStreamEvent(bodyBytes: number): void {
    if (!this.enabled) return;
    this.streamEvents++;
    this.streamBytes += bodyBytes;
  }

  recordRenderedFrame(
    progressUpdatedAtMs: number | undefined,
    frameAtMs = performance.now(),
  ): void {
    if (!this.enabled) return;
    if (this.lastFrameAt !== undefined && this.frameMs.length < 20_000)
      this.frameMs.push(frameAtMs - this.lastFrameAt);
    this.lastFrameAt = frameAtMs;
    const age = this.ageOf(progressUpdatedAtMs);
    if (age !== undefined && this.displayedAgesMs.length < 20_000)
      this.displayedAgesMs.push(age);
  }

  recordAppliedResponse(changed: boolean): void {
    if (!this.enabled) return;
    this.appliedResponses++;
    if (!changed) this.unchangedResponses++;
  }

  recordPanelPaint(progressUpdatedAtMs: number | undefined): void {
    const age = this.ageOf(progressUpdatedAtMs);
    if (age !== undefined && this.panelAgesMs.length < 20_000)
      this.panelAgesMs.push(age);
  }

  private ageOf(progressUpdatedAtMs: number | undefined): number | undefined {
    if (
      !this.enabled ||
      typeof progressUpdatedAtMs !== "number" ||
      !Number.isFinite(progressUpdatedAtMs)
    )
      return undefined;
    return Date.now() + this.serverClockOffsetMs - progressUpdatedAtMs;
  }

  summary() {
    const durationMinutes = Math.max(
      ((this.stoppedAt || performance.now()) - this.startedAt) / 60_000,
      1 / 60_000,
    );
    const requestCount = this.requests.length;
    const renderedAgeP95Ms = percentile(this.displayedAgesMs, 0.95);
    return {
      durationSeconds: Math.round(durationMinutes * 600) / 10,
      requestCount,
      streamEventCount: this.streamEvents,
      streamBodyKiB: Math.round(this.streamBytes / 102.4) / 10,
      unchangedResponsePercent: this.appliedResponses
        ? Math.round(
            (this.unchangedResponses / this.appliedResponses) * 1_000,
          ) / 10
        : null,
      requestsPerMinute: Math.round((requestCount / durationMinutes) * 10) / 10,
      responseKiBPerMinute:
        Math.round(
          this.requests.reduce((total, sample) => total + sample.bodyBytes, 0) /
            durationMinutes /
            102.4,
        ) / 10,
      requestP95Ms: percentile(
        this.requests.map((sample) => sample.durationMs),
        0.95,
      ),
      redisP95Ms: percentile(
        this.requests.flatMap((sample) =>
          sample.redisMs === undefined ? [] : [sample.redisMs],
        ),
        0.95,
      ),
      routeP95Ms: percentile(
        this.requests.flatMap((sample) =>
          sample.routeMs === undefined ? [] : [sample.routeMs],
        ),
        0.95,
      ),
      renderedAgeSamples: this.displayedAgesMs.length,
      renderedAgeP50Ms: percentile(this.displayedAgesMs, 0.5),
      renderedAgeP95Ms,
      panelPaintSamples: this.panelAgesMs.length,
      panelAgeP95Ms: percentile(this.panelAgesMs, 0.95),
      frameP95Ms: percentile(this.frameMs, 0.95),
      framesOver33MsPercent: this.frameMs.length
        ? Math.round(
            (this.frameMs.filter((ms) => ms > 33).length /
              this.frameMs.length) *
              1_000,
          ) / 10
        : null,
      estimatedServerClockOffsetMs: Math.round(this.serverClockOffsetMs),
      meets500MsTarget:
        renderedAgeP95Ms === null ? null : renderedAgeP95Ms <= 500,
    };
  }
}

export const buildProgressMetrics = new BuildProgressMetrics();

declare global {
  interface Window {
    bitwarsBuildProgressMetrics: BuildProgressMetrics;
  }
}

if (typeof window !== "undefined")
  window.bitwarsBuildProgressMetrics = buildProgressMetrics;
