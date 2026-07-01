import { describe, it, expect } from "vitest";
import { dateKey, addDays, computeStreak, longestStreak } from "./streak";

describe("streak", () => {
  it("formats local dateKey", () => {
    expect(dateKey(new Date(2026, 5, 30))).toBe("2026-06-30"); // month is 0-based
  });
  it("steps days and crosses month boundaries", () => {
    expect(addDays("2026-06-30", -1)).toBe("2026-06-29");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28"); // 2026 not a leap year
  });
  it("counts consecutive under-goal days ending today", () => {
    const totals = new Map([
      ["2026-06-28", 0.4],
      ["2026-06-29", 0.6],
      ["2026-06-30", 0.2],
    ]);
    expect(computeStreak(totals, "2026-06-30", 1.0)).toBe(3);
  });
  it("breaks on a past over-goal day", () => {
    const totals = new Map([
      ["2026-06-29", 1.4],
      ["2026-06-30", 0.2],
    ]);
    expect(computeStreak(totals, "2026-06-30", 1.0)).toBe(1);
  });
  it("bridges a zero-activity day (neutral)", () => {
    const totals = new Map([
      ["2026-06-28", 0.4],
      ["2026-06-30", 0.2],
    ]); // 29th absent
    expect(computeStreak(totals, "2026-06-30", 1.0)).toBe(2);
  });
  it("drops today live when it crosses the goal", () => {
    const totals = new Map([
      ["2026-06-29", 0.5],
      ["2026-06-30", 1.2],
    ]);
    expect(computeStreak(totals, "2026-06-30", 1.0)).toBe(1); // today excluded, 29th counts
  });
});

describe("longestStreak", () => {
  const goal = 1;
  it("counts the longest run of under-limit days", () => {
    const m = new Map([
      ["2026-06-01", 0.3],
      ["2026-06-02", 0.4],
      ["2026-06-03", 0.5],
      ["2026-06-04", 1.5], // at/over limit → breaks
      ["2026-06-05", 0.2],
    ]);
    expect(longestStreak(m, goal)).toBe(3);
  });
  it("bridges zero/absent days without breaking the run", () => {
    const m = new Map([
      ["2026-06-01", 0.3],
      // 2026-06-02 absent (neutral)
      ["2026-06-03", 0.0], // zero (neutral)
      ["2026-06-04", 0.4],
    ]);
    expect(longestStreak(m, goal)).toBe(2);
  });
  it("returns 0 with no data", () => {
    expect(longestStreak(new Map(), goal)).toBe(0);
  });
});
