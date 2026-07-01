import { describe, it, expect } from "vitest";
import {
  PX_PER_MILE,
  PX_PER_KM,
  pxToMiles,
  pxToKm,
  pxToMetres,
  formatDistance,
  formatDistanceShort,
  metresToFloors,
  miToFloors,
  floorsToMi,
  formatFloors,
  formatFloorsShort,
} from "./distance";

describe("distance", () => {
  it("uses the exact CSS-pixel constants", () => {
    expect(PX_PER_MILE).toBe(6_082_560);
    expect(PX_PER_KM).toBeCloseTo(3_779_527.56, 2);
  });
  it("converts px to miles and km", () => {
    expect(pxToMiles(PX_PER_MILE)).toBe(1);
    expect(pxToKm(PX_PER_KM)).toBeCloseTo(1, 6);
  });
  it("derives metres consistent with the mile constant", () => {
    expect(pxToMetres(PX_PER_MILE)).toBeCloseTo(1609.344, 3);
  });

  it("formats distance meters-first, then mi/km", () => {
    expect(formatDistance(0, "mi")).toEqual({ value: "0", unit: "m" });
    expect(formatDistance(350, "mi")).toEqual({ value: "350", unit: "m" });
    expect(formatDistance(999, "km")).toEqual({ value: "999", unit: "m" });
    expect(formatDistance(2000, "mi")).toEqual({ value: "1.24", unit: "mi" });
    expect(formatDistance(2000, "km")).toEqual({ value: "2.00", unit: "km" });
    expect(formatDistanceShort(350, "mi")).toBe("350m");
    expect(formatDistanceShort(2000, "km")).toBe("2.00km");
  });
});

describe("floors", () => {
  it("formats metres as floors", () => {
    expect(formatFloorsShort(142)).toBe("44 floors"); // 1 floor ≈ 3.22 m
  });
  it("uses the singular for exactly one floor", () => {
    expect(formatFloors(3.2)).toEqual({ value: "1", unit: "floor" });
    expect(formatFloors(0)).toEqual({ value: "0", unit: "floors" });
  });
  it("defines a mile as 500 floors", () => {
    expect(Math.round(miToFloors(1))).toBe(500);
    expect(floorsToMi(miToFloors(1))).toBeCloseTo(1, 6);
  });
});
