import { describe, it, expect } from "vitest";
import { summarizeHome } from "./home";
import { DEFAULT_SETTINGS, type DayRecord } from "./types";

const MILE_PX = 6_082_560; // pxToMiles(MILE_PX) === 1
const host = (totalPx: number) => ({
  totalPx,
  downPx: totalPx,
  downViewports: 1,
  maxDepthPx: totalPx,
  events: 1,
  firstSeenAt: 0,
  lastSeenAt: 1,
});
const day = (
  dateKey: string,
  hosts: Record<string, ReturnType<typeof host>>,
): Record<string, DayRecord> => ({
  [`sm:day:${dateKey}`]: { version: 1, dateKey, hosts },
});

describe("summarizeHome", () => {
  const today = "2026-07-01";

  it("totals today, ranks sites, builds a 7-day week ending today", () => {
    const all = {
      ...day(today, { "x.com": host(MILE_PX), "reddit.com": host(MILE_PX / 2) }),
      ...day("2026-06-30", { "x.com": host(MILE_PX / 4) }),
      "sm:settings": { ...DEFAULT_SETTINGS },
    };
    const d = summarizeHome(all, today, DEFAULT_SETTINGS);
    expect(Math.round(d.metres)).toBe(Math.round(1.5 * 1609.344)); // 1.5 mi today
    expect(d.sites.map((s) => s.host)).toEqual(["x.com", "reddit.com"]);
    expect(d.week).toHaveLength(7);
    expect(Math.round(d.week[6])).toBe(Math.round(1.5 * 1609.344)); // today is last
    expect(Math.round(d.week[5])).toBe(Math.round(0.25 * 1609.344)); // yesterday
    expect(d.week[0]).toBe(0); // 6 days ago, no data
  });

  it("computes goalFraction against the daily limit", () => {
    const all = day(today, { "x.com": host(MILE_PX) }); // 1 mi
    const d = summarizeHome(all, today, { ...DEFAULT_SETTINGS, dailyGoalMi: 2 });
    expect(d.goalFraction).toBeCloseTo(0.5, 5);
  });

  it("caps sites at topN", () => {
    const all = day(today, {
      a: host(5),
      b: host(4),
      c: host(3),
      d: host(2),
      e: host(1),
    });
    const out = summarizeHome(all, today, DEFAULT_SETTINGS, 4);
    expect(out.sites).toHaveLength(4);
    expect(out.sites[0].host).toBe("a");
  });

  it("is empty-safe", () => {
    const d = summarizeHome({}, today, DEFAULT_SETTINGS);
    expect(d.metres).toBe(0);
    expect(d.sites).toEqual([]);
    expect(d.streak).toBe(0);
    expect(d.week).toHaveLength(7);
  });
});
