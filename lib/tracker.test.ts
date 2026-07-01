import { describe, it, expect } from "vitest";
import { ScrollTracker } from "./tracker";

describe("ScrollTracker", () => {
  it("accumulates absolute distance and down-only metrics", () => {
    const t = new ScrollTracker(1000);
    t.recordDelta(100, 800, 1001); // down 100
    t.recordDelta(-40, 800, 1002); // up 40
    const p = t.buildPayload("x.com", "2026-06-30");
    expect(p.totalPx).toBe(140);
    expect(p.downPx).toBe(100);
    expect(p.downViewports).toBeCloseTo(100 / 800, 5);
    expect(p.events).toBe(2);
    expect(p.lastSeenAt).toBe(1002);
  });

  it("ignores sub-threshold jitter", () => {
    const t = new ScrollTracker(0);
    t.recordDelta(1, 800, 1);
    expect(t.hasPending()).toBe(false);
  });

  it("reset zeroes counters but keeps max depth and restamps startedAt", () => {
    const t = new ScrollTracker(0);
    t.recordDelta(500, 800, 5);
    t.recordDepth(3000);
    t.reset(10);
    const p = t.buildPayload("x.com", "2026-06-30");
    expect(p.totalPx).toBe(0);
    expect(p.events).toBe(0);
    expect(p.maxDepthPx).toBe(3000); // kept across reset
    expect(p.startedAt).toBe(10); // restamped
  });

  it("tracks max depth as a high-water mark", () => {
    const t = new ScrollTracker(0);
    t.recordDepth(1000);
    t.recordDepth(500);
    t.recordDepth(2500);
    expect(t.buildPayload("x.com", "2026-06-30").maxDepthPx).toBe(2500);
  });
});
