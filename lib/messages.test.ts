import { describe, it, expect } from "vitest";
import { isScrollMessage } from "./messages";
import type { ScrollPayload } from "./types";

const payload = (over: Partial<ScrollPayload> = {}): ScrollPayload => ({
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

describe("messages", () => {
  it("accepts a well-formed scroll-flush", () => {
    expect(isScrollMessage({ type: "scroll-flush", payload: payload() })).toBe(true);
  });
  it("rejects bad type, partial payload, non-numeric fields, and non-objects", () => {
    expect(isScrollMessage({ type: "nope", payload: payload() })).toBe(false);
    expect(isScrollMessage({ type: "scroll-flush", payload: { host: "x.com" } })).toBe(false);
    expect(isScrollMessage({ type: "scroll-flush", payload: { ...payload(), totalPx: "100" } })).toBe(false);
    expect(isScrollMessage(null)).toBe(false);
    expect(isScrollMessage("scroll-flush")).toBe(false);
  });
});
