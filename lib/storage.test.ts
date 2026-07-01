import { describe, it, expect, beforeEach } from "vitest";
import { fakeBrowser } from "wxt/testing";
import {
  mergeHost,
  dayKey,
  readDay,
  applyPayload,
  writeSettings,
  readSettings,
  pruneOldDays,
} from "./storage";
import type { ScrollPayload } from "./types";

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

describe("storage", () => {
  beforeEach(() => fakeBrowser.reset());

  it("dayKey is prefixed", () => expect(dayKey("2026-06-30")).toBe("sm:day:2026-06-30"));

  it("mergeHost is additive, max-depth, min/max time", () => {
    const a = mergeHost(undefined, p());
    const b = mergeHost(a, p({ totalPx: 50, maxDepthPx: 500, startedAt: 10, lastSeenAt: 200, events: 2 }));
    expect(b.totalPx).toBe(150);
    expect(b.events).toBe(5);
    expect(b.maxDepthPx).toBe(1000);
    expect(b.firstSeenAt).toBe(10);
    expect(b.lastSeenAt).toBe(200);
  });

  it("applyPayload accumulates per host across flushes", async () => {
    await applyPayload(p());
    await applyPayload(p({ totalPx: 50, events: 2 }));
    const day = await readDay("2026-06-30");
    expect(day.hosts["x.com"].totalPx).toBe(150);
    expect(day.hosts["x.com"].events).toBe(5);
  });

  it("round-trips settings over defaults", async () => {
    await writeSettings({ dailyGoalMi: 2 });
    const s = await readSettings();
    expect(s.dailyGoalMi).toBe(2);
    expect(s.theme).toBe("auto"); // default preserved
    expect(s.position).toBe("bottom-right");
  });

  it("prunes days older than the cutoff", async () => {
    await applyPayload(p({ dateKey: "2026-01-01" }));
    await applyPayload(p({ dateKey: "2026-06-30" }));
    await pruneOldDays(90, "2026-06-30");
    expect((await readDay("2026-01-01")).hosts["x.com"]).toBeUndefined();
    expect((await readDay("2026-06-30")).hosts["x.com"]).toBeDefined();
  });
});
