import { expect, it } from "vitest";
import { BuildProgressMetrics } from "../src/features/build-state/buildProgressMetrics";

it("reports progress age, request cost, and whether the 500 ms target is met", () => {
  const metrics = new BuildProgressMetrics();
  metrics.start();
  const now = Date.now();
  metrics.recordRequest(now, now, 12, 1024, now, "redis;dur=2, route;dur=8");
  metrics.recordAppliedResponse(false);
  metrics.recordRenderedFrame(now - 300, 100);
  metrics.recordRenderedFrame(now - 300, 116);
  metrics.recordRenderedFrame(now - 600, 156);
  metrics.recordPanelPaint(now - 300);

  const summary = metrics.stop();
  expect(summary.requestCount).toBe(1);
  expect(summary.unchangedResponsePercent).toBe(100);
  expect(summary.redisP95Ms).toBe(2);
  expect(summary.routeP95Ms).toBe(8);
  expect(summary.renderedAgeSamples).toBe(3);
  expect(summary.renderedAgeP95Ms).toBeGreaterThanOrEqual(600);
  expect(summary.meets500MsTarget).toBe(false);
  expect(summary.framesOver33MsPercent).toBe(50);
});
