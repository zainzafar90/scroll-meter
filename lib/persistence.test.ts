import { describe, it, expect, beforeEach, vi } from "vitest";
import { fakeBrowser } from "wxt/testing";
import { makeQueue } from "./queue";
import { applyPayload, dayKey, readDay } from "./storage";
import type { ScrollPayload } from "./types";

// Mirrors what entrypoints/background.ts does: serialize per-day writes through
// the recovering queue. This proves the queue + storage integration end to end.
const enqueue = makeQueue();
const p = (over: Partial<ScrollPayload> = {}): ScrollPayload => ({
  host: "x.com",
  dateKey: "2026-06-30",
  totalPx: 100,
  downPx: 80,
  downViewports: 0.5,
  maxDepthPx: 1000,
  events: 3,
  startedAt: 50,
  lastSeenAt: 100,
  ...over,
});

describe("persistence (queue + storage)", () => {
  beforeEach(() => fakeBrowser.reset());

  it("aggregates serialized flushes for a day", async () => {
    await enqueue(dayKey("2026-06-30"), () => applyPayload(p()));
    await enqueue(dayKey("2026-06-30"), () => applyPayload(p({ totalPx: 50, events: 2 })));
    const day = await readDay("2026-06-30");
    expect(day.hosts["x.com"].totalPx).toBe(150);
    expect(day.hosts["x.com"].events).toBe(5);
  });

  it("recovers from a failed write without poisoning the queue", async () => {
    const set = vi
      .spyOn(fakeBrowser.storage.local, "set")
      .mockRejectedValueOnce(new Error("disk full"));
    await expect(enqueue(dayKey("2026-06-30"), () => applyPayload(p()))).rejects.toThrow("disk full");
    set.mockRestore();

    await enqueue(dayKey("2026-06-30"), () => applyPayload(p({ totalPx: 50 })));
    const day = await readDay("2026-06-30");
    expect(day.hosts["x.com"].totalPx).toBe(50); // only the successful write landed
  });
});
