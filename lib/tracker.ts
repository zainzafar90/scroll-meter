import type { ScrollPayload } from "./types";

// Pure, DOM-free scroll accumulator. The content script feeds it deltas + depth
// and timestamps; it owns no globals so it is fully unit-testable.
export class ScrollTracker {
  private totalPx = 0;
  private downPx = 0;
  private downViewports = 0;
  private events = 0;
  private maxDepthPx = 0;
  private startedAt: number;
  private lastSeenAt: number;
  private readonly minDeltaPx: number;

  constructor(now: number, minDeltaPx = 2) {
    this.startedAt = now;
    this.lastSeenAt = now;
    this.minDeltaPx = minDeltaPx;
  }

  recordDelta(dy: number, viewportH: number, now: number): void {
    const dist = Math.abs(dy);
    if (dist < this.minDeltaPx) return;
    this.totalPx += dist;
    if (dy > 0) {
      this.downPx += dy;
      this.downViewports += dy / Math.max(1, viewportH);
    }
    this.events += 1;
    this.lastSeenAt = now;
  }

  recordDepth(depthPx: number): void {
    if (depthPx > this.maxDepthPx) this.maxDepthPx = depthPx;
  }

  hasPending(): boolean {
    return this.events > 0;
  }

  buildPayload(host: string, dateKey: string): ScrollPayload {
    return {
      host,
      dateKey,
      totalPx: Math.round(this.totalPx),
      downPx: Math.round(this.downPx),
      downViewports: this.downViewports,
      maxDepthPx: Math.round(this.maxDepthPx),
      events: this.events,
      startedAt: this.startedAt,
      lastSeenAt: this.lastSeenAt,
    };
  }

  // Zero the per-flush counters but KEEP maxDepthPx (running high-water) and restamp startedAt.
  reset(now: number): void {
    this.totalPx = 0;
    this.downPx = 0;
    this.downViewports = 0;
    this.events = 0;
    this.startedAt = now;
  }
}
